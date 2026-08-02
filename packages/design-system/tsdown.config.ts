import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "tokens/tokens.stylex": "./src/tokens/tokens.stylex.ts",
    "components/tooltip/tooltip": "./src/components/tooltip/tooltip.tsx",
  },
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  dts: false,
  sourcemap: true,
  report: false,
  clean: true,
  // Preserve the opt-in CSS export alongside the JavaScript package output.
  copy: [{ from: "src/styles/baseline.css", to: "dist" }],
  unbundle: true,
  outDir: "dist",
  deps: {
    neverBundle: true,
  },
});
