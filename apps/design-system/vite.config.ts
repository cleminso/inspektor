import stylex from "@stylexjs/unplugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PORT = parseInt(process.env.PORT || "1356");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    stylex.vite({
      useCSSLayers: true,
    }),
    viteReact(),
  ],
  server: { port: PORT, host: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
});
