import stylex from '@stylexjs/unplugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Explicitly use PORT from portless
const PORT = parseInt(process.env.PORT || '5173')
const designSystemSourceId = /\/packages\/design-system\/src\/.*\.[cm]?[jt]sx?(?:\?.*)?$/
const createStylexPlugin = () => {
  const plugin = stylex.vite({
    importSources: ['@stylexjs/stylex'],
  })
  const transform = plugin.transform

  if (typeof transform !== 'function') {
    throw new TypeError('Expected the StyleX Vite plugin to expose a transform hook')
  }

  plugin.transform = {
    filter: {
      id: {
        include: [designSystemSourceId],
      },
    },
    handler: transform,
  }

  return plugin
}

const createFaviconMetadataPlugin = (mode: string) => ({
  name: 'inspektor-favicon-metadata',
  transformIndexHtml(html: string) {
    const faviconPrefix =
      mode === 'development' ? 'favicon-dev' : mode === 'preview' ? 'favicon-preview' : 'favicon'
    return html.replaceAll('%FAVICON_PREFIX%', faviconPrefix)
  },
})

export default defineConfig(({ mode }) => ({
  base: '/conn/',
  resolve: {
    // Workspace apps consume the public DS API from source so Vite and StyleX can transform it.
    conditions: ['inspektor-source', 'module', 'browser', 'development|production'],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // DS is linked workspace source, not an opaque third-party dependency to prebundle.
    exclude: ['@inspektor/ds'],
  },
  plugins: [
    mode === 'test' ? null : devtools(),
    mode === 'test'
      ? null
      : tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
    createStylexPlugin(),
    createFaviconMetadataPlugin(mode),
    viteReact(),
  ],
  server: {
    port: PORT,
    host: true,
  },
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    target: 'es2022',
    rolldownOptions: {
      checks: {
        // StyleX is intentionally the dominant transform after its hook is restricted to DS source.
        pluginTimings: false,
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'src/**/*.node.test.tsx', 'worker/**/*.test.ts'],
          exclude: ['src/**/*.jsdom.test.ts'],
          sequence: { groupOrder: 1 },
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'src/**/*.jsdom.test.ts'],
          maxWorkers: 4,
          sequence: { groupOrder: 2 },
          exclude: ['src/**/*.node.test.tsx'],
          setupFiles: ['./src/__test__/setup.ts'],
        },
      },
    ],
  },
}))
