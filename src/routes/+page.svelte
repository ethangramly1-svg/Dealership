<script lang="ts">
  import { Canvas } from '@threlte/core';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Scene from '$lib/Scene.svelte';
  import Renderer from '$lib/Renderer.svelte';
  import { bindWindowScroll } from '$lib/scroll.svelte';
  import { labelState } from '$lib/labels.svelte';
  import { loadState } from '$lib/loadState.svelte';
  import { reveal, spotlight } from '$lib/animations';
  import '$lib/theatre'; // side-effect: boots Theatre.js Studio panel in dev

  // Custom transition for Ferrari part labels — same translate + scale +
  // blur language as the section reveals, but composed with the static
  // .label transform so the dot-to-card offset isn't clobbered.
  function labelReveal(_node: HTMLElement, { delay = 0, duration = 1100 } = {}) {
    return {
      delay,
      duration,
      easing: cubicOut,
      css: (t: number, u: number) => `
        transform: translate(8px, -50%) translateY(${u * 50}px) scale(${0.92 + 0.08 * t});
        filter: blur(${u * 14}px);
      `
    };
  }

  let corridorEl: HTMLElement | undefined = $state();

  $effect(() => {
    if (corridorEl) return bindWindowScroll(corridorEl);
  });

  // ─── Inventory data ──────────────────────────────────────────────
  // Realistic specs across the categories AutoNation Centennial actually
  // sells (Tesla, trucks, sedans, SUVs).
  // ─────────────────────────────────────────────────────────────────
  type Vehicle = {
    year: number;
    make: string;
    model: string;
    price: number;
    miles: number;
    category: 'EV' | 'Sedan' | 'Truck' | 'SUV';
    tags: string[];
  };
  const inventory: Vehicle[] = [
    { year: 2023, make: 'Tesla', model: 'Model 3 Long Range', price: 36500, miles: 18200, category: 'EV', tags: ['Low Miles'] },
    { year: 2022, make: 'Honda', model: 'Civic Sport', price: 22800, miles: 31900, category: 'Sedan', tags: [] },
    { year: 2024, make: 'Ford', model: 'F-150 XLT 4WD', price: 48900, miles: 11500, category: 'Truck', tags: ['Fresh'] },
    { year: 2023, make: 'Toyota', model: 'Camry SE', price: 26400, miles: 24100, category: 'Sedan', tags: ['Certified'] },
    { year: 2022, make: 'GMC', model: 'Yukon Denali', price: 62300, miles: 27800, category: 'SUV', tags: ['Premium'] },
    { year: 2024, make: 'Tesla', model: 'Model Y AWD', price: 42800, miles: 9200, category: 'EV', tags: ['Fresh'] },
    { year: 2023, make: 'Chevy', model: 'Silverado 1500 LT', price: 44200, miles: 17800, category: 'Truck', tags: [] },
    { year: 2022, make: 'Mazda', model: 'CX-5 Touring', price: 28500, miles: 25700, category: 'SUV', tags: [] }
  ];

  // ─── Inventory filter + sort state ───────────────────────────────
  const categories = ['All', 'EV', 'Sedan', 'Truck', 'SUV'] as const;
  type Category = (typeof categories)[number];
  type SortKey = 'featured' | 'year' | 'price-asc' | 'price-desc' | 'miles';

  let selectedCategory = $state<Category>('All');
  let sortBy = $state<SortKey>('featured');

  const filteredInventory = $derived.by(() => {
    let list = [...inventory];
    if (selectedCategory !== 'All') {
      list = list.filter((v) => v.category === selectedCategory);
    }
    switch (sortBy) {
      case 'year':
        list.sort((a, b) => b.year - a.year);
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'miles':
        list.sort((a, b) => a.miles - b.miles);
        break;
    }
    return list;
  });

  // ─── Contact form state ──────────────────────────────────────────
  // Submit handler is a stub — wire to Formspree, a CRM webhook, or
  // your own backend by replacing the body of `handleSubmit`.
  let form = $state({ name: '', email: '', phone: '', vehicle: '', message: '' });
  let formSubmitted = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    console.log('[3d-hero] contact form submitted:', $state.snapshot(form));
    formSubmitted = true;
  }

  const reviews = [
    {
      name: 'Becca Celano',
      meta: '8 reviews · 5 photos · 2 months ago',
      quote:
        'Absolutely the most amazing car buying experience ever! The entire staff was kind and friendly. Brenan was very helpful and polite and made the process easy.'
    },
    {
      name: 'Sarra Keeton',
      meta: 'Local Guide · 17 reviews · 2 months ago',
      quote:
        'I cannot recommend visiting this dealership enough! Royce was incredibly helpful, knowledgeable, polite, and patient. He, Johnathan, and Jenzel were absolutely outstanding.'
    },
    {
      name: 'Michelle Lampkin',
      meta: 'Local Guide · 33 reviews · 3 months ago',
      quote:
        'What an amazing experience I had with Silvia, Richard, and Christian! The best time ever spent at a dealership. The customer service is top notch and they fight for your deal!'
    }
  ];

  const services = [
    { title: 'Financing', body: 'Pre-approval in minutes. We work with 50+ lenders, including credit unions, captive banks, and subprime options.' },
    { title: 'Trade-In', body: 'Free appraisal in 15 minutes. Bring your title, your last invoice, and we will give you a fair offer — no pressure to use it here.' },
    { title: '125-Point Inspection', body: 'Every vehicle on the floor passes a 125-point inspection. If it fails one, it does not go on the lot.' },
    { title: 'Warranty', body: '30-day limited warranty included on every vehicle. Extended powertrain warranty and ESP options available at purchase.' }
  ];

  const hours = [
    ['Monday', '9:00 AM – 8:00 PM'],
    ['Tuesday', '9:00 AM – 8:00 PM'],
    ['Wednesday', '9:00 AM – 8:00 PM'],
    ['Thursday', '9:00 AM – 8:00 PM'],
    ['Friday', '9:00 AM – 8:00 PM'],
    ['Saturday', '9:00 AM – 8:00 PM'],
    ['Sunday', '10:00 AM – 7:00 PM']
  ];
