import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import svgr from 'vite-plugin-svgr';
import path from 'path';

const resolveAt = (relativePath: string) => path.resolve(__dirname, relativePath);
const createAliases = (...aliases: [alias: string, path: string][]) =>
  Object.fromEntries(aliases.map(([alias, path]) => [alias, resolveAt(path)]));

const prefix = `monaco-editor/esm/vs`;

export default defineConfig({
  base: './',
  plugins: [solid(), svgr()],
  server: {
    port: 8080,
    open: false,
  },
  build: {
    outDir: '../build',
    rollupOptions: {
      output: {
        manualChunks: {
          jsonWorker: [`${prefix}/language/json/json.worker`],
          cssWorker: [`${prefix}/language/css/css.worker`],
          htmlWorker: [`${prefix}/language/html/html.worker`],
          tsWorker: [`${prefix}/language/typescript/ts.worker`],
          editorWorker: [`${prefix}/editor/editor.worker`],
        },
      },
    },
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
