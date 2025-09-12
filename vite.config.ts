import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Build and serve examples with Vite.
// We keep output in examples/build to match existing GitHub Pages workflow.
export default defineConfig({
  root: resolve(__dirname, 'examples'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'examples', 'build'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        triangle: resolve(__dirname, 'examples', 'triangle.html'),
        particles: resolve(__dirname, 'examples', 'particles.html'),
        normalsMap: resolve(__dirname, 'examples', 'normals-map.html'),
        roboto: resolve(__dirname, 'examples', 'roboto.html')
      }
    }
  },
  server: {
    open: '/triangle.html'
  }
});
