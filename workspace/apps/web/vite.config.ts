import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { createResolveAlias } from "../../../configurations/vite/vite.resolver.ts";

export default defineConfig({
  build: {
    outDir: "build",
  },
  plugins: [solid()],
  server: {
    port: 8080,
  },
  resolve: {
    alias: createResolveAlias(["@mimi/hearth", "@mimi/hearth-math"]),
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
