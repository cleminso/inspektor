import stylex from "@stylexjs/unplugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PORT = Number.parseInt(process.env.PORT ?? "1356", 10);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["@inspector/ds"],
  },
  plugins: [
    stylex.vite(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
  server: { port: PORT, host: true, strictPort: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  test: {
    environment: "jsdom",
    exclude: ["scripts/**", "node_modules/**"],
  },
});
