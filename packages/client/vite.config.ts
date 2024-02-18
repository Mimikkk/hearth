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
      '@assets': path.resolve(__dirname, './assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@layout': path.resolve(__dirname, './src/layout'),
      '@typings': path.resolve(__dirname, './src/types'),
      '@context': path.resolve(__dirname, './src/context'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
});
