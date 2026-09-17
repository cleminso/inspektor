import stylex from '@stylexjs/unplugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const port = Number.parseInt(process.env.PORT ?? '1357', 10)
const designSystemSourceId = /\/packages\/design-system\/src\/.*\.[cm]?[jt]sx?(?:\?.*)?$/

const createStylexPlugin = () => {
  const plugin = stylex.vite({ importSources: ['@stylexjs/stylex'] })
  const transform = plugin.transform

  if (typeof transform !== 'function') {
    throw new TypeError('Expected the StyleX Vite plugin to expose a transform hook')
  }

  plugin.transform = {
    filter: { id: { include: [designSystemSourceId] } },
    handler: transform,
  }

  return plugin
}

export default defineConfig(({ mode }) => ({
  resolve: {
    conditions: ['inspektor-source', 'module', 'browser', 'development|production'],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ['@inspektor/ds'],
  },
  plugins: [
    mode === 'test'
      ? null
      : tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
    createStylexPlugin(),
    viteReact(),
  ],
  server: { port, host: true, strictPort: true },
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
}))
