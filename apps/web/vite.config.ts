import tailwindcss from "@tailwindcss/vite";
import stylex from "@stylexjs/unplugin";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Explicitly use PORT from portless
const PORT = parseInt(process.env.PORT || "5173");

export default defineConfig(({ mode }) => ({
  resolve: {
    // Workspace apps consume the public DS API from source so Vite and StyleX can transform it.
    conditions: ["inspector-source", "module", "browser", "development|production"],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // DS is linked workspace source, not an opaque third-party dependency to prebundle.
    exclude: ["@inspector/ds"],
  },
  plugins: [
    mode === "test" ? null : devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    stylex.vite(),
    viteReact(),
    tailwindcss(),
  ],
  server: { port: PORT, host: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**"],
    setupFiles: ["./src/__test__/setup.ts"],
  },
}));
