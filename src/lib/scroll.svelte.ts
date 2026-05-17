// Reactive scroll progress, consumed by Scene.svelte via $derived.
export const scrollState = $state({ progress: 0 });

// ─── YOUR CALL: how does raw scroll map to animation progress? ───
//   linear:        t => t                       (mechanical)
//   ease-in-out:   easeInOutCubic(t)            (premium default)
//   sectioned:     piecewise — e.g. slow intro, fast outro
// ────────────────────────────────────────────────────────────────
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const mapScrollToProgress = easeInOutCubic;

export function bindWindowScroll(): () => void {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const raw = Math.min(1, Math.max(0, window.scrollY / max));
    scrollState.progress = mapScrollToProgress(raw);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}
