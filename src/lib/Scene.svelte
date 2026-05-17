<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF } from '@threlte/extras';
  import { scrollState } from './scroll.svelte';
  import { Box3 } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import type { PerspectiveCamera, Object3D } from 'three';

  // The Three.js ferrari.glb is DRACO-compressed — without this, load fails silently.
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Spherical orbit camera path.
  let cam = $derived.by(() => {
    const t = scrollState.progress;
    const yaw = lerp(0, Math.PI * 1.25, t);
    const pitch = lerp(0.22, 0.85, t * t);
    const radius = lerp(7, 12, t * t);
    return {
      px: Math.sin(yaw) * Math.cos(pitch) * radius,
      py: Math.sin(pitch) * radius + 0.7,
      pz: Math.cos(yaw) * Math.cos(pitch) * radius
    };
  });

  // Three-color tent-function mood blend.
  const tent = (t: number, peak: number, width: number = 0.55) =>
    Math.max(0, 1 - Math.abs(t - peak) / width);

  let mood = $derived.by(() => {
    const t = scrollState.progress;
    return {
      cyan: tent(t, 0.0) * 2.2,
      magenta: tent(t, 0.55) * 2.4,
      pink: tent(t, 1.0) * 2.2,
      fogDensity: lerp(0.018, 0.075, t * t)
    };
  });

  let cameraRef: PerspectiveCamera | undefined = $state();
  $effect(() => {
    if (!cameraRef) return;
    cameraRef.position.set(cam.px, cam.py, cam.pz);
    cameraRef.lookAt(0, 0.5, 0);
  });

  let modelLoaded = $state(false);

  function handleLoad(gltf: { scene: Object3D }) {
    modelLoaded = true;
    const box = new Box3().setFromObject(gltf.scene);
    console.log('[3d-hero] ferrari loaded ✓', {
      scene: gltf.scene,
      children: gltf.scene.children.length,
      box: { min: box.min.toArray(), max: box.max.toArray() }
    });
  }

  function handleError(error: Error) {
    console.error('[3d-hero] ferrari FAILED to load:', error);
  }
</script>

<T.FogExp2 args={['#07071a', mood.fogDensity]} attach="fog" />

<T.PerspectiveCamera bind:ref={cameraRef} makeDefault fov={42} near={0.1} far={80} />

<!-- Boosted ambient so the model is visible even when mood lights are low. -->
<T.AmbientLight intensity={0.35} color="#3a3a6a" />

<T.DirectionalLight position={[6, 8, 6]} intensity={mood.cyan} color="#00f0ff" />
<T.DirectionalLight position={[-6, 5, -3]} intensity={mood.magenta} color="#b026ff" />
<T.PointLight position={[0, 1.2, -4]} intensity={mood.pink * 15} color="#ff006e" distance={20} decay={1.5} />

<T.SpotLight
  position={[0, 2, 6]}
  angle={0.55}
  penumbra={0.6}
  intensity={mood.cyan * 8}
  color="#ffffff"
  distance={18}
  decay={1.2}
/>

<!-- Floor plane -->
<T.Mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <T.PlaneGeometry args={[80, 80]} />
  <T.MeshStandardMaterial color="#0a0a1f" roughness={0.4} metalness={0.6} />
</T.Mesh>

<!-- DEBUG: glowing sphere at origin. If you see this but no car, the model
     loaded but is offset/scaled weird. If you see neither, the camera is
     pointing nowhere. Remove once car is visible. -->
{#if !modelLoaded}
  <T.Mesh position={[0, 0.5, 0]}>
    <T.SphereGeometry args={[0.4, 32, 32]} />
    <T.MeshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={2} />
  </T.Mesh>
{/if}

<!-- Ferrari concept model. onload/onerror log to browser console. -->
<GLTF
  url="https://threejs.org/examples/models/gltf/ferrari.glb"
  {dracoLoader}
  onload={handleLoad}
  onerror={handleError}
/>
