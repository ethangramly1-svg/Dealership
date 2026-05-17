<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/Scene.svelte';
  import Renderer from '$lib/Renderer.svelte';
  import { bindWindowScroll } from '$lib/scroll.svelte';
  import { labelState } from '$lib/labels.svelte';
  import '$lib/theatre'; // side-effect: boots Theatre.js Studio panel in dev

  let corridorEl: HTMLElement | undefined = $state();

  $effect(() => {
    if (corridorEl) return bindWindowScroll(corridorEl);
  });

  // ─── Inventory data ──────────────────────────────────────────────
  // Realistic specs across the categories AutoNation Centennial actually
  // sells (Tesla, trucks, sedans, SUVs).
  // ─────────────────────────────────────────────────────────────────
  const inventory = [
    { year: 2023, make: 'Tesla', model: 'Model 3 Long Range', price: 36500, miles: 18200, badge: 'EV · Low Miles' },
    { year: 2022, make: 'Honda', model: 'Civic Sport', price: 22800, miles: 31900, badge: 'Sedan' },
    { year: 2024, make: 'Ford', model: 'F-150 XLT 4WD', price: 48900, miles: 11500, badge: 'Truck · Fresh' },
    { year: 2023, make: 'Toyota', model: 'Camry SE', price: 26400, miles: 24100, badge: 'Sedan · Certified' },
    { year: 2022, make: 'GMC', model: 'Yukon Denali', price: 62300, miles: 27800, badge: 'SUV · Premium' },
    { year: 2024, make: 'Tesla', model: 'Model Y AWD', price: 42800, miles: 9200, badge: 'EV · Fresh' },
    { year: 2023, make: 'Chevy', model: 'Silverado 1500 LT', price: 44200, miles: 17800, badge: 'Truck' },
    { year: 2022, make: 'Mazda', model: 'CX-5 Touring', price: 28500, miles: 25700, badge: 'SUV' }
  ];

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

<!-- The corridor: 3D-driven sections. Scroll progress is computed
     against this element so it clamps when the user scrolls past. -->
<div class="corridor" bind:this={corridorEl}>
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
    <h2>The compact.</h2>
    <p>
      The second slot. Smaller footprint, same level of presentation.
      Whatever fits this slot in our actual inventory rotates through —
      sedan, hatchback, crossover. The light wraps it the same way.
    </p>
  </section>

  <section>
    <span class="num">05</span>
    <h2>The Denali.</h2>
    <p>
      Full-size SUV silhouette. Chrome belt-line, three-bar grille, tall
      cabin. Pink rim light wraps the body and the headlights answer in
      cyan. This is the third slot — luxury utility, ready for the family,
      the worksite, or the weekend.
    </p>
  </section>
</div>

