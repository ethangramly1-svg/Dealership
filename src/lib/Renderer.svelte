<script lang="ts">
  import { useTask, useThrelte } from '@threlte/core';
  import {
    EffectComposer,
    EffectPass,
    RenderPass,
    BloomEffect,
    SMAAEffect,
    SMAAPreset,
    KernelSize
  } from 'postprocessing';
  import type { Camera } from 'three';

  const { scene, renderer, camera, size, renderStage, autoRender } = useThrelte();

  const composer = new EffectComposer(renderer);

  // ─── Tuning surface ──────────────────────────────────────────────
  // Luxury redesign: bloom is restrained. Only the brightest pixels
  // (headlights, brake lights, spotlight kicker) glow — the body
  // shouldn't read as "neon," just "cinematic chrome."
  // - intensity 1.5 (was 2.6) — softer halos
  // - threshold 0.28 (was 0.12) — selective; only emissive points
  // - kernel MEDIUM (was LARGE) — tighter glow, less wash
  const bloom = new BloomEffect({
    intensity: 1.5,
    luminanceThreshold: 0.28,
    luminanceSmoothing: 0.05,
    mipmapBlur: true,
    kernelSize: KernelSize.MEDIUM
  });
  // ─────────────────────────────────────────────────────────────────

  const setupPasses = (cam: Camera) => {
    composer.removeAllPasses();
    composer.addPass(new RenderPass(scene, cam));
    composer.addPass(new EffectPass(cam, bloom));
    composer.addPass(new EffectPass(cam, new SMAAEffect({ preset: SMAAPreset.LOW })));
  };

  $effect(() => setupPasses($camera));
  $effect(() => composer.setSize($size.width, $size.height));

  $effect(() => {
    const previous = autoRender.current;
    autoRender.set(false);
    return () => autoRender.set(previous);
  });

  useTask((delta) => composer.render(delta), {
    stage: renderStage,
    autoInvalidate: false
  });
</script>
