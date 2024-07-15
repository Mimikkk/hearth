import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './',
  plugins: [dts()],
  build: {
    outDir: './build',
    lib: {
      entry: 'src/ui.ts',
      name: 'ui',
      fileName: 'ui',
      formats: ['es', 'cjs'],
    },
  },
});
