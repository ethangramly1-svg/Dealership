<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF } from '@threlte/extras';
  import { scrollState } from './scroll.svelte';
  import { Box3 } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import type { PerspectiveCamera, Object3D } from 'three';

  // Ferrari is DRACO-compressed. ToyCar isn't, but sharing the loader is
  // harmless — it only activates per-model when KHR_draco_mesh_compression is present.
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // ─── Showroom layout ─────────────────────────────────────────────
  // Each car lives at a fixed world position. The camera traverses
  // this corridor from front (0,0,0) to back (0,0,-28) over scroll,
  // orbiting whichever car is currently the look-at target.
  // ─────────────────────────────────────────────────────────────────
  const FERRARI_POS: [number, number, number] = [0, 0, 0];
  const TOYCAR_POS: [number, number, number] = [0, 0, -28];
  const TOYCAR_SCALE = 12;

  // ─── Camera flythrough ───────────────────────────────────────────
  // Yaw spirals 2.5 full revolutions across the journey.
  // Pitch + radius ease so the orbit "rises and pulls back" near the end.
  // lookAt-target slides from Ferrari to ToyCar over scroll.
  // ─────────────────────────────────────────────────────────────────
  let cam = $derived.by(() => {
    const t = scrollState.progress;
    const yaw = lerp(0, Math.PI * 2.5, t);
    const pitch = lerp(0.22, 0.7, t * t);
    const radius = lerp(7, 9.5, t * t);

    const tx = lerp(FERRARI_POS[0], TOYCAR_POS[0], t);
    const ty = lerp(FERRARI_POS[1], TOYCAR_POS[1], t);
    const tz = lerp(FERRARI_POS[2], TOYCAR_POS[2], t);

    return {
      px: tx + Math.sin(yaw) * Math.cos(pitch) * radius,
      py: ty + Math.sin(pitch) * radius + 0.6,
      pz: tz + Math.cos(yaw) * Math.cos(pitch) * radius,
      tx,
      ty: ty + 0.4,
      tz
    };
  });

  // ─── Mood lighting (3-color tent blend) ──────────────────────────
  // Cyan dominates near Ferrari, magenta peaks at transit (t=0.5),
  // pink takes over as the camera arrives at the ToyCar.
  // ─────────────────────────────────────────────────────────────────
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

  function logBox(name: string, gltf: { scene: Object3D }) {
    const box = new Box3().setFromObject(gltf.scene);
    console.log(`[3d-hero] ${name} loaded ✓`, {
      children: gltf.scene.children.length,
      box: { min: box.min.toArray(), max: box.max.toArray() }
    });
  }
</script>

<T.FogExp2 args={['#07071a', mood.fogDensity]} attach="fog" />

<T.PerspectiveCamera bind:ref={cameraRef} makeDefault fov={42} near={0.1} far={120} />

<!-- Ambient enough to read the model in dark mood; not so much that bloom dies. -->
<T.AmbientLight intensity={0.35} color="#3a3a6a" />

<!-- Mood lights track the camera's target (move with it through the corridor). -->
<T.DirectionalLight position={[cam.tx + 6, cam.ty + 8, cam.tz + 6]} intensity={mood.cyan} color="#00f0ff" />
<T.DirectionalLight position={[cam.tx - 6, cam.ty + 5, cam.tz - 3]} intensity={mood.magenta} color="#b026ff" />
<T.PointLight
  position={[cam.tx, cam.ty + 1.2, cam.tz - 4]}
  intensity={mood.pink * 15}
  color="#ff006e"
  distance={22}
  decay={1.5}
/>

<!-- Headlight kicker only at the start of the journey (near Ferrari). -->
<T.SpotLight
  position={[FERRARI_POS[0], FERRARI_POS[1] + 2, FERRARI_POS[2] + 6]}
  angle={0.55}
  penumbra={0.6}
  intensity={mood.cyan * 8}
  color="#ffffff"
  distance={18}
  decay={1.2}
/>

<!-- Continuous floor stretching down the corridor. -->
<T.Mesh position={[0, -0.01, -14]} rotation={[-Math.PI / 2, 0, 0]}>
  <T.PlaneGeometry args={[80, 80]} />
  <T.MeshStandardMaterial color="#0a0a1f" roughness={0.4} metalness={0.6} />
</T.Mesh>

<!-- Debug presence canaries — visible until each car loads. -->
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

<!-- Featured: Three.js ferrari concept (DRACO compressed). -->
<T.Group position={FERRARI_POS}>
  <GLTF
    url="https://threejs.org/examples/models/gltf/ferrari.glb"
    {dracoLoader}
    onload={(g) => { logBox('ferrari', g); ferrariLoaded = true; }}
    onerror={(e) => console.error('[3d-hero] ferrari FAILED:', e)}
  />
</T.Group>

<!-- Showroom companion: Khronos ToyCar (scaled up — model is toy-sized). -->
<T.Group position={TOYCAR_POS} scale={TOYCAR_SCALE}>
  <GLTF
    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb"
    {dracoLoader}
    onload={(g) => { logBox('toycar', g); toyCarLoaded = true; }}
    onerror={(e) => console.error('[3d-hero] toycar FAILED:', e)}
  />
</T.Group>
