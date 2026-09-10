import stylex from '@stylexjs/unplugin'
import mdx from '@mdx-js/rollup'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vitest/config'

const PORT = Number.parseInt(process.env.PORT ?? '1356', 10)
// Avoid running the StyleX transform hook for every dependency module in the documentation build.
const stylexSourceId = /\/(?:apps|packages)\/design-system\/src\/.*\.tsx?(?:\?.*)?$/

const stylexPlugin = stylex.vite()
const mdxPlugin = {
  ...mdx({
    providerImportSource: '@mdx-js/react',
    remarkPlugins: [remarkGfm],
  }),
  enforce: 'pre' as const,
}
const transform = stylexPlugin.transform

if (typeof transform !== 'function') {
  throw new TypeError('Expected the StyleX Vite plugin to expose a transform hook')
}

stylexPlugin.transform = {
  filter: {
    id: {
      include: [stylexSourceId],
    },
  },
  handler: transform,
}

export default defineConfig({
  resolve: {
    conditions: ['inspektor-source', 'module', 'browser', 'development|production'],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ['@inspektor/ds'],
  },
  plugins: [
    stylexPlugin,
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    mdxPlugin,
    viteReact({ include: /\.(?:js|jsx|mdx|ts|tsx)$/ }),
  ],
  server: { port: PORT, host: true, strictPort: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    exclude: ['scripts/**', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
