<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { GLTF } from '@threlte/extras';
  import { scrollState } from './scroll.svelte';
  import { labelState } from './labels.svelte';
  import { Box3, Vector3 } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import type { PerspectiveCamera, Object3D } from 'three';

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  const FERRARI_POS: [number, number, number] = [0, 0, 0];
  const TOYCAR_POS: [number, number, number] = [0, 0, -28];
  const TOYCAR_SCALE = 12;

  // ─── Ferrari part catalog ────────────────────────────────────────
  // Names match the mesh names inside threejs.org/examples/models/gltf/ferrari.glb.
  // Each part has a directional offset applied at peak explosion (progress=1)
  // and label copy that floats with the part on screen.
  // ─────────────────────────────────────────────────────────────────
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
    title: string;
    detail: string;
  };

  let parts: Part[] = [];

  function captureFerrariParts(gltf: { scene: Object3D }) {
    parts = [];
    for (const p of FERRARI_PARTS) {
      const m = gltf.scene.getObjectByName(p.name);
      if (m) {
        parts.push({
          mesh: m,
          restPos: m.position.clone(),
          offset: p.offset,
          title: p.title,
          detail: p.detail
        });
      } else {
        console.warn(`[3d-hero] ferrari part not found: ${p.name}`);
      }
    }
    ferrariLoaded = true;
    const box = new Box3().setFromObject(gltf.scene);
    console.log(
      `[3d-hero] ferrari loaded ✓ — ${parts.length}/${FERRARI_PARTS.length} parts mapped`,
      { box: { min: box.min.toArray(), max: box.max.toArray() } }
    );
  }

  // ─── Phase mapping (scroll progress → explosion / labels / camera) ──
  // The car explodes early and stays exploded for ~38% of total scroll,
  // covering front view, side view, and most of the rear view. It only
  // re-assembles right before the camera transit toward the ToyCar.
  //
  // intact:        0.00 - 0.10
  // expanding:     0.10 - 0.20
  // held:          0.20 - 0.58  ← labels visible for the whole held phase
  // reassembling:  0.58 - 0.64
  // intact:        0.64+
  // transit:       0.65 - 0.85  (camera target slides Ferrari → ToyCar)
  // ────────────────────────────────────────────────────────────────────
  function explosionProgress(t: number): number {
    if (t < 0.10) return 0;
    if (t < 0.20) return smoothstep((t - 0.10) / 0.10);
    if (t < 0.62) return 1;
    if (t < 0.68) return 1 - smoothstep((t - 0.62) / 0.06);
    return 0;
  }

  function labelOpacity(t: number): number {
    if (t < 0.18) return 0;
    if (t < 0.24) return smoothstep((t - 0.18) / 0.06);
    if (t < 0.62) return 1;
    if (t < 0.66) return 1 - smoothstep((t - 0.62) / 0.04);
    return 0;
  }

  // ─── Camera flythrough ──────────────────────────────────────────
  let cam = $derived.by(() => {
    const t = scrollState.progress;

    // Look-at slides from Ferrari to ToyCar only after explosion is done.
    const transitT = smoothstep(clamp((t - 0.70) / 0.18, 0, 1));
    const tx = lerp(FERRARI_POS[0], TOYCAR_POS[0], transitT);
    const ty = lerp(FERRARI_POS[1], TOYCAR_POS[1], transitT);
    const tz = lerp(FERRARI_POS[2], TOYCAR_POS[2], transitT);

    // 1.5 revolutions over scroll; slight slowdown during the held phase.
    const yaw = lerp(0, Math.PI * 1.6, t);
    const pitch = lerp(0.22, 0.7, t * t);
    // Pull back a touch during the explosion so the whole car fits in frame.
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

  const tent = (t: number, peak: number, width: number = 0.55) =>
    Math.max(0, 1 - Math.abs(t - peak) / width);

  let mood = $derived.by(() => {
    const t = scrollState.progress;
    return {
      cyan: tent(t, 0.0) * 2.2,
      magenta: tent(t, 0.5) * 2.4,
      pink: tent(t, 1.0) * 2.2,
      fogDensity: lerp(0.018, 0.06, t * t)
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

  // ─── Per-frame: explode parts + project labels to screen ────────
  const { camera, size } = useThrelte();
  const projection = new Vector3();

  useTask(() => {
    const t = scrollState.progress;
    const exp = explosionProgress(t);

    // Apply per-part offsets to the actual Three.js scene graph.
    for (const part of parts) {
      part.mesh.position.set(
        part.restPos.x + part.offset.x * exp,
        part.restPos.y + part.offset.y * exp,
        part.restPos.z + part.offset.z * exp
      );
    }

    // Project each part's world position to 2D screen px for HTML labels.
    const op = labelOpacity(t);
    if (!parts.length || op < 0.01) {
      if (labelState.items.length) labelState.items = [];
      return;
    }

    labelState.items = parts.map((part) => {
      part.mesh.getWorldPosition(projection);
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

<T.FogExp2 args={['#07071a', mood.fogDensity]} attach="fog" />

<T.PerspectiveCamera bind:ref={cameraRef} makeDefault fov={42} near={0.1} far={120} />

<T.AmbientLight intensity={0.35} color="#3a3a6a" />

<!-- Mood lights track the current camera target. -->
<T.DirectionalLight position={[cam.tx + 6, cam.ty + 8, cam.tz + 6]} intensity={mood.cyan} color="#00f0ff" />
<T.DirectionalLight position={[cam.tx - 6, cam.ty + 5, cam.tz - 3]} intensity={mood.magenta} color="#b026ff" />
<T.PointLight
  position={[cam.tx, cam.ty + 1.2, cam.tz - 4]}
  intensity={mood.pink * 15}
  color="#ff006e"
  distance={22}
  decay={1.5}
/>

<!-- Headlight kicker near the Ferrari only. -->
<T.SpotLight
  position={[FERRARI_POS[0], FERRARI_POS[1] + 2, FERRARI_POS[2] + 6]}
  angle={0.55}
  penumbra={0.6}
  intensity={mood.cyan * 8}
  color="#ffffff"
  distance={18}
  decay={1.2}
/>

<T.Mesh position={[0, -0.01, -14]} rotation={[-Math.PI / 2, 0, 0]}>
  <T.PlaneGeometry args={[80, 80]} />
  <T.MeshStandardMaterial color="#0a0a1f" roughness={0.4} metalness={0.6} />
</T.Mesh>

{#if !ferrariLoaded}
  <T.Mesh position={[FERRARI_POS[0], FERRARI_POS[1] + 0.5, FERRARI_POS[2]]}>
    <T.SphereGeometry args={[0.35, 24, 24]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={2} />
  </T.Mesh>
{/if}
{#if !toyCarLoaded}
  <T.Mesh position={[TOYCAR_POS[0], TOYCAR_POS[1] + 0.5, TOYCAR_POS[2]]}>
    <T.SphereGeometry args={[0.35, 24, 24]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#ff006e" emissiveIntensity={2} />
  </T.Mesh>
{/if}

<T.Group position={FERRARI_POS}>
  <GLTF
    url="https://threejs.org/examples/models/gltf/ferrari.glb"
    {dracoLoader}
    onload={captureFerrariParts}
    onerror={(e) => console.error('[3d-hero] ferrari FAILED:', e)}
  />
</T.Group>

<T.Group position={TOYCAR_POS} scale={TOYCAR_SCALE}>
  <GLTF
    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb"
    {dracoLoader}
    onload={() => { toyCarLoaded = true; console.log('[3d-hero] toycar loaded ✓'); }}
    onerror={(e) => console.error('[3d-hero] toycar FAILED:', e)}
  />
</T.Group>
