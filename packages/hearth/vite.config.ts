import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [dts({ include: ['src'] })],
  build: {
    outDir: './build',
    lib: {
      entry: {
        engine: resolve(__dirname, 'src/engine.ts'),
        nodes: resolve(__dirname, 'src/nodes/nodes.ts'),
      },
      formats: ['es', 'cjs'],
    },
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: '[name].[format].js',
      },
    },
  },
  esbuild: {
    target: 'esnext',
    platform: 'browser',
    drop: ['console'],
  },
});
