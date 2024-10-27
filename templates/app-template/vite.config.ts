import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  build: {
    outDir: "build",
  },
  plugins: [solid()],
  server: {
    port: 8080,
  },
});
