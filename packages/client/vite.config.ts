import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    solid(),
    svgr(),
  ],
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: '../build',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@logic': path.resolve(__dirname, './src/shared/logic'),
      '@components': path.resolve(__dirname, './src/shared/components'),
      '@utils': path.resolve(__dirname, './src/shared/utils'),
    },
  },
});
