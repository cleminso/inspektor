import stylex from "@stylexjs/unplugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PORT = Number.parseInt(process.env.PORT ?? "1356", 10);
// Avoid running the StyleX transform hook for every dependency module in the documentation build.
const stylexSourceId = /\/(?:apps|packages)\/design-system\/src\/.*\.tsx?(?:\?.*)?$/;

const stylexPlugin = stylex.vite();
const transform = stylexPlugin.transform;

if (typeof transform !== "function") {
  throw new TypeError("Expected the StyleX Vite plugin to expose a transform hook");
}

stylexPlugin.transform = {
  filter: {
    id: {
      include: [stylexSourceId],
    },
  },
  handler: transform,
};

export default defineConfig({
  resolve: {
    conditions: ["inspector-source", "module", "browser", "development|production"],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["@inspector/ds"],
  },
  plugins: [
    stylexPlugin,
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
    setupFiles: ["./src/test/setup.ts"],
  },
});
