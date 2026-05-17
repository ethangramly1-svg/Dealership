// Shared state for the projected HTML labels that float over the 3D scene.
// Scene.svelte writes to it from useTask each frame; +page.svelte renders it.

export type ProjectedLabel = {
  id: string;
  title: string;
  detail: string;
  x: number; // screen px (CSS pixels)
  y: number; // screen px (CSS pixels)
  visible: boolean;
  opacity: number; // 0..1, eases in/out during the explosion held phase
};

export const labelState = $state<{ items: ProjectedLabel[] }>({ items: [] });
