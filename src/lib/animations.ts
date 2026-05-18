// Svelte actions for entrance reveals + cursor-follow spotlight.
//
// `reveal` watches the element with IntersectionObserver and adds the
// `revealed` class once it's in view. CSS handles the actual transition.
//
// `spotlight` tracks the cursor over the element and writes its position
// into `--mx` / `--my` CSS variables — used by a radial-gradient pseudo
// element to follow the mouse.

type RevealOptions = {
  delay?: number; // ms before the reveal class is applied
  threshold?: number; // 0..1, how much of the element must be visible
};

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  const { delay = 0, threshold = 0.15 } = options;

  if (delay > 0) {
    node.style.transitionDelay = `${delay}ms`;
  }

  let revealed = false;
  const markRevealed = () => {
    if (revealed) return;
    revealed = true;
    node.classList.add('revealed');
  };

  // Safety net: if the observer doesn't fire within 1.5s (race condition with
  // loading screen, hydration timing, browser quirks), force the reveal so
  // content is never stuck invisible.
  const safetyTimer = window.setTimeout(markRevealed, 1500);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          markRevealed();
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold, rootMargin: '0px 0px -8% 0px' }
  );

  observer.observe(node);
  return {
    destroy() {
      observer.disconnect();
      window.clearTimeout(safetyTimer);
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
