<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/Scene.svelte';
  import Renderer from '$lib/Renderer.svelte';
  import { bindWindowScroll } from '$lib/scroll.svelte';
  import '$lib/theatre'; // side-effect: boots Theatre.js Studio panel in dev

  $effect(() => bindWindowScroll());
</script>

<div class="canvas-fixed">
  <Canvas>
    <Scene />
    <Renderer />
  </Canvas>
</div>

<header>
  <span class="eyebrow">Built in code · Choreographed by scroll</span>
  <h1>Drive<br />the Frame.</h1>
  <p>The camera orbits as you descend. The mood shifts. The void deepens.</p>
</header>

<section>
  <span class="num">01</span>
  <h2>Cyan ignition.</h2>
  <p>Front-quarter view. Headlight kicker into the lens. The cyan key light reads on the chrome and the silhouette is hard.</p>
</section>

<section>
  <span class="num">02</span>
  <h2>Magenta arc.</h2>
  <p>Camera sweeps to the high-three-quarter. Magenta takes over from cyan. Fog density picks up — distance starts to matter.</p>
</section>

<section>
  <span class="num">03</span>
  <h2>Pink horizon.</h2>
  <p>Top-down at altitude. Pink rim light wraps the body. The car is small in a deep neon void.</p>
</section>

<footer>
  <span class="num">04</span>
  <h2>End of sequence.</h2>
  <p>Tune the choreography in <code>Scene.svelte</code>. Swap models. Layer keyframes. Ship.</p>
</footer>

<style>
  .canvas-fixed {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  header,
  section,
  footer {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: clamp(2rem, 6vw, 6rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 1.25rem;
    max-width: 1100px;
    pointer-events: none;
  }

  .eyebrow {
    font-size: 0.78rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .num {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    color: var(--neon-blue);
    opacity: 0.7;
  }

  h1 {
    font-size: clamp(2.75rem, 10vw, 8rem);
    font-weight: 900;
    line-height: 0.92;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple) 55%, var(--neon-pink));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: -0.035em;
  }

  h2 {
    font-size: clamp(1.75rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.04;
    color: var(--ink);
    letter-spacing: -0.022em;
    max-width: 18ch;
  }

  p {
    color: var(--muted);
    font-size: clamp(1rem, 1.4vw, 1.15rem);
    max-width: 50ch;
    line-height: 1.6;
  }

  code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.92em;
    background: rgba(176, 38, 255, 0.12);
    padding: 0.1em 0.35em;
    border-radius: 0.25em;
    color: var(--neon-purple);
  }
</style>