</script>

<!-- Loading overlay: stays visible until Ferrari + ToyCar .glb files load.
     Branded content makes the wait feel intentional instead of broken. -->
{#if !loadState.ready}
  <div class="loading-screen" out:fade={{ duration: 500 }}>
    <div class="loading-inner">
      <span class="loading-eyebrow">AutoNation USA · Centennial · Las Vegas</span>
      <h1 class="loading-title">
        The Showroom,<br />Reimagined.
      </h1>
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span class="loading-status">
        {loadState.ferrari ? '✓' : '·'} Ferrari ·
        {loadState.toyCar ? '✓' : '·'} Compact
      </span>
    </div>
  </div>
{/if}

<div class="canvas-fixed">
  <Canvas>
    <Scene />
    <Renderer />
  </Canvas>
</div>

<!-- Mobile-only sticky CTA bar. Three thumb-sized actions floating at
     the bottom of the viewport. Hidden on desktop (>720px). -->
<nav class="mobile-cta" aria-label="Quick actions">
  <a href="tel:7252915110" class="mobile-cta-btn">
    <span class="mobile-cta-icon" aria-hidden="true">☎</span>
    <span class="mobile-cta-label">Call</span>
  </a>
  <a href="#inventory-anchor" class="mobile-cta-btn">
    <span class="mobile-cta-icon" aria-hidden="true">▦</span>
    <span class="mobile-cta-label">Inventory</span>
  </a>
  <a
    href="https://maps.google.com/?q=8570+W+Centennial+Pkwy+Las+Vegas+NV+89149"
    target="_blank"
    rel="noopener"
    class="mobile-cta-btn"
  >
    <span class="mobile-cta-icon" aria-hidden="true">→</span>
    <span class="mobile-cta-label">Directions</span>
  </a>
</nav>

<!-- HTML labels positioned via per-frame Vector3.project() — see Scene.svelte useTask. -->
<div class="labels-overlay">
  {#each labelState.items as label, i (label.id)}
    {#if label.visible}
      <div
        class="label"
        style="left: {label.x}px; top: {label.y}px; opacity: {label.opacity};"
        transition:labelReveal={{ delay: i * 80 }}
      >
        <div class="dot"></div>
        <div class="card">
          <span class="t">{label.title}</span>
          <span class="d">{label.detail}</span>
        </div>
      </div>
    {/if}
  {/each}
</div>

<!-- The corridor: 3D-driven sections. Scroll progress is computed
     against this element so it clamps when the user scrolls past. -->
<div class="corridor" bind:this={corridorEl}>
  <header class="reveal-stagger" use:reveal>
    <span class="eyebrow">AutoNation USA · Centennial · Las Vegas</span>
    <h1>The Showroom,<br />Reimagined.</h1>
    <p>A small showroom of considered vehicles. No pressure, no theatrics — just three cars at a time, treated with care.</p>
    <div class="rating">
      <span class="stars">★★★★★</span>
      <span class="rating-num">4.7</span>
      <span class="rating-meta">· 812 reviews · "No pressure. Fair offer. Felt like a valued customer."</span>
    </div>
  </header>

  <section class="reveal-stagger" use:reveal>
    <span class="num">Nº 01</span>
    <h2>The concept.</h2>
    <p>
      Forged carbon body, sculpted aluminum bones, hand-finished trim. The
      featured car arrives with full presence — silhouette honest, lines
      uninterrupted. This is the car as it was intended to be seen.
    </p>
  </section>

  <section class="reveal-stagger" use:reveal>
    <span class="num">Nº 02</span>
    <h2>Anatomy.</h2>
    <p>
      Every panel pulls back into the air around it. Body, glass, four
      forged rims, each suspended in its rightful place. We tell you
      exactly what you are buying — every bolt accounted for.
    </p>
  </section>

  <section class="reveal-stagger" use:reveal>
    <span class="num">Nº 03</span>
    <h2>Restored.</h2>
    <p>
      The panels return to their frame. The camera lifts and the corridor
      opens. The next car is already waiting in the haze ahead — same
      level of attention, different intent.
    </p>
  </section>

  <section class="reveal-stagger" use:reveal>
    <span class="num">Nº 04</span>
    <h2>The compact.</h2>
    <p>
      A smaller footprint, the same level of presentation. Whatever fits
      this slot in our inventory rotates through — sedan, hatchback,
      crossover. The light treats it with the same patience.
    </p>
  </section>

  <section class="reveal-stagger" use:reveal>
    <span class="num">Nº 05</span>
    <h2>The Denali.</h2>
    <p>
      Full-size utility, chrome belt-line, vertical-bar grille, tall
      cabin. Built for the family, the worksite, the long route home.
      The third slot in the showroom — and the deepest in the catalog.
    </p>
  </section>
</div>

<!-- Dealership content tier — solid backgrounds, fixed canvas frozen behind. -->
<div class="dealership">
  <section class="inventory" id="inventory-anchor">
    <header class="section-head reveal-stagger" use:reveal>
      <span class="kicker">Inventory</span>
      <h2>Browse the Floor.</h2>
      <p>Refreshed daily. Eight on the lot right now — full inventory is bigger.</p>
    </header>

    <div class="inventory-controls">
      <div class="chips" role="tablist" aria-label="Filter by category">
        {#each categories as cat}
          <button
            class="chip"
            class:active={selectedCategory === cat}
            role="tab"
            aria-selected={selectedCategory === cat}
            onclick={() => (selectedCategory = cat)}
          >
            {cat}
          </button>
        {/each}
      </div>
      <label class="sort-control">
        <span>Sort</span>
        <select bind:value={sortBy}>
          <option value="featured">Featured</option>
          <option value="year">Year — newest</option>
          <option value="price-asc">Price — low to high</option>
          <option value="price-desc">Price — high to low</option>
          <option value="miles">Mileage — low to high</option>
        </select>
      </label>
    </div>

    {#if filteredInventory.length === 0}
      <div class="empty-state">
        <p>No {selectedCategory.toLowerCase()} vehicles on the floor right now.</p>
        <button class="reset" onclick={() => (selectedCategory = 'All')}>Show all →</button>
      </div>
    {:else}
      <div class="inventory-grid reveal-stagger" use:reveal>
        {#each filteredInventory as v, i (v.year + v.make + v.model)}
          <article class="vehicle-card" use:spotlight>
            <span class="badge">
              {v.category}{#each v.tags as t}<span class="tag-sep"> · </span>{t}{/each}
            </span>
            <h3>
              <span class="yy">{v.year}</span>
              <span class="mm">{v.make}</span>
              <span class="md">{v.model}</span>
            </h3>
            <div class="specs">
              <span class="price">${v.price.toLocaleString()}</span>
              <span class="miles">{v.miles.toLocaleString()} mi</span>
            </div>
            <a class="vehicle-cta" href="tel:7252915110">Inquire →</a>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="reviews">
    <header class="section-head reveal-stagger" use:reveal>
      <span class="kicker">Reviews</span>
      <h2>What Customers Say.</h2>
      <p>4.7 · 812 reviews · Las Vegas locals · Real names, real stories.</p>
    </header>

    <div class="reviews-grid reveal-stagger" use:reveal>
      {#each reviews as r, i}
        <article class="review-card">
          <div class="stars">★★★★★</div>
          <p class="quote">"{r.quote}"</p>
          <div class="byline">
            <span class="name">{r.name}</span>
            <span class="meta">{r.meta}</span>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="services">
    <header class="section-head reveal-stagger" use:reveal>
      <span class="kicker">What we do</span>
      <h2>Beyond the keys.</h2>
      <p>Financing, trade-in, inspection, warranty. The whole transaction in one building.</p>
    </header>

    <div class="services-grid reveal-stagger" use:reveal>
      {#each services as s, i}
        <article class="service-card">
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="hours-block">
    <header class="section-head reveal-stagger" use:reveal>
      <span class="kicker">Hours</span>
      <h2>Open every day.</h2>
    </header>
    <div class="hours-grid reveal-stagger" use:reveal>
      {#each hours as [day, time]}
        <div class="hours-row">
          <span class="day">{day}</span>
          <span class="time">{time}</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="contact">
    <header class="section-head reveal-stagger" use:reveal>
      <span class="kicker">Get In Touch</span>
      <h2>Tell Us What You Want.</h2>
      <p>We respond within an hour during business hours. No autobots, no telemarketing — just a salesperson who knows the inventory.</p>
    </header>

    {#if formSubmitted}
      <div class="form-success">
        <span class="success-icon">✓</span>
        <h3>Got it — we'll be in touch.</h3>
        <p>One of the team will reach out to <strong>{form.email}</strong>{form.phone ? ` or ${form.phone}` : ''} within an hour. Talk soon.</p>
      </div>
    {:else}
      <form class="contact-form reveal-stagger" onsubmit={handleSubmit} use:reveal>
        <label class="field">
          <span>Name</span>
          <input type="text" bind:value={form.name} required autocomplete="name" />
        </label>
        <label class="field">
          <span>Email</span>
          <input type="email" bind:value={form.email} required autocomplete="email" />
        </label>
        <label class="field">
          <span>Phone <em class="opt">(optional)</em></span>
          <input type="tel" bind:value={form.phone} autocomplete="tel" />
        </label>
        <label class="field">
          <span>Interested in</span>
          <select bind:value={form.vehicle}>
            <option value="">No specific vehicle yet</option>
            {#each inventory as v}
              <option value="{v.year} {v.make} {v.model}">
                {v.year} {v.make} {v.model} — ${v.price.toLocaleString()}
              </option>
            {/each}
          </select>
        </label>
        <label class="field full-width">
          <span>Message <em class="opt">(optional)</em></span>
          <textarea bind:value={form.message} rows="4" placeholder="Anything you want us to know before we reach out."></textarea>
        </label>
        <div class="form-actions full-width">
          <button type="submit" class="submit">Send →</button>
          <span class="privacy">We never share your info. Single salesperson contact, then radio silence unless you want more.</span>
        </div>
      </form>
    {/if}
  </section>

  <footer class="visit reveal-stagger" use:reveal>
    <span class="kicker">Visit</span>
    <h2>8570 W Centennial Pkwy<br />Las Vegas, NV 89149</h2>
    <p class="contact">
      <a href="tel:7252915110">(725) 291-5110</a>
    </p>
    <a
      class="directions-cta"
      href="https://maps.google.com/?q=8570+W+Centennial+Pkwy+Las+Vegas+NV+89149"
      target="_blank"
      rel="noopener"
    >
      Get Directions →
    </a>
    <p class="testimonial">
      <em>
        "Royce Tran is very nice and I made a lot of trouble for him, but he
        was very patient and helpful. If you want to purchase a vehicle from
        AutoNation, go to Royce. He is the best."
      </em>
    </p>
    <p class="fineprint">
      AutoNation USA Centennial · A different kind of dealer.
    </p>
  </footer>
</div>

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
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--lux-accent);
    flex-shrink: 0;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    padding: 0.55rem 0.9rem;
    background: rgba(14, 14, 16, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--lux-accent-line);
    border-radius: 0.3rem;
    color: var(--lux-ink);
    min-width: 12rem;
    max-width: 22rem;
  }

  .t {
    font-family: var(--sans);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--lux-accent);
  }

  .d {
    font-family: var(--small-caps);
    font-size: 0.92rem;
    font-style: italic;
    color: var(--lux-ink-2);
    line-height: 1.4;
  }

  /* ─── Corridor (3D-driven sections) ─────────────────────────────── */
  .corridor > header,
  .corridor > section {
    position: relative;
    z-index: 1;
    /* 100vh per section — one viewport of attention per scene. */
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
    font-family: var(--sans);
    font-size: 0.74rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--lux-accent);
  }

  .num {
    /* Editorial section number — small italic serif, champagne color.
       Reads as a magazine pull-number ("Nº 01") rather than a monospace
       code label. */
    font-family: var(--small-caps);
    font-style: italic;
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    color: var(--lux-accent);
    font-weight: 500;
  }

  .corridor h1 {
    /* Libre Caslon Display: high-contrast modern serif. Single weight
       (regular only) — weight comes from size, not stroke. */
    font-family: var(--serif);
    font-size: clamp(2.75rem, 9vw, 7rem);
    font-weight: 400;
    line-height: 1.0;
    color: var(--lux-ink);
    letter-spacing: -0.015em;
    padding-bottom: 0.08em;
  }

  .corridor h2 {
    font-family: var(--serif);
    font-size: clamp(2rem, 5.5vw, 4rem);
    font-weight: 400;
    line-height: 1.0;
    color: var(--lux-ink);
    letter-spacing: -0.02em;
    max-width: 22ch;
    padding-bottom: 0.08em;
  }

  .corridor p {
    color: var(--lux-muted);
    font-family: var(--sans);
    font-size: clamp(1.05rem, 1.4vw, 1.2rem);
    max-width: 52ch;
    line-height: 1.7;
    font-weight: 400;
    letter-spacing: -0.003em;
  }

  .rating {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.92rem;
    pointer-events: auto;
  }
  .stars {
    color: var(--lux-accent);
    letter-spacing: 0.06em;
    font-size: 1.05rem;
  }
  .rating-num {
    font-family: var(--serif);
    color: var(--lux-accent);
    font-weight: 400;
    font-size: 1.1rem;
  }
  .rating-meta {
    color: var(--lux-muted);
    font-style: italic;
    font-family: var(--small-caps);
    font-size: 1rem;
  }

  /* ─── Dealership content (post-corridor) ────────────────────────── */
  .dealership {
    position: relative;
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(14, 14, 16, 0.0) 0%, rgba(14, 14, 16, 0.95) 6%, rgba(14, 14, 16, 0.985) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .dealership section,
  .dealership footer {
    padding: clamp(3rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem);
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-head {
    margin-bottom: clamp(2rem, 4vw, 3.5rem);
  }

  .section-head .kicker {
    font-family: var(--sans);
    font-size: 0.74rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--lux-accent);
    display: block;
    margin-bottom: 0.6rem;
  }

  .section-head h2 {
    font-family: var(--serif);
    font-size: clamp(2.25rem, 5.5vw, 4rem);
    font-weight: 400;
    line-height: 1.0;
    color: var(--lux-ink);
    letter-spacing: -0.02em;
    margin-bottom: 0.65rem;
    padding-bottom: 0.06em;
  }

  .section-head p {
    color: var(--lux-muted);
    font-size: clamp(1rem, 1.3vw, 1.15rem);
    max-width: 56ch;
    line-height: 1.6;
  }

  /* Inventory controls */
  .inventory-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.2rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .chip {
    padding: 0.55rem 1.1rem;
    background: transparent;
    border: 1px solid var(--lux-border);
    border-radius: 99px;
    color: var(--lux-muted);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    font-family: var(--sans);
  }

  .chip:hover {
    color: var(--lux-ink);
    border-color: var(--lux-accent-line);
  }

  .chip.active {
    background: var(--lux-accent-soft);
    color: var(--lux-accent);
    border-color: var(--lux-accent-line);
  }

  .sort-control {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.74rem;
    color: var(--lux-muted);
    font-family: var(--sans);
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .sort-control select {
    padding: 0.55rem 0.85rem;
    background: transparent;
    border: 1px solid var(--lux-border);
    border-radius: 0.3rem;
    color: var(--lux-ink);
    font-size: 0.85rem;
    font-family: var(--sans);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    cursor: pointer;
  }
  .sort-control select:focus {
    outline: none;
    border-color: var(--lux-accent-line);
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    background: var(--lux-surface);
    border: 1px dashed var(--lux-border);
    border-radius: 0.4rem;
  }
  .empty-state p {
    color: var(--lux-muted);
    margin-bottom: 1rem;
  }
  .empty-state .reset {
    background: transparent;
    border: 1px solid var(--lux-accent-line);
    color: var(--lux-accent);
    padding: 0.55rem 1.1rem;
    border-radius: 0.3rem;
    font-family: var(--sans);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .empty-state .reset:hover {
    background: var(--lux-accent-soft);
  }

  .tag-sep {
    opacity: 0.6;
  }

  /* Inventory grid */
  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
  }

  .vehicle-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.5rem 1.4rem 1.2rem;
    background: var(--lux-surface);
    border: 1px solid var(--lux-border);
    border-radius: 0.45rem;
    transition: border-color 0.25s, transform 0.25s, background 0.25s;
  }

  .vehicle-card:hover {
    border-color: var(--lux-accent-line);
    background: var(--lux-surface-2);
    transform: translateY(-3px);
  }

  .vehicle-card .badge {
    font-family: var(--sans);
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--lux-accent);
    align-self: flex-start;
  }

  .vehicle-card h3 {
    font-family: var(--serif);
    font-size: 1.4rem;
    line-height: 1.15;
    color: var(--lux-ink);
    font-weight: 400;
    letter-spacing: -0.005em;
  }
  .vehicle-card h3 .yy {
    color: var(--lux-muted);
    font-style: italic;
    font-family: var(--small-caps);
    font-size: 0.85em;
    margin-right: 0.4em;
  }
  .vehicle-card h3 .mm {
    margin-right: 0.3em;
  }
  .vehicle-card h3 .md {
    display: block;
    color: var(--lux-ink);
  }

  .specs {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--lux-border);
  }
  .price {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--lux-accent);
    letter-spacing: -0.01em;
  }
  .miles {
    font-size: 0.82rem;
    color: var(--lux-muted);
    font-family: var(--small-caps);
    font-style: italic;
  }

  .vehicle-cta {
    align-self: flex-start;
    margin-top: 0.2rem;
    font-size: 0.75rem;
    color: var(--lux-accent);
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family: var(--sans);
  }
  .vehicle-cta:hover {
    color: var(--lux-ink);
  }

  /* Reviews grid */
  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1.25rem;
  }

  .review-card {
    padding: 1.75rem 1.6rem 1.5rem;
    background: var(--lux-surface);
    border: 1px solid var(--lux-border);
    border-left: 2px solid var(--lux-oxblood);
    border-radius: 0 0.45rem 0.45rem 0;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .review-card .stars {
    color: var(--lux-accent);
    font-size: 0.95rem;
    letter-spacing: 0.08em;
  }
  .review-card .quote {
    font-family: var(--serif);
    color: var(--lux-ink);
    font-size: 1.1rem;
    line-height: 1.5;
    flex-grow: 1;
    font-style: italic;
  }
  .byline {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.8rem;
    border-top: 1px solid var(--lux-border);
  }
  .byline .name {
    font-family: var(--sans);
    font-weight: 600;
    color: var(--lux-ink);
    font-size: 0.95rem;
    letter-spacing: 0.01em;
  }
  .byline .meta {
    color: var(--lux-muted);
    font-size: 0.85rem;
    font-family: var(--small-caps);
    font-style: italic;
  }

  /* Services grid */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .service-card {
    padding: 1.75rem 1.6rem;
    background: var(--lux-surface);
    border: 1px solid var(--lux-border);
    border-radius: 0.45rem;
  }
  .service-card h3 {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--lux-ink);
    margin-bottom: 0.7rem;
    letter-spacing: -0.005em;
  }
  .service-card p {
    color: var(--lux-muted);
    font-size: 0.95rem;
    line-height: 1.65;
  }

  /* Hours */
  .hours-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
    max-width: 32rem;
  }
  .hours-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.95rem 0;
    border-bottom: 1px solid var(--lux-border);
    font-size: 0.95rem;
  }
  .hours-row:last-child {
    border-bottom: none;
  }
  .hours-row .day {
    color: var(--lux-ink);
    font-weight: 500;
    font-family: var(--sans);
  }
  .hours-row .time {
    color: var(--lux-accent);
    font-family: var(--small-caps);
    font-style: italic;
    font-size: 1rem;
  }

  /* Contact form */
  .contact-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1.1rem 1.4rem;
    max-width: 56rem;
  }
  .contact-form .full-width {
    grid-column: 1 / -1;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field > span {
    font-family: var(--sans);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--lux-muted);
    font-weight: 500;
  }
  .field .opt {
    font-style: italic;
    opacity: 0.75;
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--small-caps);
  }

  .field input,
  .field select,
  .field textarea {
    padding: 0.95rem 1rem;
    background: transparent;
    border: 1px solid var(--lux-border);
    border-radius: 0.3rem;
    color: var(--lux-ink);
    font-size: 1rem;
    font-family: var(--sans);
    transition: border-color 0.2s, background 0.2s;
  }
  .field textarea {
    resize: vertical;
    line-height: 1.55;
  }
  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--lux-accent);
    background: var(--lux-surface);
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .submit {
    padding: 1rem 2.2rem;
    background: var(--lux-accent);
    color: var(--lux-bg);
    border: none;
    border-radius: 0.3rem;
    font-weight: 600;
    font-size: 0.8rem;
    font-family: var(--sans);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .submit:hover {
    background: var(--lux-ink);
    transform: translateY(-1px);
  }

  .privacy {
    color: var(--lux-muted-2);
    font-size: 0.82rem;
    font-style: italic;
    font-family: var(--small-caps);
    max-width: 36ch;
    line-height: 1.5;
  }

  .form-success {
    padding: 2.5rem;
    background: var(--lux-surface);
    border: 1px solid var(--lux-accent-line);
    border-left: 2px solid var(--lux-accent);
    border-radius: 0 0.45rem 0.45rem 0;
    max-width: 38rem;
  }
  .form-success .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    background: transparent;
    border: 1.5px solid var(--lux-accent);
    color: var(--lux-accent);
    border-radius: 50%;
    font-weight: 400;
    font-size: 1.1rem;
    margin-bottom: 1.2rem;
  }
  .form-success h3 {
    font-family: var(--serif);
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--lux-ink);
    margin-bottom: 0.6rem;
    letter-spacing: -0.01em;
  }
  .form-success p {
    color: var(--lux-muted);
    line-height: 1.6;
  }
  .form-success strong {
    color: var(--lux-ink);
    font-weight: 600;
  }

  /* Visit footer */
  .visit {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    padding-top: clamp(3rem, 8vw, 6rem);
    padding-bottom: clamp(4rem, 10vw, 8rem);
    border-top: 1px solid var(--lux-border);
    margin-top: 2rem;
  }
  .visit .kicker {
    font-family: var(--sans);
    font-size: 0.74rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--lux-accent);
  }
  .visit h2 {
    font-family: var(--serif);
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 400;
    line-height: 1.05;
    color: var(--lux-ink);
    letter-spacing: -0.015em;
    padding-bottom: 0.05em;
  }
  .visit .contact {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--lux-ink);
  }
  .visit .contact a {
    color: var(--lux-accent);
    text-decoration: none;
    border-bottom: 1px solid var(--lux-accent-line);
    padding-bottom: 0.05em;
  }
  .visit .contact a:hover {
    color: var(--lux-ink);
    border-bottom-color: var(--lux-ink);
  }
  .directions-cta {
    align-self: flex-start;
    padding: 1rem 2.2rem;
    background: transparent;
    color: var(--lux-accent);
    border: 1px solid var(--lux-accent);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.8rem;
    font-family: var(--sans);
    border-radius: 0.3rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: background 0.2s, color 0.2s;
  }
  .directions-cta:hover {
    background: var(--lux-accent);
    color: var(--lux-bg);
  }
  .testimonial {
    font-family: var(--serif);
    color: var(--lux-ink);
    font-size: 1.15rem;
    line-height: 1.55;
    font-style: italic;
    border-left: 2px solid var(--lux-oxblood);
    padding-left: 1.4rem;
    max-width: 60ch;
  }
  .testimonial em {
    font-style: normal;
  }
  .fineprint {
    color: var(--lux-muted-2);
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family: var(--sans);
    margin-top: 1.5rem;
  }

  /* Reveal rules live in app.css (global) so Svelte's CSS scoper
     doesn't tree-shake away the `.revealed` rule, since `.revealed`
     is only added by JS and never appears in the template. */

  /* ─── Cursor-follow spotlight on inventory cards ────────────────
     `use:spotlight` writes mouse position into --mx / --my.
     A radial gradient pseudo-element follows the cursor on hover.
     z-index: 0 keeps it behind the card content (text/badge/specs). */
  .vehicle-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      300px circle at var(--mx, 50%) var(--my, 50%),
      rgba(197, 165, 114, 0.08),
      transparent 55%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 0;
  }
  .vehicle-card > * {
    position: relative;
    z-index: 1;
  }
  .vehicle-card:hover::before {
    opacity: 1;
  }
  .vehicle-card:hover {
    transform: translateY(-3px);
  }

  /* Sheen sweep on the primary CTA buttons. */
  .submit,
  .directions-cta {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .submit::after,
  .directions-cta::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 0%,
      transparent 35%,
      rgba(255, 255, 255, 0.25) 50%,
      transparent 65%,
      transparent 100%
    );
    transform: translateX(-110%);
    transition: transform 0.7s ease;
    pointer-events: none;
    z-index: -1;
  }
  .submit:hover::after,
  .directions-cta:hover::after {
    transform: translateX(110%);
  }

  /* ─── Loading overlay ────────────────────────────────────────────
     Stays visible until both async-loaded .glb files resolve.
     Branded so the wait feels intentional. */
  .loading-screen {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(ellipse 100% 80% at top, rgba(176, 38, 255, 0.18), transparent),
      radial-gradient(ellipse 80% 60% at bottom, rgba(0, 240, 255, 0.10), transparent),
      var(--bg);
  }

  .loading-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.2rem;
    padding: clamp(2rem, 6vw, 4rem);
    max-width: 900px;
  }

  .loading-eyebrow {
    font-family: var(--sans);
    font-size: 0.74rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--lux-accent);
  }

  .loading-title {
    font-family: var(--serif);
    font-size: clamp(2.5rem, 8vw, 6rem);
    font-weight: 400;
    line-height: 1.0;
    letter-spacing: -0.015em;
    color: var(--lux-ink);
    padding-bottom: 0.08em;
  }

  .loading-dots {
    display: flex;
    gap: 0.55rem;
    margin-top: 0.5rem;
  }
  .loading-dots span {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--lux-accent);
    border-radius: 50%;
    /* Removed neon glow — restrained champagne pulse instead. */
    animation: bounce 1s ease-in-out infinite;
  }
  .loading-dots span:nth-child(2) {
    animation-delay: 0.15s;
  }
  .loading-dots span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-0.6rem); opacity: 1; }
  }

  .loading-status {
    font-family: var(--small-caps);
    font-style: italic;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
    color: var(--lux-muted);
    margin-top: 0.5rem;
  }

  /* ─── Mobile sticky CTA bar ──────────────────────────────────────
     Hidden on desktop. On phones, three thumb-sized buttons fixed at
     the bottom of the viewport: Call · Inventory · Directions. */
  .mobile-cta {
    display: none;
  }

  @media (max-width: 720px) {
    .mobile-cta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      padding: 0.55rem 0.55rem calc(0.55rem + env(safe-area-inset-bottom));
      gap: 0.45rem;
      background: rgba(14, 14, 16, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--lux-border);
    }
    .mobile-cta-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      padding: 0.7rem 0.4rem;
      background: transparent;
      border: 1px solid var(--lux-border);
      border-radius: 0.3rem;
      color: var(--lux-ink);
      text-decoration: none;
      font-size: 0.78rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      transition: background 0.15s, border-color 0.15s;
    }
    .mobile-cta-btn:active {
      background: var(--lux-accent-soft);
      border-color: var(--lux-accent-line);
    }
    .mobile-cta-icon {
      font-size: 1.05rem;
      color: var(--lux-accent);
      line-height: 1;
    }
    .mobile-cta-label {
      font-family: var(--sans);
      font-size: 0.66rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--lux-muted);
    }
    /* Make sure the visit footer doesn't sit right under the CTA bar */
    .visit {
      padding-bottom: calc(4rem + env(safe-area-inset-bottom)) !important;
    }
  }

  /* ─── Mobile breakpoints ─────────────────────────────────────────
     Most layout already uses clamp() + auto-fit so it adapts. These
     rules tighten the bits that need explicit small-screen behavior. */
  @media (max-width: 720px) {
    .inventory-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.9rem;
    }
    .sort-control {
      justify-content: space-between;
    }
    .chips {
      /* Horizontal scroll on phones if categories overflow */
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 0.3rem;
      margin-bottom: -0.3rem;
      scrollbar-width: thin;
    }
    .chip {
      flex-shrink: 0;
    }
    .inventory-grid {
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .vehicle-card {
      padding: 1rem 1rem 0.9rem;
    }
    .vehicle-card h3 {
      font-size: 1rem;
    }
    .price {
      font-size: 1.05rem;
    }
    .reviews-grid,
    .services-grid {
      grid-template-columns: 1fr;
    }
    .contact-form {
      grid-template-columns: 1fr;
    }
    .form-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .submit {
      text-align: center;
    }
    .privacy {
      max-width: 100%;
    }
    .corridor > header,
    .corridor > section {
      padding: clamp(1.5rem, 6vw, 2.5rem);
      gap: 1rem;
    }
  }

  @media (max-width: 460px) {
    .inventory-grid {
      grid-template-columns: 1fr;
    }
    .hours-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }

  /* Honor "reduce motion" — useful for vestibular-sensitive users */
  @media (prefers-reduced-motion: reduce) {
    .vehicle-card,
    .submit,
    .directions-cta {
      transition: none;
    }
  }
</style>
