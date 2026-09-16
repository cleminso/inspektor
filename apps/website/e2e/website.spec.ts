import { expect, test } from '@playwright/test'

const viewports = [
  { width: 360, height: 800 },
  { width: 1440, height: 900 },
]

test('renders the website without viewport overflow', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect(page.getByRole('img', { name: 'Inspektor' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'inspektor studio' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'inspect your Jazz application data' }),
    ).toBeVisible()
    await expect(page.getByText(/Inspektor connects to your sync server/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open Inspektor' })).toHaveCount(0)

    const viewportSize = await page.evaluate(() => ({
      height: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }))

    expect(viewportSize.scrollHeight).toBe(viewportSize.height)
    expect(viewportSize.scrollWidth).toBe(viewportSize.width)
  }
})

test('renders without console errors in dark mode', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  expect(pageErrors).toEqual([])
})
