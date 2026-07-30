import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/dev/jazzInspectorPlugin.ts", "./src/dev/jazzInspectorLink.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  bundle: true,
  clean: true,
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".mjs" : ".js",
  }),
});
