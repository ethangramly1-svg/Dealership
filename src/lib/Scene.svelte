<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { GLTF } from '@threlte/extras';
  import { scrollState } from './scroll.svelte';
  import { labelState } from './labels.svelte';
  import { loadState } from './loadState.svelte';
  import Denali from './Denali.svelte';
  import { base } from '$app/paths';
  import { Box3, Quaternion, Vector3 } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import type { PerspectiveCamera, Object3D } from 'three';

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  // ─── Corridor layout ─────────────────────────────────────────────
  // Three cars at fixed world positions. Camera flies down the corridor
  // and orbits each in turn. Distances chosen so each car gets ~30% of
  // total scroll, with transit between cars.
  // ─────────────────────────────────────────────────────────────────
  const FERRARI_POS: [number, number, number] = [0, 0, 0];
  const TOYCAR_POS: [number, number, number] = [0, 0, -12];
  const TRUCK_POS: [number, number, number] = [0, 0, -32];
  // ToyCar.glb has a baked-in root scale of 0.0001, so this scale gets
  // multiplied with that to produce the actual rendered size. 65 → ~4.75m.
  const TOYCAR_SCALE = 65;

  const FERRARI_PARTS = [
    { name: 'rim_fl', offset: new Vector3(-1.7, 0.35, 0.65), title: 'Front Left Wheel', detail: 'Forged aluminum rim · carbon-ceramic disc visible behind' },
    { name: 'rim_fr', offset: new Vector3(1.7, 0.35, 0.65), title: 'Front Right Wheel', detail: 'Mirror of FL · 1.0 mm dimensional tolerance' },
    { name: 'rim_rl', offset: new Vector3(-1.7, 0.35, -0.65), title: 'Rear Left Wheel', detail: 'Drive wheel · planetary reduction to the motor' },
    { name: 'rim_rr', offset: new Vector3(1.7, 0.35, -0.65), title: 'Rear Right Wheel', detail: 'Twin to RL · adaptive torque vectoring' },
    { name: 'glass', offset: new Vector3(0, 1.4, 0), title: 'Glass Canopy', detail: 'Laminated polycarbonate · electrochromic tint' },
    { name: 'body', offset: new Vector3(0, 0.5, 0.9), title: 'Carbon Body', detail: 'Single-piece monocoque · 1,100 kg dry' }
  ];

  type Part = {
    mesh: Object3D;
    restPos: Vector3;
    offset: Vector3;
    /** Offset from the mesh's local origin to its bounding-box center, in
        local space. Computed once on load by walking the mesh's geometry.
        Lets us project the *visual* center of the part instead of its
        origin (which can be the car's center for some modelers' rigs). */
    centerOffset: Vector3;
    title: string;
    detail: string;
  };

  // Reusable scratch — never allocated per frame.
  const _scratchBox = new Box3();
  const _scratchVec = new Vector3();
  const _scratchQuat = new Quaternion();

  let parts: Part[] = [];
  let ferrariRoot: Object3D | null = null;

  function captureFerrariParts(gltf: { scene: Object3D }) {
    parts = [];
    ferrariRoot = gltf.scene;

    // Ensure world matrices are accurate before computing per-part bboxes.
    gltf.scene.updateMatrixWorld(true);

    for (const p of FERRARI_PARTS) {
      const m = gltf.scene.getObjectByName(p.name);
      if (m) {
        // World-space bbox center, transformed into the mesh's local frame
        // so we can re-add it each frame after the mesh's position changes.
        _scratchBox.setFromObject(m);
        _scratchBox.getCenter(_scratchVec);
        // _scratchVec is in world space — convert to mesh local by
        // subtracting the mesh's world position. Both are at rest here.
        const worldPos = new Vector3();
        m.getWorldPosition(worldPos);
        const centerOffset = _scratchVec.clone().sub(worldPos);

        parts.push({
          mesh: m,
          restPos: m.position.clone(),
          offset: p.offset,
          centerOffset,
          title: p.title,
          detail: p.detail
        });
      } else {
        console.warn(`[3d-hero] ferrari part not found: ${p.name}`);
      }
    }
    ferrariLoaded = true;
    loadState.ferrari = true;
    const box = new Box3().setFromObject(gltf.scene);
    console.log(
      `[3d-hero] ferrari loaded ✓ — ${parts.length}/${FERRARI_PARTS.length} parts mapped`,
      {
        box: { min: box.min.toArray(), max: box.max.toArray() },
        parts: parts.map((p) => ({ name: p.title, centerOffset: p.centerOffset.toArray() }))
      }
    );
  }

  // ─── Phase mapping (scroll progress → explosion / labels / camera) ──
  // Now over 3 cars: Ferrari (0-0.55), ToyCar (~0.55-0.75), Truck (0.75-1.0).
  // Explosion happens during the Ferrari section only.
  // ────────────────────────────────────────────────────────────────────
  function explosionProgress(t: number): number {
    if (t < 0.10) return 0;
    if (t < 0.20) return smoothstep((t - 0.10) / 0.10);
    if (t < 0.50) return 1;
    if (t < 0.56) return 1 - smoothstep((t - 0.50) / 0.06);
    return 0;
  }

  function labelOpacity(t: number): number {
    if (t < 0.18) return 0;
    if (t < 0.24) return smoothstep((t - 0.18) / 0.06);
    if (t < 0.50) return 1;
    if (t < 0.54) return 1 - smoothstep((t - 0.50) / 0.04);
    return 0;
  }

  // ─── Camera flythrough across 3 cars ────────────────────────────
  // Look-at target glides: Ferrari (0-0.58), transit (0.58-0.66),
  // ToyCar (0.66-0.80), transit (0.80-0.86), Truck (0.86-1.0).
  // Each car gets its own orbit phase plus blends at the seams.
  // ─────────────────────────────────────────────────────────────────
  function blendTarget(t: number): [number, number, number] {
    if (t < 0.58) return FERRARI_POS as unknown as [number, number, number];
    if (t < 0.66) {
      const u = smoothstep((t - 0.58) / 0.08);
      return [
        lerp(FERRARI_POS[0], TOYCAR_POS[0], u),
        lerp(FERRARI_POS[1], TOYCAR_POS[1], u),
        lerp(FERRARI_POS[2], TOYCAR_POS[2], u)
      ];
    }
    if (t < 0.80) return TOYCAR_POS as unknown as [number, number, number];
    if (t < 0.86) {
      const u = smoothstep((t - 0.80) / 0.06);
      return [
        lerp(TOYCAR_POS[0], TRUCK_POS[0], u),
        lerp(TOYCAR_POS[1], TRUCK_POS[1], u),
        lerp(TOYCAR_POS[2], TRUCK_POS[2], u)
      ];
    }
    return TRUCK_POS as unknown as [number, number, number];
  }

  let cam = $derived.by(() => {
    const t = scrollState.progress;
    const [tx, ty, tz] = blendTarget(t);

    // 2 revolutions across the whole scroll (more orbital interest with 3 cars).
    const yaw = lerp(0, Math.PI * 2.0, t);
    const pitch = lerp(0.22, 0.7, t * t);
    const radius = lerp(6.5, 9.5, t * t) + explosionProgress(t) * 1.2;

    return {
      px: tx + Math.sin(yaw) * Math.cos(pitch) * radius,
      py: ty + Math.sin(pitch) * radius + 0.6,
      pz: tz + Math.cos(yaw) * Math.cos(pitch) * radius,
      tx,
      ty: ty + 0.4,
      tz
    };
  });

  // ─── Mood lighting — cinematic luxury, no more neon ──────────────
  // Three lights peak at each car position. Warm tungsten amber for
  // the Ferrari, cool moonlight blue-gray for the ToyCar, restrained
  // champagne for the Denali. Same intensity envelope as the old
  // neon palette — only the colors changed.
  // ─────────────────────────────────────────────────────────────────
  const tent = (t: number, peak: number, width: number = 0.45) =>
    Math.max(0, 1 - Math.abs(t - peak) / width);

  let mood = $derived.by(() => {
    const t = scrollState.progress;
    return {
      warm: tent(t, 0.0) * 2.4,       // amber tungsten — Ferrari
      cool: tent(t, 0.7) * 2.4,       // moonlight cool — ToyCar
      champagne: tent(t, 1.0) * 2.4,  // restrained gold — Denali
      fogDensity: lerp(0.018, 0.05, t * t)
    };
  });

  let cameraRef: PerspectiveCamera | undefined = $state();
  $effect(() => {
    if (!cameraRef) return;
    cameraRef.position.set(cam.px, cam.py, cam.pz);
    cameraRef.lookAt(cam.tx, cam.ty, cam.tz);
  });

  let ferrariLoaded = $state(false);
  let toyCarLoaded = $state(false);
  let denaliLoaded = $state(false);

  // ─── TEMP / PROTOTYPE ONLY ───────────────────────────────────────
  // Denali GLB hosted at /denali.glb is a 2024 GMC Sierra 1500 AT4X by
  // Ddiaz Design from Sketchfab (CC-BY-NC-SA-4.0).
  // License is NonCommercial — DO NOT ship to a real dealership site.
  // Swap for either:
  //   (a) a commercial-licensed Sierra/Yukon .glb, OR
  //   (b) the primitive <Denali /> in this same folder.
  // Tracking: github.com/ethangramly1-svg/Dealership — pre-launch swap.
  // ─────────────────────────────────────────────────────────────────
  const DENALI_URL = `${base}/denali.glb`;
  const DENALI_SCALE = 1.0; // tune after first load — bbox logged on ready

  const { camera, size } = useThrelte();
  const projection = new Vector3();

  useTask(() => {
    const t = scrollState.progress;
    const exp = explosionProgress(t);

    for (const part of parts) {
      part.mesh.position.set(
        part.restPos.x + part.offset.x * exp,
        part.restPos.y + part.offset.y * exp,
        part.restPos.z + part.offset.z * exp
      );
    }

    const op = labelOpacity(t);
    if (!parts.length || op < 0.01) {
      if (labelState.items.length) labelState.items = [];
      return;
    }

    // World matrices are stale after mutating positions above — Three.js
    // only auto-updates them during the render pass, but we're reading
    // BEFORE that, so force an update.
    if (ferrariRoot) ferrariRoot.updateMatrixWorld(true);

    labelState.items = parts.map((part) => {
      // World position of the mesh, plus the cached local-to-center
      // offset rotated into world space. This anchors the label on
      // the visual center of the part, not its modeling origin.
      part.mesh.getWorldPosition(projection);
      _scratchVec.copy(part.centerOffset).applyQuaternion(part.mesh.getWorldQuaternion(_scratchQuat));
      projection.add(_scratchVec);
      projection.project($camera);
      const inFront = projection.z < 1;
      return {
        id: part.title,
        title: part.title,
        detail: part.detail,
        x: (projection.x * 0.5 + 0.5) * $size.width,
        y: (-projection.y * 0.5 + 0.5) * $size.height,
        visible: inFront && op > 0.05,
        opacity: op
      };
    });
  });
