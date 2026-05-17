<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/Scene.svelte';
  import Renderer from '$lib/Renderer.svelte';
  import { bindWindowScroll } from '$lib/scroll.svelte';
  import { labelState } from '$lib/labels.svelte';
  import '$lib/theatre'; // side-effect: boots Theatre.js Studio panel in dev

  $effect(() => bindWindowScroll());
</script>

<div class="canvas-fixed">
  <Canvas>
    <Scene />
    <Renderer />
  </Canvas>
</div>

<!-- HTML labels positioned via per-frame Vector3.project() — see Scene.svelte useTask. -->
<div class="labels-overlay">
  {#each labelState.items as label (label.id)}
    {#if label.visible}
      <div class="label" style="left: {label.x}px; top: {label.y}px; opacity: {label.opacity};">
        <div class="dot"></div>
        <div class="card">
          <span class="t">{label.title}</span>
          <span class="d">{label.detail}</span>
        </div>
      </div>
    {/if}
  {/each}
</div>

<header>
  <span class="eyebrow">AutoNation USA · Centennial · Las Vegas</span>
  <h1>The Showroom,<br />Reimagined.</h1>
  <p>Scroll through the corridor. Each car is a moment. The pressure is none.</p>
  <div class="rating">
    <span class="stars">★★★★★</span>
    <span class="rating-num">4.7</span>
    <span class="rating-meta">· 812 reviews · "No pressure. Fair offer. Felt like a valued customer."</span>
  </div>
</header>

<section>
  <span class="num">01</span>
  <h2>Cyan ignition.</h2>
  <p>
    The featured concept rolls into the cyan key light. Hard silhouette,
    chrome body, headlight kicker straight into the frame. This is how a
    car wants to be seen.
  </p>
</section>

<section>
  <span class="num">02</span>
  <h2>Anatomy.</h2>
  <p>
    Every bolt accounted for. Keep scrolling and the chassis blows apart —
    rims, glass, body, all separated so you can see what's actually inside
    a car this clean. Labels appear over each piece.
  </p>
</section>

<section>
  <span class="num">03</span>
  <h2>Magenta arc.</h2>
  <p>
    Parts re-assemble. The camera lifts and the corridor opens. Magenta
    replaces cyan as the dominant key. A second silhouette is in the
    haze ahead.
  </p>
</section>

<section>
  <span class="num">04</span>
  <h2>Pink horizon.</h2>
  <p>
    Arrival. The compact takes center. Pink rim light wraps the body. The
    void behind it stretches — the corridor keeps going, and so does the
    inventory.
  </p>
</section>

<footer>
  <span class="num">visit</span>
  <h2>8570 W Centennial Pkwy<br />Las Vegas, NV 89149</h2>
  <p class="contact">
    <a href="tel:7252915110">(725) 291-5110</a> · Open today · Closes 8 PM
  </p>
  <p class="testimonial">
    <em>"Royce Tran is very nice and I made a lot of trouble for him, but
    he was very patient and helpful. If you want to purchase a vehicle from
    AutoNation, go to Royce. He is the best."</em>
  </p>
</footer>

<style>
  .canvas-fixed {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .labels-overlay {
    position: fixed;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .label {
    position: absolute;
    transform: translate(8px, -50%);
    display: flex;
    align-items: center;
    gap: 0.55rem;
    pointer-events: none;
    transition: opacity 0.12s linear;
  }

  .dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 50%;
    background: var(--neon-blue);
    box-shadow:
      0 0 0 2px rgba(0, 240, 255, 0.25),
      0 0 14px var(--neon-blue);
    flex-shrink: 0;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    padding: 0.45rem 0.85rem;
    background: rgba(7, 7, 26, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 240, 255, 0.35);
    border-radius: 0.45rem;
    color: var(--ink);
    min-width: 12rem;
    max-width: 22rem;
  }

  .t {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--ink);
  }

  .d {
    font-size: 0.76rem;
    color: var(--muted);
    line-height: 1.4;
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

  footer { gap: 1.5rem; }

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
    max-width: 22ch;
  }

  p {
    color: var(--muted);
    font-size: clamp(1rem, 1.4vw, 1.15rem);
    max-width: 52ch;
    line-height: 1.6;
  }

  .rating {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.92rem;
  }
  .stars {
    color: var(--gold);
    letter-spacing: 0.05em;
    font-size: 1.1rem;
  }
  .rating-num {
    color: var(--ink);
    font-weight: 700;
  }
  .rating-meta {
    color: var(--muted);
  }

  .contact {
    font-size: 1.05rem;
    color: var(--ink);
    pointer-events: auto;
  }
  .contact a {
    color: var(--neon-blue);
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 240, 255, 0.4);
  }

  .testimonial {
    color: var(--ink);
    font-size: 1.1rem;
    line-height: 1.55;
    border-left: 2px solid var(--neon-purple);
    padding-left: 1.2rem;
    max-width: 56ch;
  }
  .testimonial em {
    font-style: normal;
  }
</style>
