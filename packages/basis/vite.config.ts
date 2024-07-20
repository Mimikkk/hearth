import { defineConfig } from 'vite';
import arraybuffer from 'vite-plugin-arraybuffer';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './',
  plugins: [arraybuffer(), dts()],
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: './build',
    lib: {
      entry: 'src/index.ts',
      name: 'basis',
      fileName: 'basis',
      formats: ['es', 'cjs'],
    },
  },
});