</script>

<T.FogExp2 args={['#0e0e10', mood.fogDensity]} attach="fog" />

<T.PerspectiveCamera bind:ref={cameraRef} makeDefault fov={42} near={0.1} far={160} />

<!-- Neutral warm ambient — bumped for dark-paint cars (Sierra is dark) so
     PBR surfaces have a floor of light to reflect, not just mood peaks. -->
<T.AmbientLight intensity={0.5} color="#3a3a40" />

<!-- Three mood lights, cinematographer's palette. -->
<T.DirectionalLight position={[cam.tx + 6, cam.ty + 8, cam.tz + 6]} intensity={mood.warm} color="#e8b878" />
<T.DirectionalLight position={[cam.tx - 6, cam.ty + 5, cam.tz - 3]} intensity={mood.cool} color="#a8b8d8" />
<T.PointLight
  position={[cam.tx, cam.ty + 1.5, cam.tz - 3]}
  intensity={mood.champagne * 18}
  color="#c5a572"
  distance={30}
  decay={1.4}
/>

<!-- Soft top-down fill so dark paint reads against the floor / fog. -->
<T.HemisphereLight intensity={0.4} color="#f3ede1" groundColor="#1a1a1c" />

<!-- Front spotlight near the Ferrari — warm tungsten kicker, dimmer
     than the old white version so it picks up chrome without blowing
     out the body. -->
