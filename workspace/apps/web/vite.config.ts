import { defineConfig, PluginOption } from "vite";
import solid from "vite-plugin-solid";
import { createAlias } from "../../../configurations/vite/vite.resolver.ts";

export default defineConfig({
  build: {
    outDir: "build",
  },
  plugins: [solid() as PluginOption],
  server: {
    port: 8080,
  },
  resolve: {
    alias: createAlias([
      "@mimi/hearth",
      "@mimi/hearth-math",
      "@mimi/ui-signals",
      "@mimi/ui-components",
      "@mimi/ui-logic-components",
    ]),
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
