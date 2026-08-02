import stylex from "@stylexjs/unplugin";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Explicitly use PORT from portless
const PORT = parseInt(process.env.PORT || "5173");
const designSystemSourceId = /\/packages\/design-system\/src\/.*\.[cm]?[jt]sx?(?:\?.*)?$/;

const createStylexPlugin = () => {
  const plugin = stylex.vite({
    importSources: ["@stylexjs/stylex"],
  });
  const transform = plugin.transform;

  if (typeof transform !== "function") {
    throw new TypeError("Expected the StyleX Vite plugin to expose a transform hook");
  }

  plugin.transform = {
    filter: {
      id: {
        include: [designSystemSourceId],
      },
    },
    handler: transform,
  };

  return plugin;
};

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
    createStylexPlugin(),
    viteReact(),
  ],
  server: { port: PORT, host: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
    rolldownOptions: {
      checks: {
        // StyleX is intentionally the dominant transform after its hook is restricted to DS source.
        pluginTimings: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**"],
    setupFiles: ["./src/__test__/setup.ts"],
  },
}));
