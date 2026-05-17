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
  // Pushed for premium neon feel: high intensity, low threshold so
  // the cyan emissive blooms aggressively. Raise threshold (→0.3) to
  // make bloom more selective; drop intensity (→1.2) to dial it back.
  const bloom = new BloomEffect({
    intensity: 2.6,
    luminanceThreshold: 0.12,
    luminanceSmoothing: 0.04,
    mipmapBlur: true,
    kernelSize: KernelSize.LARGE
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
