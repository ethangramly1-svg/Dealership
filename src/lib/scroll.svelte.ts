// Reactive scroll progress, consumed by Scene.svelte via $derived.
//
// Progress is computed against a specific "corridor" element — the 3D
// hero portion of the page — so it goes 0→1 over the corridor's scroll
// extent and clamps at 1 once the user has scrolled past it. Below the
// corridor, the 3D scene freezes at end-state while dealership content
// scrolls underneath.
export const scrollState = $state({ progress: 0 });

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const mapScrollToProgress = easeInOutCubic;

export function bindWindowScroll(corridorEl?: HTMLElement): () => void {
  const update = () => {
    let raw = 0;
    if (corridorEl) {
      const rect = corridorEl.getBoundingClientRect();
      const corridorScroll = corridorEl.offsetHeight - window.innerHeight;
      if (corridorScroll > 0) {
        raw = Math.min(1, Math.max(0, -rect.top / corridorScroll));
      }
    } else {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) raw = Math.min(1, Math.max(0, window.scrollY / max));
    }
    scrollState.progress = mapScrollToProgress(raw);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}
