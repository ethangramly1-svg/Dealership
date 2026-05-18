// Shared load state for the 3D models. Written by Scene.svelte on each
// GLTF's onload, read by +page.svelte to drive the loading-screen fade.
//
// `ready` is true once both async-loaded models (Ferrari + ToyCar) have
// resolved. The Denali is built from primitives, so it doesn't gate ready.
export const loadState = $state({
  ferrari: false,
  toyCar: false,
  get ready() {
    return this.ferrari && this.toyCar;
  }
});
