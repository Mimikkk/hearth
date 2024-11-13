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
    alias: createAlias(["@mimi/aoc"]),
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
