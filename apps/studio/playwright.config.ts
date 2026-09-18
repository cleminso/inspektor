import { defineConfig } from '@playwright/test'

const port = 41_737
const baseURL = `http://127.0.0.1:${port}`
const isCI = process.env.CI !== undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  globalSetup: './e2e/globalSetup.ts',
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `pnpm build && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
