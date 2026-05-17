import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');
// GitHub Actions sets BASE_PATH=/Dealership at build time so all asset URLs
// pick up the GH Pages subdirectory. Locally, base stays empty.
const BASE_PATH = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // SPA mode — single shell, client routes
      precompress: false,
      strict: true
    }),
    paths: {
      base: dev ? '' : BASE_PATH
    }
  }
};
