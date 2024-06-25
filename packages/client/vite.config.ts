/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import arraybuffer from 'vite-plugin-arraybuffer';

const resolveAt = (relativePath: string) => path.resolve(__dirname, relativePath);
const createAliases = (...aliases: [alias: string, path: string][]) =>
  Object.fromEntries(aliases.map(([alias, path]) => [alias, resolveAt(path)]));

export default defineConfig({
  base: './',
  plugins: [solid(), svgr(), arraybuffer()],
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: '../build',
  },
  resolve: {
    alias: createAliases(
      ['@', 'src'],
      ['@shared', 'src/shared'],
      ['@modules', 'src/modules'],
      ['@logic', 'src/shared/logic'],
      ['@components', 'src/shared/components'],
      ['@utils', 'src/shared/utils'],
    ),
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