<!-- Dealership content tier — solid backgrounds, fixed canvas frozen behind. -->
<div class="dealership">
  <section class="inventory">
    <header class="section-head">
      <span class="kicker">Inventory</span>
      <h2>Browse the Floor.</h2>
      <p>Refreshed daily. Eight on the lot right now — full inventory is bigger.</p>
    </header>

    <div class="inventory-grid">
      {#each inventory as v}
        <article class="vehicle-card">
          <span class="badge">{v.badge}</span>
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
  </section>

  <section class="reviews">
    <header class="section-head">
      <span class="kicker">Reviews</span>
      <h2>What Customers Say.</h2>
      <p>4.7 · 812 reviews · Las Vegas locals · Real names, real stories.</p>
    </header>

    <div class="reviews-grid">
      {#each reviews as r}
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
    <header class="section-head">
      <span class="kicker">What we do</span>
      <h2>Beyond the keys.</h2>
      <p>Financing, trade-in, inspection, warranty. The whole transaction in one building.</p>
    </header>

    <div class="services-grid">
      {#each services as s}
        <article class="service-card">
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="hours-block">
    <header class="section-head">
      <span class="kicker">Hours</span>
      <h2>Open every day.</h2>
    </header>
    <div class="hours-grid">
      {#each hours as [day, time]}
        <div class="hours-row">
          <span class="day">{day}</span>
          <span class="time">{time}</span>
        </div>
      {/each}
    </div>
  </section>

  <footer class="visit">
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

  /* ─── Corridor (3D-driven sections) ─────────────────────────────── */
  .corridor > header,
  .corridor > section {
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

  .corridor h1 {
    font-size: clamp(2.75rem, 10vw, 8rem);
    font-weight: 900;
    line-height: 0.92;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple) 55%, var(--neon-pink));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: -0.035em;
  }

  .corridor h2 {
    font-size: clamp(1.75rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.04;
    color: var(--ink);
    letter-spacing: -0.022em;
    max-width: 22ch;
  }

  .corridor p {
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
    pointer-events: auto;
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

  /* ─── Dealership content (post-corridor) ────────────────────────── */
  .dealership {
    position: relative;
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(7, 7, 26, 0.0) 0%, rgba(7, 7, 26, 0.94) 6%, rgba(7, 7, 26, 0.97) 100%);
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
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.8rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--neon-blue);
    display: block;
    margin-bottom: 0.6rem;
  }

  .section-head h2 {
    font-size: clamp(2rem, 5vw, 3.75rem);
    font-weight: 800;
    line-height: 1.0;
    color: var(--ink);
    letter-spacing: -0.025em;
    margin-bottom: 0.65rem;
  }

  .section-head p {
    color: var(--muted);
    font-size: clamp(1rem, 1.3vw, 1.1rem);
    max-width: 56ch;
    line-height: 1.55;
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
    gap: 0.7rem;
    padding: 1.25rem 1.25rem 1.1rem;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.65rem;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .vehicle-card:hover {
    border-color: rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 0 1px rgba(0, 240, 255, 0.2), 0 12px 30px rgba(0, 240, 255, 0.08);
    transform: translateY(-2px);
  }

  .vehicle-card .badge {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--neon-blue);
    padding: 0.2rem 0.5rem;
    background: rgba(0, 240, 255, 0.06);
    border-radius: 0.25rem;
    align-self: flex-start;
  }

  .vehicle-card h3 {
    font-size: 1.15rem;
    line-height: 1.25;
    color: var(--ink);
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .vehicle-card h3 .yy {
    color: var(--muted);
    font-weight: 400;
    margin-right: 0.4em;
  }
  .vehicle-card h3 .mm {
    margin-right: 0.3em;
  }
  .vehicle-card h3 .md {
    display: block;
    color: var(--ink);
  }

  .specs {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding-top: 0.7rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .price {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .miles {
    font-size: 0.8rem;
    color: var(--muted);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
  }

  .vehicle-cta {
    align-self: flex-start;
    margin-top: 0.2rem;
    font-size: 0.85rem;
    color: var(--neon-blue);
    text-decoration: none;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .vehicle-cta:hover {
    color: var(--neon-purple);
  }

  /* Reviews grid */
  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1.25rem;
  }

  .review-card {
    padding: 1.5rem;
    background: rgba(176, 38, 255, 0.04);
    border: 1px solid rgba(176, 38, 255, 0.18);
    border-radius: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .review-card .stars {
    color: var(--gold);
    font-size: 1rem;
    letter-spacing: 0.06em;
  }
  .review-card .quote {
    color: var(--ink);
    font-size: 1rem;
    line-height: 1.55;
    flex-grow: 1;
  }
  .byline {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(176, 38, 255, 0.15);
  }
  .byline .name {
    font-weight: 700;
    color: var(--ink);
    font-size: 0.95rem;
  }
  .byline .meta {
    color: var(--muted);
    font-size: 0.78rem;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
  }

  /* Services grid */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .service-card {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.65rem;
  }
  .service-card h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--neon-blue);
    margin-bottom: 0.55rem;
    letter-spacing: -0.005em;
  }
  .service-card p {
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  /* Hours */
  .hours-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.55rem;
    max-width: 32rem;
  }
  .hours-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.85rem 1.1rem;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    font-size: 0.95rem;
  }
  .hours-row .day {
    color: var(--ink);
    font-weight: 600;
  }
  .hours-row .time {
    color: var(--muted);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.88rem;
  }

  /* Visit footer */
  .visit {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding-top: clamp(3rem, 8vw, 6rem);
    padding-bottom: clamp(4rem, 10vw, 8rem);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: 2rem;
  }
  .visit .kicker {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.8rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--neon-blue);
  }
  .visit h2 {
    font-size: clamp(1.75rem, 5vw, 3.25rem);
    font-weight: 800;
    line-height: 1.08;
    color: var(--ink);
    letter-spacing: -0.022em;
  }
  .visit .contact {
    font-size: 1.15rem;
    color: var(--ink);
  }
  .visit .contact a {
    color: var(--neon-blue);
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 240, 255, 0.4);
  }
  .directions-cta {
    align-self: flex-start;
    padding: 0.85rem 1.4rem;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
    color: var(--bg);
    text-decoration: none;
    font-weight: 700;
    border-radius: 0.5rem;
    letter-spacing: 0.01em;
    transition: transform 0.15s;
  }
  .directions-cta:hover {
    transform: translateY(-1px);
  }
  .testimonial {
    color: var(--ink);
    font-size: 1.05rem;
    line-height: 1.55;
    border-left: 2px solid var(--neon-purple);
    padding-left: 1.2rem;
    max-width: 56ch;
  }
  .testimonial em {
    font-style: normal;
  }
  .fineprint {
    color: var(--muted);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    margin-top: 1rem;
  }
</style>
