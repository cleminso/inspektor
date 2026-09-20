import stylex from '@stylexjs/unplugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [stylex.vite()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'src/**/*.node.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          exclude: ['src/**/*.node.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})