<T.SpotLight
  position={[FERRARI_POS[0], FERRARI_POS[1] + 2, FERRARI_POS[2] + 6]}
  angle={0.55}
  penumbra={0.6}
  intensity={mood.warm * 6}
  color="#f3e0c0"
  distance={18}
  decay={1.2}
/>

<!-- Floor: slightly lifted anthracite so dark vehicles separate from
     the background. Less mirror, more matte to avoid harsh hot-spots. -->
<T.Mesh position={[0, -0.01, -28]} rotation={[-Math.PI / 2, 0, 0]}>
  <T.PlaneGeometry args={[80, 130]} />
  <T.MeshStandardMaterial color="#2a2a2e" roughness={0.7} metalness={0.4} />
</T.Mesh>

<!-- Loading placeholders — quiet champagne, no longer neon. -->
{#if !ferrariLoaded}
  <T.Mesh position={[FERRARI_POS[0], FERRARI_POS[1] + 0.5, FERRARI_POS[2]]}>
    <T.SphereGeometry args={[0.35, 24, 24]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#c5a572" emissiveIntensity={1.8} />
  </T.Mesh>
{/if}
{#if !toyCarLoaded}
  <T.Mesh position={[TOYCAR_POS[0], TOYCAR_POS[1] + 0.5, TOYCAR_POS[2]]}>
    <T.SphereGeometry args={[0.35, 24, 24]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#c5a572" emissiveIntensity={1.8} />
  </T.Mesh>
{/if}
<!-- Ferrari: culled only after the camera has fully transited to the
     compact (progress ~0.66). Earlier and the user sees it pop out
     mid-view while still aimed at it. -->
<T.Group position={FERRARI_POS} visible={scrollState.progress < 0.68}>
  <GLTF
    url="https://threejs.org/examples/models/gltf/ferrari.glb"
    {dracoLoader}
    onload={captureFerrariParts}
    onerror={(e) => console.error('[3d-hero] ferrari FAILED:', e)}
  />
</T.Group>

<!-- ToyCar: visible from before its phase through end (no ghosting issue here). -->
<T.Group position={TOYCAR_POS} scale={TOYCAR_SCALE} visible={scrollState.progress < 0.90}>
  <GLTF
    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb"
    {dracoLoader}
    onload={() => { toyCarLoaded = true; loadState.toyCar = true; console.log('[3d-hero] toycar loaded ✓'); }}
    onerror={(e) => console.error('[3d-hero] toycar FAILED:', e)}
  />
</T.Group>

<!-- Denali slot — currently the Sierra 1500 GLB (prototype only;
     NonCommercial license, swap before real launch). Placeholder
     sphere while it loads. -->
{#if !denaliLoaded}
  <T.Mesh position={[TRUCK_POS[0], TRUCK_POS[1] + 0.5, TRUCK_POS[2]]}>
    <T.SphereGeometry args={[0.4, 24, 24]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#c5a572" emissiveIntensity={1.8} />
  </T.Mesh>
{/if}

<T.Group position={TRUCK_POS} scale={DENALI_SCALE}>
  <GLTF
    url={DENALI_URL}
    {dracoLoader}
    onload={(g) => {
      denaliLoaded = true;
      const box = new Box3().setFromObject(g.scene);
      const size = box.getSize(new Vector3());
      console.log('[3d-hero] denali (Sierra 1500) loaded ✓', {
        bbox_size: size.toArray().map((n) => n.toFixed(2)),
        attribution: 'Ddiaz Design · CC-BY-NC-SA-4.0 · sketchfab.com/3d-models/2024-gmc-sierra-1500-at4x-41d0b29e3d2f4854a9b6349ccf918a1e'
      });
    }}
    onerror={(e) => console.error('[3d-hero] denali FAILED:', e)}
  />
</T.Group>
