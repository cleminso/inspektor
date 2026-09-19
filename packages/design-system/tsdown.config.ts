import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'brand/index': './src/brand/index.ts',
    'tokens/tokens.stylex': './src/tokens/tokens.stylex.ts',
    'studio/tooltip/tooltip': './src/studio/tooltip/tooltip.tsx',
  },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  report: false,
  clean: true,
  checks: {
    moduleLevelDirective: false,
  },
  // Preserve the opt-in CSS export alongside the JavaScript package output.
  copy: [{ from: 'src/styles/baseline.css', to: 'dist' }],
  unbundle: true,
  outDir: 'dist',
  deps: {
    neverBundle: true,
  },
})
