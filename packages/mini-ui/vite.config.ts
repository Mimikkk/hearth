import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './',
  plugins: [dts()],
  build: {
    outDir: './build',
    lib: {
      entry: 'src/mini-ui.ts',
      name: 'mini-ui',
      fileName: 'mini-ui',
      formats: ['es', 'cjs'],
    },
  },
});
