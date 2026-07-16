import stylex from "@stylexjs/unplugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [stylex.vite()],
  test: {
    environment: "jsdom",
  },
});
