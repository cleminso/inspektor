import { defineConfig, type Options } from "tsup";

export const options: Options = {
  entry: {
    index: "./src/index.ts",
    "tokens/tokens.stylex": "./src/tokens/tokens.stylex.ts",
    "components/tooltip/tooltip": "./src/components/tooltip/tooltip.tsx",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: true,
  external: ["react", "react-dom"],
};

export default defineConfig(options);
