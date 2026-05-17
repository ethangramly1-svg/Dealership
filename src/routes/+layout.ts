// WebGL + Theatre.js Studio are browser-only — disable SSR.
// adapter-static is in SPA fallback mode, so prerender is also off:
// build produces one index.html shell that hydrates entirely on the client.
export const ssr = false;
export const prerender = false;
