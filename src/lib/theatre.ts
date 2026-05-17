// Theatre.js infrastructure — not currently driving the hero mesh
// (that's done in code via scroll.svelte.ts + Scene.svelte's $derived).
//
// Kept here for when you want pixel-perfect, Studio-authored animation
// on a specific element (camera moves, light intensity sweeps, secondary
// meshes). To use:
//
//   1. Add an object:
//        export const camObj = sheet.object('Camera', {
//          posZ: types.number(6, { range: [-20, 20] })
//        });
//
//   2. Subscribe in your component:
//        camObj.onValuesChange((v) => { cameraZ = v.posZ; });
//
//   3. Drive the sequence from scroll (in scroll.svelte.ts):
//        sheet.sequence.position = scrollState.progress * sheet.sequence.length;
//
// In production, export Studio state to JSON and pass via:
//   getProject('3D Hero', { state: stateJson })

import { getProject } from '@theatre/core';
import { browser } from '$app/environment';

if (browser && import.meta.env.DEV) {
  import('@theatre/studio').then(({ default: studio }) => studio.initialize());
}

export const project = getProject('3D Hero');
export const sheet = project.sheet('Hero Scroll');
