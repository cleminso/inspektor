import { expect, test } from '@playwright/test'

test.describe('theme bootstrap', () => {
  const cases = [
    {
      storedTheme: 'dark',
      systemTheme: 'light',
      expectedTheme: 'dark',
      background: 'rgb(10, 10, 10)',
    },
    {
      storedTheme: 'light',
      systemTheme: 'dark',
      expectedTheme: 'light',
      background: 'rgb(250, 250, 250)',
    },
  ] as const

  for (const { storedTheme, systemTheme, expectedTheme, background } of cases) {
    test(`paints the saved ${storedTheme} theme before the application loads`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: systemTheme })
      await page.addInitScript((theme) => {
        window.localStorage.setItem('theme', theme)
      }, storedTheme)
      await page.route('**/*', async (route) => {
        if (
          route.request().resourceType() === 'script' &&
          new URL(route.request().url()).pathname.endsWith('/theme-bootstrap.js') === false
        ) {
          await route.abort()
          return
        }
        await route.continue()
      })

      await page.goto('/conn/', { waitUntil: 'domcontentloaded' })

      await expect(page.locator('html')).toHaveClass(expectedTheme)
      await expect
        .poll(() =>
          page.locator('html').evaluate((element) => ({
            background: getComputedStyle(element).backgroundColor,
            colorScheme: getComputedStyle(element).colorScheme,
          })),
        )
        .toEqual({ background, colorScheme: expectedTheme })
    })
  }
})
