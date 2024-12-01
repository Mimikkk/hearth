import type { Config } from "tailwindcss";
import { config } from "../../../configurations/tailwindcss/tailwind.config.ts";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [config],
} satisfies Config;
