import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'md-quiz',
      formats: ['es'],
    },
    outDir: resolve(__dirname, 'docs'),
    emptyOutDir: false,
  },
});
