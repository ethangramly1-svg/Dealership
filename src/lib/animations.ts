// Svelte actions for entrance reveals + cursor-follow spotlight.
//
// `reveal` watches the element with IntersectionObserver and adds the
// `revealed` class once it's in view AND the loading screen has gone
// away. Without the loadState gate, reveals fire while the loading
// overlay is still up — the animation runs hidden under the overlay
// and the user never sees it.
//
// `spotlight` tracks the cursor over the element and writes its position
// into `--mx` / `--my` CSS variables — used by a radial-gradient pseudo
// element to follow the mouse.

import { loadState } from './loadState.svelte';

type RevealOptions = {
  delay?: number; // ms before the reveal class is applied
  threshold?: number; // 0..1, how much of the element must be visible
};

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  const { delay = 0, threshold = 0.15 } = options;

  if (delay > 0) {
    node.style.animationDelay = `${delay}ms`;
  }

  let revealed = false;
  const markRevealed = () => {
    if (revealed) return;
    revealed = true;
    node.classList.add('revealed');
  };

  let observer: IntersectionObserver | null = null;
  let safetyTimer: number | null = null;
  let readyPoll: number | null = null;

  function startObserving() {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            markRevealed();
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(node);

    // Safety net: if observer never fires within 2s of starting,
    // force the reveal so content is never stuck off-screen.
    safetyTimer = window.setTimeout(markRevealed, 2000);
  }

  // Defer observation until the loading screen has gone (models loaded).
  // Otherwise the reveal animation plays under the overlay and the user
  // never sees it.
  if (loadState.ready) {
    startObserving();
  } else {
    readyPoll = window.setInterval(() => {
      if (loadState.ready) {
        window.clearInterval(readyPoll!);
        readyPoll = null;
        // Tiny buffer (300ms) so the loading screen's own fade has time
        // to finish before the cards start sliding in — the two motions
        // shouldn't overlap.
        window.setTimeout(startObserving, 300);
      }
    }, 100);
  }

  return {
    destroy() {
      observer?.disconnect();
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
      if (readyPoll != null) window.clearInterval(readyPoll);
    }
  };
}

export function spotlight(node: HTMLElement) {
  function handle(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    node.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }
  node.addEventListener('mousemove', handle);
  return {
    destroy() {
      node.removeEventListener('mousemove', handle);
    }
  };
}
