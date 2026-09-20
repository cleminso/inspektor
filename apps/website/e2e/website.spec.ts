import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const viewports = [
  {
    width: 360,
    height: 1034,
    centerWidth: 352,
    railWidth: 0,
    titleSize: '40px',
    titleLineHeight: '48px',
    continuationSize: '36px',
    continuationLineHeight: '40px',
  },
  {
    width: 620,
    height: 1034,
    centerWidth: 612,
    railWidth: 0,
    titleSize: '40px',
    titleLineHeight: '48px',
    continuationSize: '36px',
    continuationLineHeight: '40px',
  },
  {
    width: 1280,
    height: 1220,
    centerWidth: 1216,
    railWidth: 24,
    titleSize: '48px',
    titleLineHeight: '48px',
    continuationSize: '48px',
    continuationLineHeight: '48px',
  },
  {
    width: 1440,
    height: 1220,
    centerWidth: 1216,
    railWidth: 104,
    titleSize: '48px',
    titleLineHeight: '48px',
    continuationSize: '48px',
    continuationLineHeight: '48px',
  },
  {
    width: 1621,
    height: 1220,
    centerWidth: 1216,
    railWidth: 194.5,
    titleSize: '56px',
    titleLineHeight: '56px',
    continuationSize: '56px',
    continuationLineHeight: '56px',
  },
]

const readGeometry = async (page: Page) =>
  page.evaluate(() => {
    const getElement = (slot: string): HTMLElement => {
      const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
      if (element === null) throw new Error(`Missing ${slot}`)
      return element
    }

    const center = getElement('brand-site-frame-center')
    const startRail = getElement('brand-site-frame-start-rail')
    const endRail = getElement('brand-site-frame-end-rail')
    const header = getElement('brand-site-frame-header')
    const headerContent = getElement('brand-site-frame-header-content')
    const footerStrip = getElement('brand-site-frame-footer-strip')
    const heroContent = getElement('brand-hero-content')
    const description = getElement('brand-hero-description')
    const heroStyles = getComputedStyle(heroContent)
    const headerStyles = getComputedStyle(header)
    const headerContentStyles = getComputedStyle(headerContent)
    const title = getElement('brand-hero-title')
    const continuation = getElement('brand-hero-continuation')
    const titleStyles = getComputedStyle(title)
    const continuationStyles = getComputedStyle(continuation)

    return {
      centerWidth: center.getBoundingClientRect().width,
      continuationLineHeight: continuationStyles.lineHeight,
      continuationSize: continuationStyles.fontSize,
      descriptionMaxWidth: getComputedStyle(description).maxWidth,
      endRailWidth: endRail.getBoundingClientRect().width,
      footerHeight: footerStrip.getBoundingClientRect().height,
      headerHeight: header.getBoundingClientRect().height,
      headerPaddingInline: headerStyles.paddingInline,
      headerContentPaddingInline: headerContentStyles.paddingInline,
      heroPaddingInline: heroStyles.paddingInline,
      heroPaddingTop: heroStyles.paddingTop,
      startRailWidth: startRail.getBoundingClientRect().width,
      titleLineHeight: titleStyles.lineHeight,
      titleSize: titleStyles.fontSize,
    }
  })

test('renders the website without viewport overflow', async ({ page }) => {
  for (const viewport of viewports) {
    await test.step(`${viewport.width}px viewport`, async () => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      await page.locator('[data-slot="brand-site-frame-center"]').waitFor()

      const geometry = await readGeometry(page)

      expect(geometry).toEqual({
        centerWidth: viewport.centerWidth,
        continuationLineHeight: viewport.continuationLineHeight,
        continuationSize: viewport.continuationSize,
        descriptionMaxWidth: '710px',
        endRailWidth: viewport.railWidth,
        footerHeight: 46,
        headerHeight: 52,
        headerPaddingInline: '0px',
        headerContentPaddingInline: '16px',
        heroPaddingInline: '16px',
        heroPaddingTop: '42px',
        startRailWidth: viewport.railWidth,
        titleLineHeight: viewport.titleLineHeight,
        titleSize: viewport.titleSize,
      })

      const viewportSize = await page.evaluate(() => ({
        height: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        width: window.innerWidth,
      }))

      expect(viewportSize.scrollHeight).toBe(viewportSize.height)
      expect(viewportSize.scrollWidth).toBe(viewportSize.width)
    })
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
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await expect(page.getByRole('main')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
    .toBe('dark')
  expect(pageErrors).toEqual([])
})

test('preloads the hero font before rendering', async ({ page }) => {
  await page.goto('/')

  const preload = page.locator('link[rel="preload"][as="font"][href*="instrumentSansLatin"]')
  await expect(preload).toHaveCount(1)
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('450 56px "Instrument Sans Variable"')))
    .toBe(true)
})
