import { expect, test, type Locator, type Page } from '@playwright/test'
import { createJazzSession } from 'jazz-tools/backend'

import permissions from '../../inspektor-test/permissions.js'
import { app } from '../../inspektor-test/schema.js'
import { seedInspectorTest } from '../../inspektor-test/seedInspectorTest.js'

interface FixtureConnection {
  name: string
  serverUrl: string
  appId: string
  adminSecret: string
  backendSecret: string
  env: string
}

let browserErrors: string[] = []
let connection: FixtureConnection

async function locatorsOverlap(first: Locator, second: Locator): Promise<boolean> {
  const [firstBounds, secondBounds] = await Promise.all([first.boundingBox(), second.boundingBox()])
  return (
    firstBounds !== null &&
    secondBounds !== null &&
    secondBounds.x < firstBounds.x + firstBounds.width &&
    secondBounds.x + secondBounds.width > firstBounds.x
  )
}

test.beforeEach(async ({ page }) => {
  connection = fixtureConnection()
  browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.stack ?? error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  await seedInspectorTest(connection)
})

test.afterEach(() => {
  expect(browserErrors, 'unexpected browser errors').toEqual([])
})

test('connects through the form and restores the connection after reload', async ({ page }) => {
  const runtimeMetadataRequests: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') return
    const pathname = new URL(request.url()).pathname
    if (
      /\/apps\/[^/]+\/schema\/[^/]+$/u.test(pathname) ||
      /\/apps\/[^/]+\/admin\/permissions$/u.test(pathname)
    ) {
      runtimeMetadataRequests.push(pathname)
    }
  })

  await connectToFixture(page)

  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
  expect(runtimeMetadataRequests).toHaveLength(2)
  await page.reload()

  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Switch connection' })).toContainText(
    connection.name,
  )
})

test('separates table selection controls from current-table treatment', async ({ page }) => {
  await connectToFixture(page)

  await page
    .getByRole('list', { name: 'Tables' })
    .locator('[data-table-name="publicReadOnlyRecords"]')
    .hover()
  const publicReadOnlyRecordsAction = page.getByRole('button', {
    name: 'Open publicReadOnlyRecords actions',
  })
  await publicReadOnlyRecordsAction.click()
  await page.mouse.move(0, 0)
  await expect(publicReadOnlyRecordsAction).toHaveCSS('opacity', '1')
  await page.getByRole('menuitem', { name: 'Pin 1 table' }).click()

  const tableList = page.getByRole('list', { name: 'Tables' })
  const pinnedList = page.getByRole('list', { name: 'Pinned tables' })
  const currentTableItem = tableList.locator('[data-active]')
  const tableItem = tableList.locator('[data-table-name="columnTypeShowcase"]')
  const tableCheckbox = tableList.getByRole('checkbox', { name: 'Select columnTypeShowcase' })
  const additionalTableCheckbox = tableList.getByRole('checkbox', { name: 'Select projects' })
  const additionalTableAction = tableList.getByRole('button', {
    name: 'Open projects actions',
  })
  const pinnedCheckbox = pinnedList.getByRole('checkbox', {
    name: 'Select publicReadOnlyRecords',
  })
  const tableSelectionControls = tableList
    .getByRole('checkbox', { name: /^Select /u })
    .locator('..')
  const pinnedSelectionControls = pinnedList
    .getByRole('checkbox', { name: /^Select /u })
    .locator('..')
  const readControlOpacities = (controls: Locator) =>
    controls.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).opacity))
  const controlOpacities = async () => [
    ...(await readControlOpacities(pinnedSelectionControls)),
    ...(await readControlOpacities(tableSelectionControls)),
  ]

  await expect(pinnedList).toBeVisible()
  const selectionControlCount =
    (await pinnedSelectionControls.count()) + (await tableSelectionControls.count())
  await page.mouse.move(0, 0)
  await expect.poll(controlOpacities).toEqual(Array(selectionControlCount).fill('0'))

  await tableItem.hover()
  await expect(tableCheckbox.locator('..')).toHaveCSS('opacity', '1')
  await expect(pinnedCheckbox.locator('..')).toHaveCSS('opacity', '0')

  await tableCheckbox.click()
  await expect.poll(controlOpacities).toEqual(Array(selectionControlCount).fill('1'))

  await additionalTableCheckbox.click()
  await expect(additionalTableCheckbox).toBeChecked()
  await tableCheckbox.click()
  await additionalTableCheckbox.click()
  await page.mouse.move(0, 0)

  await expect.poll(controlOpacities).toEqual(Array(selectionControlCount).fill('0'))
  await expect(additionalTableAction).toHaveCSS('opacity', '0')
  await expect(currentTableItem).not.toHaveAttribute('data-checked', '')
  await expect(currentTableItem).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(currentTableItem).toHaveCSS('border-inline-start-width', '2px')

  await additionalTableCheckbox.press('Tab')
  await page.keyboard.press('Tab')
  await expect(additionalTableAction).toBeFocused()
  await expect(additionalTableAction).toHaveCSS('opacity', '1')
})

test('wraps header context only after its controls stop fitting', async ({ page }) => {
  await page.setViewportSize({ width: 636, height: 800 })
  await connectToFixture(page)

  const connectionTrigger = page.getByRole('combobox', { name: 'Switch connection' })
  const schemaTrigger = page.getByRole('combobox', { name: /^Switch schema/u })
  const themeSwitch = page.getByRole('button', { name: /^Switch to (dark|light) theme$/u })
  const header = page.getByRole('banner')
  const [wideConnectionBox, wideSchemaBox, wideThemeBox, headerBox] = await Promise.all([
    connectionTrigger.boundingBox(),
    schemaTrigger.boundingBox(),
    themeSwitch.boundingBox(),
    header.boundingBox(),
  ])

  expect(wideConnectionBox).not.toBeNull()
  expect(wideSchemaBox).not.toBeNull()
  expect(wideThemeBox).not.toBeNull()
  expect(headerBox).not.toBeNull()
  expect(wideSchemaBox!.y).toBeCloseTo(wideConnectionBox!.y, 0)
  expect(
    headerBox!.x + headerBox!.width - (wideThemeBox!.x + wideThemeBox!.width),
  ).toBeLessThanOrEqual(8)

  await page.setViewportSize({ width: 360, height: 800 })
  const [compactConnectionBox, compactSchemaBox, compactThemeBox, compactHeaderBox] =
    await Promise.all([
      connectionTrigger.boundingBox(),
      schemaTrigger.boundingBox(),
      themeSwitch.boundingBox(),
      header.boundingBox(),
    ])

  expect(compactConnectionBox).not.toBeNull()
  expect(compactSchemaBox).not.toBeNull()
  expect(compactThemeBox).not.toBeNull()
  expect(compactHeaderBox).not.toBeNull()
  expect(compactSchemaBox!.y).toBeGreaterThanOrEqual(
    compactConnectionBox!.y + compactConnectionBox!.height,
  )
  expect(
    compactHeaderBox!.x + compactHeaderBox!.width - (compactThemeBox!.x + compactThemeBox!.width),
  ).toBeLessThanOrEqual(8)
  await expect(page.getByText('/', { exact: true })).toBeHidden()
})

test('keeps one centered loading view until the first table rows settle', async ({ page }) => {
  let releaseWasm: () => void = () => undefined
  const wasmRelease = new Promise<void>((resolve) => {
    releaseWasm = resolve
  })
  let reportWasmRequested: () => void = () => undefined
  const wasmRequested = new Promise<void>((resolve) => {
    reportWasmRequested = resolve
  })
  await page.route(
    (url) => url.pathname.endsWith('.wasm'),
    async (route) => {
      reportWasmRequested()
      await wasmRelease
      await route.continue()
    },
  )

  await page.goto('/conn/new')
  await fillConnectionForm(page)
  await page.getByRole('button', { name: 'Save connection' }).click()
  await wasmRequested

  const loading = page.getByRole('status', { name: 'Loading' })
  await expect(loading).toBeVisible()
  await expect(page.getByText('Loading schema…', { exact: true })).toBeHidden()
  await expect(page.getByText('Loading rows', { exact: true })).toBeHidden()
  const wordmark = loading.locator('img')
  await expect(wordmark).toHaveAttribute('src', '/conn/brand/inspektorWordmarkOnLight.png')
  const [loadingBox, wordmarkBox, viewport] = await Promise.all([
    loading.boundingBox(),
    wordmark.boundingBox(),
    page.viewportSize(),
  ])
  expect(loadingBox).not.toBeNull()
  expect(wordmarkBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(loadingBox!.width).toBeCloseTo(viewport!.width, 0)
  expect(loadingBox!.height).toBeCloseTo(viewport!.height, 0)
  expect(loadingBox!.x + loadingBox!.width / 2).toBeCloseTo(viewport!.width / 2, 0)
  expect(loadingBox!.y + loadingBox!.height / 2).toBeCloseTo(viewport!.height / 2, 0)
  expect(wordmarkBox!.width).toBeCloseTo(160, 0)
  expect(wordmarkBox!.height).toBeCloseTo(23, 0)
  expect(wordmarkBox!.x + wordmarkBox!.width / 2).toBeCloseTo(viewport!.width / 2, 0)
  expect(wordmarkBox!.y + wordmarkBox!.height / 2).toBeCloseTo(viewport!.height / 2, 0)

  releaseWasm()
  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
  await expect(loading).toBeHidden()
  await expect(page.getByText('Loading rows', { exact: true })).toBeHidden()
})

test('presents saved connections without remembered workspace context', async ({ page }) => {
  await connectToFixture(page)
  await page.goto('/conn')

  await expect(page.getByRole('heading', { name: 'SAVED CONNECTIONS' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Switch connection' }).press('ArrowDown')

  await expect(
    page.getByRole('option', { name: new RegExp(connection.name, 'u') }),
  ).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('link', { name: 'Edit connection' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remove connection' })).toHaveCount(0)
})

test('opens, closes, and switches the left dock', async ({ page }) => {
  await connectToFixture(page)
  const resizeHandle = page.locator('[data-slot="resizable-handle"]')

  await expect(resizeHandle).toBeVisible()
  await expect(page).toHaveURL(/\/tables\/[^/]+$/u)
  const tablesUrl = page.url()
  await page.getByRole('link', { name: 'Close tables' }).click()
  await expect(page).toHaveURL(tablesUrl)
  await expect(resizeHandle).toBeHidden()

  await page.getByRole('link', { name: 'Open live queries' }).click()
  await expect(page).toHaveURL(/\/live-queries$/u)
  await expect(resizeHandle).toBeVisible()
  await resizeHandle.hover()
  await expect
    .poll(() => resizeHandle.evaluate((element) => getComputedStyle(element).cursor))
    .not.toBe('auto')
  await page.getByRole('link', { name: 'Close live queries' }).click()
  await expect(resizeHandle).toBeHidden()

  await page.getByRole('link', { name: 'Open tables' }).click()
  await expect(page).toHaveURL(/\/tables(?:\/[^/]+)?$/u)
  await expect(resizeHandle).toBeVisible()
})

test('shows one highlighted command after pointer and keyboard navigation', async ({ page }) => {
  await connectToFixture(page)
  await page.getByRole('button', { name: 'Open commands' }).click()

  const input = page.getByRole('combobox', { name: 'Search commands' })
  const options = page.getByRole('option')
  const hoveredOption = options.first()
  const keyboardOption = options.nth(1)
  await expect(page.getByText(/^(Actions|Tables)$/u)).toHaveText(['Actions', 'Tables'])
  await hoveredOption.hover()
  await input.press('ArrowDown')

  await expect(hoveredOption).not.toHaveAttribute('data-highlighted')
  await expect(keyboardOption).toHaveAttribute('data-highlighted')
  const [hoveredBackground, keyboardBackground] = await Promise.all([
    hoveredOption.evaluate((element) => getComputedStyle(element).backgroundColor),
    keyboardOption.evaluate((element) => getComputedStyle(element).backgroundColor),
  ])
  expect(hoveredBackground).not.toBe(keyboardBackground)
})

test('keeps query details scrolling inside the workspace query section', async ({ page }) => {
  const serverUrl = new URL(connection.serverUrl)
  const basePath = serverUrl.pathname.replace(/\/+$/, '')
  const subscriptionsPath = `${basePath}/apps/${encodeURIComponent(connection.appId)}/admin/introspection/subscriptions`
  let generatedAt = 1_000

  await page.route(
    (url) => url.origin === serverUrl.origin && url.pathname === subscriptionsPath,
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        body: JSON.stringify({
          appId: connection.appId,
          generatedAt,
          queries: [
            {
              branches: [
                `${connection.env}-7f43cb822ba5-main`,
                `${connection.env}-e7ebacf3577c-main`,
                `${connection.env}-d8881b20708b-main`,
                `${connection.env}-8b0b0be20153-main`,
                `${connection.env}-4444a49d011b-main`,
                `${connection.env}-69c962a1a907-main`,
              ],
              count: 2,
              groupKey: 'accounts-by-name',
              propagation: 'full',
              query: JSON.stringify({ table: 'accounts', where: { name: 'Ada' } }),
              table: 'accounts',
            },
          ],
        }),
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        status: 200,
      })
      generatedAt += 100
    },
  )
  await connectToFixture(page)
  await page.getByRole('link', { name: 'Open live queries' }).click()
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true })
  for (let capture = 0; capture < 8; capture += 1) {
    await refresh.click()
  }
  const snapshots = page.getByRole('button', { name: /Open accounts-by-name at/ })
  await expect(snapshots).toHaveCount(9)
  const selectedSnapshot = snapshots.last()
  await selectedSnapshot.click()

  const details = page.getByRole('complementary', { name: 'Query details' })
  const queryPanel = details.getByRole('region', { name: 'Query' })
  const toolbar = page.getByRole('toolbar', { name: 'Live queries controls' })

  await expect(page.locator('[data-slot="shell-layout-left-dock"]')).toBeVisible()
  await expect(details).toBeVisible()
  const detailsHandle = page.locator('[data-slot="resizable-handle"]').last()
  const detailsHandleBox = await detailsHandle.boundingBox()
  expect(detailsHandleBox).not.toBeNull()
  await page.mouse.move(
    detailsHandleBox!.x + detailsHandleBox!.width / 2,
    detailsHandleBox!.y + detailsHandleBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    detailsHandleBox!.x - 160,
    detailsHandleBox!.y + detailsHandleBox!.height / 2,
  )
  await page.mouse.up()
  await expect
    .poll(async () => (await detailsHandle.boundingBox())?.x ?? detailsHandleBox!.x)
    .toBeLessThan(detailsHandleBox!.x)
  await expect
    .poll(() =>
      selectedSnapshot.evaluate((element) => {
        const cell = element.closest('td')
        const viewport = element.closest('[data-slot="scroll-area-viewport"]')
        if (cell === null || viewport === null) return false
        const cellBox = cell.getBoundingClientRect()
        const viewportBox = viewport.getBoundingClientRect()
        return cellBox.left >= viewportBox.left - 1 && cellBox.right <= viewportBox.right + 1
      }),
    )
    .toBe(true)
  await expect
    .poll(() =>
      selectedSnapshot.evaluate((element) => getComputedStyle(element.closest('td')!).outlineStyle),
    )
    .toBe('solid')
  const selectedOutline = await selectedSnapshot.evaluate((element) => {
    const style = getComputedStyle(element.closest('td')!)
    return { color: style.outlineColor, width: style.outlineWidth }
  })
  expect(Number.parseFloat(selectedOutline.width)).toBeGreaterThan(0)
  expect(selectedOutline.color).not.toBe('rgba(0, 0, 0, 0)')
  await expect(details.getByText('accounts-by-…')).toBeVisible()
  await expect(details.getByRole('button', { name: '5 additional schema versions' })).toBeVisible()
  await expect(details.getByText(`${connection.env} / main`)).toBeVisible()
  await expect(details.locator('[data-slot="scroll-area"]')).toHaveCount(1)
  await expect(queryPanel.locator('[data-slot="scroll-area"]')).toHaveCount(1)
  const toolbarBox = await toolbar.boundingBox()
  const detailsHeaderBox = await details.getByText('accounts-by-…').locator('..').boundingBox()
  expect(toolbarBox).not.toBeNull()
  expect(detailsHeaderBox).not.toBeNull()
  expect(detailsHeaderBox!.height).toBeCloseTo(toolbarBox!.height, 1)
  await expect(details.getByRole('button', { name: 'Collapse all JSON' })).toBeVisible()
  const actionBox = await details.getByRole('button', { name: 'Collapse all JSON' }).boundingBox()
  const disclosureBox = await details.getByRole('button', { name: 'Collapse JSON' }).boundingBox()
  const copyBox = await details.getByRole('button', { name: 'Copy JSON' }).boundingBox()
  expect(actionBox).not.toBeNull()
  expect(disclosureBox).not.toBeNull()
  expect(copyBox).not.toBeNull()
  const disclosureCenter = disclosureBox!.y + disclosureBox!.height / 2
  expect(actionBox!.y + actionBox!.height / 2).toBeCloseTo(disclosureCenter, 1)
  expect(copyBox!.y + copyBox!.height / 2).toBeCloseTo(disclosureCenter, 1)
  const rootRow = details
    .getByRole('treeitem', { name: 'JSON object' })
    .locator(':scope > div')
    .first()
  const rootTrigger = rootRow.locator(':scope > span').first()
  const rootInteractiveContent = rootTrigger.locator(':scope > span').first()
  const punctuationBox = await rootInteractiveContent.locator(':scope > span').nth(1).boundingBox()
  const rootTriggerBox = await rootTrigger.boundingBox()
  expect(punctuationBox).not.toBeNull()
  expect(rootTriggerBox).not.toBeNull()
  expect(punctuationBox!.y + punctuationBox!.height / 2).toBeCloseTo(disclosureCenter, 1)
  expect(rootTriggerBox!.x + rootTriggerBox!.width).toBeCloseTo(actionBox!.x, 1)
  await rootInteractiveContent.hover()
  const [rowBackground, triggerBackground] = await Promise.all([
    rootRow.evaluate((element) => getComputedStyle(element).backgroundColor),
    rootInteractiveContent.evaluate((element) => getComputedStyle(element).backgroundColor),
  ])
  expect(triggerBackground).not.toBe(rowBackground)
  await details.getByRole('button', { name: 'Collapse all JSON' }).click()
  await expect(details.getByRole('button', { name: 'Expand all JSON' })).toBeVisible()
  await page.getByRole('button', { name: /^accounts\s*1$/ }).click()
  await details.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeFocused()
})

test('recovers when connection schema validation initially finds no schemas', async ({ page }) => {
  const serverUrl = new URL(connection.serverUrl)
  const basePath = serverUrl.pathname.replace(/\/+$/, '')
  const cataloguePath = `${basePath}/apps/${encodeURIComponent(connection.appId)}/schemas`
  let returnEmptyCatalogue = true

  await page.route(
    (url) => url.origin === serverUrl.origin && url.pathname === cataloguePath,
    async (route) => {
      if (route.request().method() !== 'GET' || returnEmptyCatalogue === false) {
        await route.continue()
        return
      }

      returnEmptyCatalogue = false
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ hashes: [], schemas: [] }),
      })
    },
  )

  await page.goto('/conn/new')
  await fillConnectionForm(page)
  const submit = page.getByRole('button', { name: 'Save connection' })
  await submit.click()

  const error = page.getByRole('status').filter({ hasText: 'No published schemas available' })
  await expect(error).toContainText('This app has no published schemas.')
  await expect(page).toHaveURL(/\/conn\/new/)
  await expect(submit).toBeEnabled()

  await submit.click()
  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
})

test('rejects invalid connection credentials and succeeds after correction', async ({ page }) => {
  const invalidAdminSecret = 'invalid-admin-secret'

  await page.goto('/conn/new')
  await fillConnectionForm(page)
  await page.getByRole('textbox', { name: 'Admin secret' }).fill(invalidAdminSecret)
  const submit = page.getByRole('button', { name: 'Save connection' })
  await submit.click()

  const error = page.getByRole('status').filter({
    hasText: 'The server rejected this connection',
  })
  await expect(error).toContainText('Check the app ID and admin secret.')
  await expect(error).not.toContainText(invalidAdminSecret)
  await expect(page).toHaveURL(/\/conn\/new/)
  await expect(page.getByRole('list', { name: 'Tables' })).toHaveCount(0)
  await expect(submit).toBeEnabled()
  expect(browserErrors.length, 'expected the rejected schema requests').toBeGreaterThan(0)
  expect(
    browserErrors.every(
      (message) =>
        message ===
        'Failed to load resource: the server responded with a status of 401 (Unauthorized)',
    ),
    'unexpected browser errors while rejecting the connection',
  ).toBe(true)
  browserErrors = []

  await page.getByRole('textbox', { name: 'Admin secret' }).fill(connection.adminSecret)
  await submit.click()
  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
})

test('does not read connection credentials from the URL', async ({ page }) => {
  const query = new URLSearchParams({
    name: 'Query app',
    serverUrl: 'https://query.example.com',
    appId: 'query-app',
    adminSecret: 'query-secret',
    env: 'production',
    branch: 'query-branch',
  })
  const fragment = new URLSearchParams({
    name: 'Fragment app',
    serverUrl: 'https://example.com',
    appId: 'fragment-app',
    adminSecret: 'fragment-secret',
    env: 'staging',
    branch: 'fragment-branch',
  })

  await page.goto(`/conn/new?${query}#${fragment}`)

  await expect(page.getByRole('textbox', { name: 'Connection name' })).toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Server URL' })).toHaveValue(
    'https://v2.sync.jazz.tools/',
  )
  await expect(page.getByRole('textbox', { name: 'App ID' })).toHaveValue('')
  await expect(page.getByLabel('Admin secret')).toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Env' })).toHaveValue('dev')
  await expect(page.getByRole('textbox', { name: 'Branch' })).toHaveValue('main')
})

test('renders fixture rows and public permission policy', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicReadOnlyRecords')

  await expect(page.getByRole('table', { name: 'publicReadOnlyRecords rows' })).toContainText(
    'Publicly readable',
  )
  await page.getByRole('button', { name: 'Open schema' }).click()

  const permissions = page.getByRole('region', { name: 'Permissions' })
  await expect(permissions).toContainText('publicReadOnlyRecords')
  await permissions.getByRole('button', { name: 'Expand', exact: true }).click()
  await expect(permissions.getByRole('treeitem', { name: 'type: False' }).first()).toBeVisible()
})

test('filters and sorts real fixture rows', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  await page.getByRole('button', { name: 'Open label column menu' }).click()
  await page.getByRole('menuitem', { name: 'Sort A to Z' }).click()

  const table = page.getByRole('table', { name: 'columnTypeShowcase rows' })
  await expect(table.getByRole('row')).toContainText([
    'Optional values null',
    'Optional values populated',
  ])

  await page.getByRole('button', { name: 'Filter table' }).click()
  await page.getByRole('option', { name: 'label', exact: true }).click()
  await page.getByRole('option', { name: 'Equals', exact: true }).click()
  const filterValue = page.getByRole('combobox', { name: 'Filter value' })
  await filterValue.fill('Optional values populated')
  await filterValue.press('Enter')
  await page.getByRole('combobox', { name: 'Filter columns' }).press('Enter')

  await expect(
    page.getByRole('group', { name: 'Filter label equals Optional values populated' }),
  ).toBeVisible()
  await expect(table).toContainText('Optional values populated')
  await expect(table).not.toContainText('Optional values null')
})

test('pins a column across horizontal scrolling and reloads', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  await page.getByRole('button', { name: 'Open label column menu' }).click()
  await page.getByRole('menuitem', { name: 'Pin column' }).click()

  const labelHeader = page.locator('[data-slot="data-grid-header-cell"][data-column-id="label"]')
  const labelCell = page.locator('[data-slot="data-grid-cell"][data-column-id="label"]').first()
  const textHeader = page.locator('[data-slot="data-grid-header-cell"][data-column-id="textValue"]')
  const textCell = page.locator('[data-slot="data-grid-cell"][data-column-id="textValue"]').first()
  const viewport = page.locator('[data-slot="data-grid-viewport"]')
  await expect(labelHeader).toHaveAttribute('data-pinned', 'start')
  const pinnedX = (await labelHeader.boundingBox())?.x
  expect(pinnedX).toBeDefined()

  const rowCheckboxes = page.locator(
    '[data-slot="data-grid-body"] [role="checkbox"][aria-label^="Select row"]',
  )
  await rowCheckboxes.nth(0).click()
  await rowCheckboxes.nth(1).click()
  await expect(page.locator('[data-slot="data-grid-row"][data-selected]')).toHaveCount(2)

  const cellOverlapScrollLeft =
    (await textCell.evaluate((element) => (element as HTMLElement).offsetLeft)) -
    (await labelCell.evaluate((element) => (element as HTMLElement).offsetLeft))
  const expectPinnedCellOnTop = async () => {
    await expect.poll(() => locatorsOverlap(labelCell, textCell)).toBe(true)
    await expect
      .poll(() =>
        labelCell.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return document
            .elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
            ?.closest('[data-slot="data-grid-cell"]')
            ?.getAttribute('data-column-id')
        }),
      )
      .toBe('label')
  }
  await viewport.evaluate((element, scrollLeft) => {
    element.scrollLeft = scrollLeft
  }, cellOverlapScrollLeft)
  await expectPinnedCellOnTop()

  await viewport.evaluate((element) => {
    element.scrollLeft = 0
  })
  await textCell.click()
  await expect(textCell).toHaveAttribute('data-active', '')
  await viewport.evaluate((element, scrollLeft) => {
    element.scrollLeft = scrollLeft
  }, cellOverlapScrollLeft)
  await expectPinnedCellOnTop()
  await expect
    .poll(() =>
      labelCell.evaluate((element) => {
        const backgroundColor = getComputedStyle(element).backgroundColor
        return backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)'
      }),
    )
    .toBe(true)
  await viewport.evaluate((element) => {
    element.scrollLeft = 0
  })
  await textHeader.click({ button: 'right' })
  const contextMenu = page.locator('[data-slot="context-menu-popup"]')
  await expect(contextMenu).toBeVisible()
  await expect
    .poll(() =>
      contextMenu.evaluate((element) => ({
        insideViewport:
          document.querySelector('[data-slot="data-grid-viewport"]')?.contains(element) === true,
        zIndex: getComputedStyle(element.parentElement ?? element).zIndex,
      })),
    )
    .toEqual({ insideViewport: false, zIndex: '100' })
  const headerOverlapScrollLeft =
    (await textHeader.evaluate((element) => (element as HTMLElement).offsetLeft)) -
    (await labelHeader.evaluate((element) => (element as HTMLElement).offsetLeft))
  await viewport.evaluate((element, scrollLeft) => {
    element.scrollLeft = scrollLeft
  }, headerOverlapScrollLeft)
  await expect.poll(() => locatorsOverlap(labelHeader, textHeader)).toBe(true)
  await expect
    .poll(() =>
      labelHeader.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return document
          .elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
          ?.closest('[data-slot="data-grid-header-cell"]')
          ?.getAttribute('data-column-id')
      }),
    )
    .toBe('label')

  await viewport.evaluate((element) => {
    element.scrollLeft = 500
  })
  await expect.poll(async () => (await labelHeader.boundingBox())?.x).toBeCloseTo(pinnedX ?? 0, 0)

  await viewport.evaluate((element) => {
    element.scrollLeft = 0
  })
  await page.getByRole('button', { name: 'Open textValue column menu' }).click()
  await page.getByRole('menuitem', { name: 'Pin column' }).click()
  await page.getByRole('button', { name: 'Open textValue column menu' }).click()
  await page.getByRole('menuitem', { name: 'Move' }).press('ArrowRight')
  await page.getByRole('menuitem', { name: /Move left/ }).click()
  const getPinnedDataColumnOrder = () =>
    page
      .locator('[data-slot="data-grid-header-cell"][data-pinned="start"]')
      .evaluateAll((headers) =>
        headers
          .map((header) => header.getAttribute('data-column-id'))
          .filter((columnId) => columnId === 'label' || columnId === 'textValue'),
      )
  await expect.poll(getPinnedDataColumnOrder).toEqual(['textValue', 'label'])

  await page.reload()
  await expect(labelHeader).toHaveAttribute('data-pinned', 'start')
  await expect.poll(getPinnedDataColumnOrder).toEqual(['textValue', 'label'])
})

test('wraps crowded table toolbar groups without overlap', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')
  await page.getByRole('button', { name: 'Insert row' }).click()
  await expect(page.getByRole('button', { name: 'Insert', exact: true })).toBeVisible()

  await expectFilterToolbarAboveControls(page)

  await page.getByRole('button', { name: 'Filter table' }).click()
  await page.getByRole('option', { name: 'label', exact: true }).click()
  await page.getByRole('option', { name: 'Equals', exact: true }).click()
  const filterValue = page.getByRole('combobox', { name: 'Filter value' })
  await filterValue.fill('Optional values populated')
  await filterValue.press('Enter')
  await page.getByRole('combobox', { name: 'Filter columns' }).press('Enter')

  await expectFilterToolbarAboveControls(page)
})

test('keeps nullable Enum selection and NULL intent in one field control', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  const populatedRow = page.getByRole('row', {
    name: /Select row 30000000-0000-4000-8000-000000000001/u,
  })
  const populatedCell = await getCellByColumn(page, populatedRow, 'optionalEnumValue')
  await populatedCell.dblclick()

  const populatedSelect = page.getByRole('combobox', { name: 'OptionalEnumValue' })
  await expect(populatedSelect).toContainText('draft')
  await expect
    .poll(() =>
      populatedSelect
        .locator(':scope > span')
        .first()
        .evaluate((element) => getComputedStyle(element).textAlign),
    )
    .toBe('start')
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  const row = page.getByRole('row', {
    name: /Select row 30000000-0000-4000-8000-000000000002/u,
  })
  const cell = await getCellByColumn(page, row, 'optionalEnumValue')
  await cell.dblclick()

  const select = page.getByRole('combobox', { name: 'OptionalEnumValue' })
  const nullControl = page.getByRole('checkbox', { name: 'Set OptionalEnumValue to NULL' })
  const inputGroup = select.locator('xpath=ancestor::*[@data-slot="input-group"]')

  await expect(inputGroup).toContainText('NULL')
  await expect(nullControl).toBeChecked()
  await expect(select).toBeDisabled()

  await nullControl.click()

  await expect(nullControl).not.toBeChecked()
  await expect(select).toBeEnabled()
  await expect(select).toContainText('Select value…')
  await expect
    .poll(() =>
      select
        .locator(':scope > span')
        .first()
        .evaluate((element) => getComputedStyle(element).textAlign),
    )
    .toBe('start')
  await expect(page.getByRole('listbox')).toBeVisible()
  await expect(page.getByText('Expected one of: active, archived, draft')).not.toBeVisible()

  await select.click()
  await expect(page.getByRole('listbox')).not.toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Choose a value or select NULL.')).toBeVisible()
})

test('stages a structured inline edit through the production editor', async ({ page }) => {
  let releaseCodeMirror!: () => void
  const codeMirrorBlocked = new Promise<void>((resolve) => {
    releaseCodeMirror = resolve
  })
  const codeMirrorAsset = /\/assets\/codeMirrorEditor-[^/]+\.js$/
  let codeMirrorRequested = false
  await page.route(codeMirrorAsset, async (route) => {
    codeMirrorRequested = true
    await codeMirrorBlocked
    await route.continue()
  })
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')
  expect(codeMirrorRequested).toBe(false)

  const row = page.getByRole('row', {
    name: /Select row 30000000-0000-4000-8000-000000000001/u,
  })
  const cell = await getCellByColumn(page, row, 'jsonValue')
  await cell.dblclick()

  const editor = page.getByRole('textbox', { name: 'JsonValue' })
  await expect.poll(() => editor.evaluate((element) => element.tagName)).toBe('TEXTAREA')
  await expect(editor).toBeFocused()
  const fallbackValue = await editor.inputValue()
  expect(fallbackValue).toContain('"nested"')
  await editor.fill(fallbackValue.replace('"nested"', '"review"'))
  const panel = page.locator('[data-slot="floating-panel"]').filter({ has: editor })
  const fallbackGeometry = await panel.boundingBox()
  if (fallbackGeometry === null) throw new Error('Missing Floating Panel')

  releaseCodeMirror()
  await expect.poll(() => editor.evaluate((element) => element.tagName)).not.toBe('TEXTAREA')
  await expect(editor).toBeFocused()
  await expect(editor).toContainText('"review"')
  const resolvedGeometry = await panel.boundingBox()
  if (resolvedGeometry === null) throw new Error('Missing Floating Panel')
  expect(
    Math.abs(resolvedGeometry.height - fallbackGeometry.height),
    JSON.stringify({ fallbackGeometry, resolvedGeometry }),
  ).toBeLessThanOrEqual(1)
  expect(Math.abs(resolvedGeometry.width - fallbackGeometry.width)).toBeLessThanOrEqual(1)

  await editor.fill('{"reviewed":true}')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(editor).not.toBeVisible()
  await cell.dblclick()
  await expect(page.getByRole('textbox', { name: 'JsonValue' })).toContainText('{"reviewed":true}')
})

test('loads the deferred calendar for a timestamp filter', async ({ page }) => {
  let releaseCalendar: () => void = () => undefined
  const calendarBlocked = new Promise<void>((resolve) => {
    releaseCalendar = resolve
  })
  const calendarAsset = /\/assets\/datePickerCalendar-[^/]+\.js$/
  const calendarRequest = page.waitForRequest(calendarAsset)
  let calendarRequested = false
  await page.route(calendarAsset, async (route) => {
    calendarRequested = true
    await calendarBlocked
    await route.continue()
  })
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  expect(calendarRequested).toBe(false)
  await page.getByRole('button', { name: 'Filter table' }).click()
  await page.getByRole('option', { name: 'timestampValue', exact: true }).click()
  await page.getByRole('option', { name: 'Is greater than', exact: true }).click()
  await page.getByRole('option', { name: 'Pick a date…', exact: true }).click()

  const loading = page.getByRole('status', { name: 'Loading date picker' })
  await expect(loading).toBeVisible()
  const picker = page.getByRole('group', { name: 'Choose date and time' })
  const fallbackHeight = await picker.evaluate((element) => element.getBoundingClientRect().height)
  await calendarRequest
  releaseCalendar()
  await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible()
  const loadedHeight = await picker.evaluate((element) => element.getBoundingClientRect().height)
  expect(fallbackHeight).toBeGreaterThanOrEqual(loadedHeight)
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(
    page.getByRole('button', { name: /Edit draft filter timestampValue is greater than/u }),
  ).toBeVisible()
})

test('persists a row edit across reload', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicEditableRecords')

  await page
    .getByRole('checkbox', { name: 'Select row 50000000-0000-4000-8000-000000000001' })
    .click()
  await page.getByRole('textbox', { name: 'label' }).fill('Edited through Playwright')
  await page.getByRole('button', { name: 'Apply changes' }).click()

  await expect(page.getByRole('table', { name: 'publicEditableRecords rows' })).toContainText(
    'Edited through Playwright',
  )
  await page.reload()
  await expect(page.getByRole('table', { name: 'publicEditableRecords rows' })).toContainText(
    'Edited through Playwright',
  )
})

test('persists an inserted project across reload', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'projects')
  const table = page.getByRole('table', { name: 'projects rows' })

  await page.getByRole('button', { name: 'Insert row' }).first().click()
  await page.getByRole('textbox', { name: 'name' }).fill('Inserted through Playwright')
  await page.getByRole('button', { name: 'Insert', exact: true }).click()

  await page.getByRole('button', { name: 'Filter table' }).click()
  await page.getByRole('option', { name: 'name', exact: true }).click()
  await page.getByRole('option', { name: 'Equals', exact: true }).click()
  const filterValue = page.getByRole('combobox', { name: 'Filter value' })
  await filterValue.fill('Inserted through Playwright')
  await filterValue.press('Enter')
  await page.getByRole('combobox', { name: 'Filter columns' }).press('Enter')

  await expect(table).toContainText('Inserted through Playwright')
  await page.reload()
  const reloadedRow = table.getByRole('row').filter({ hasText: 'Inserted through Playwright' })
  await expect(reloadedRow).toBeVisible()
  await expect(reloadedRow).not.toHaveAttribute('data-status', 'recentlyInserted')
})

test('highlights rows and cells changed through an external live client', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicEditableRecords')
  await page.getByRole('button', { name: 'Open label column menu' }).click()
  await page.getByRole('menuitem', { name: 'Pin column' }).click()
  const session = await createJazzSession({
    app,
    permissions,
    appId: connection.appId,
    driver: { type: 'memory' },
    env: 'dev',
    initial: { backendSecret: connection.backendSecret },
    serverUrl: connection.serverUrl,
  })
  const snapshot = session.getSnapshot()
  if (snapshot.status !== 'ready' || snapshot.client === undefined) {
    await session.close()
    throw new Error('External Jazz backend session is not ready.')
  }
  const db = snapshot.client.db
  let insertedRowId: string | undefined

  try {
    const insert = db.insert(app.publicEditableRecords, {
      enabled: true,
      label: 'Externally inserted row',
    })
    insertedRowId = insert.value.id
    await insert.wait({ tier: 'global' })

    const row = page.getByRole('row', { name: new RegExp(`Select row ${insertedRowId}`) })
    await expect(row).toContainText('Externally inserted row')
    await expect(row).toHaveAttribute('data-status', 'recentlyInserted')

    const insertedLabelCell = await getCellByColumn(page, row, 'label')
    const insertionAnimations = await row.evaluate((element) => {
      const pinnedCell = element.querySelector<HTMLElement>(
        '[data-slot="data-grid-cell"][data-pinned="start"][data-column-id="label"]',
      )
      const pinnedCellAnimation = pinnedCell?.getAnimations()[0]
      const rowEffect = element.getAnimations()[0]?.effect
      const pinnedCellEffect = pinnedCellAnimation?.effect
      const summarize = (effect: AnimationEffect | null | undefined) =>
        effect instanceof KeyframeEffect
          ? {
              duration: effect.getComputedTiming().duration,
              offsets: effect.getKeyframes().map((keyframe) => keyframe.offset),
            }
          : null
      if (pinnedCellAnimation !== undefined && pinnedCellEffect instanceof KeyframeEffect) {
        pinnedCellAnimation.pause()
        const duration = pinnedCellEffect.getComputedTiming().duration
        if (typeof duration === 'number') {
          pinnedCellAnimation.currentTime = duration
        }
      }

      return {
        pinnedCell: summarize(pinnedCellEffect),
        pinnedCellBackground:
          pinnedCell === null ? null : getComputedStyle(pinnedCell).backgroundColor,
        row: summarize(rowEffect),
      }
    })
    await expect(insertedLabelCell).toHaveAttribute('data-pinned', 'start')
    expect(insertionAnimations.row).toMatchObject({ duration: 1200 })
    expect(insertionAnimations.pinnedCell).toEqual(insertionAnimations.row)
    expect(insertionAnimations.pinnedCellBackground).not.toBe('rgba(0, 0, 0, 0)')

    await db
      .update(app.publicEditableRecords, insertedRowId, { label: 'Externally updated row' })
      .wait({ tier: 'global' })

    const updatedCell = await getCellByColumn(page, row, 'label')
    const unchangedCell = await getCellByColumn(page, row, 'enabled')
    await expect(updatedCell).toContainText('Externally updated row')
    await expect(updatedCell).toHaveAttribute('data-status', 'recentlyApplied')
    await expect(unchangedCell).toHaveAttribute('data-status', 'default')
  } finally {
    try {
      if (insertedRowId !== undefined) {
        await db.delete(app.publicEditableRecords, insertedRowId).wait({ tier: 'global' })
      }
    } finally {
      await session.close()
    }
  }
})

test('clears all checked rows when closing the row pane', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  const firstRow = page.getByRole('checkbox', {
    name: 'Select row 30000000-0000-4000-8000-000000000001',
  })
  const secondRow = page.getByRole('checkbox', {
    name: 'Select row 30000000-0000-4000-8000-000000000002',
  })
  await firstRow.click()
  await secondRow.click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await expect(firstRow).not.toBeChecked()
  await expect(secondRow).not.toBeChecked()
  await expect(secondRow).toBeFocused()
})

test('restores table focus after Escape dismisses pane and selection state', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

  const insertRow = page.getByRole('button', { name: 'Insert row' })
  await insertRow.click()
  await page.getByRole('button', { name: 'Open commands' }).click()
  await page.getByRole('option', { name: 'Insert row' }).click()
  await expect(page.locator('[data-slot="row-editor-body"]')).toHaveCount(0)
  await expect(insertRow).toBeFocused()

  await insertRow.click()
  await page.locator('[data-slot="row-editor-body"] input:not([disabled])').first().focus()
  await page.keyboard.press('Escape')

  await expect(page.locator('[data-slot="row-editor-body"]')).toHaveCount(0)
  await expect(insertRow).toBeFocused()

  const row = page.getByRole('row', {
    name: /Select row 30000000-0000-4000-8000-000000000001/u,
  })
  const rowCheckbox = row.getByRole('checkbox', {
    name: 'Select row 30000000-0000-4000-8000-000000000001',
  })
  await rowCheckbox.click()
  await page.locator('[data-slot="row-editor-body"] input:not([disabled])').first().focus()
  await page.keyboard.press('Escape')

  await expect(page.locator('[data-slot="row-editor-body"]')).toHaveCount(0)
  await expect(rowCheckbox).toBeFocused()

  const cell = await getCellByColumn(page, row, 'label')
  await cell.click()
  await expect(cell).toBeFocused()
  await page.keyboard.press('Escape')

  await expect(cell).toBeFocused()
  await expect(cell).not.toHaveAttribute('data-cell-selected')
})

test('moves a single checked row with the row pane navigation and keeps it visible', async ({
  page,
}) => {
  await connectToFixture(page)
  await openTable(page, 'paginationRecords')

  const firstRow = page.getByRole('checkbox', {
    name: 'Select row 90000000-0000-4000-8000-000000000001',
  })
  const secondRow = page.getByRole('checkbox', {
    name: 'Select row 90000000-0000-4000-8000-000000000002',
  })
  await firstRow.click()

  await expect(page.getByRole('heading', { name: /^Edit row/ })).toHaveCount(0)
  await expect(page.getByText('1 / 101+')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous row' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next row' }).focus()
  await page.keyboard.press('j')

  await expect(firstRow).not.toBeChecked()
  await expect(secondRow).toBeChecked()
  await expect(page.getByText('2 / 101+')).toBeVisible()

  for (let index = 0; index < 39; index += 1) {
    await page.keyboard.press('j')
  }

  const trackedRow = page.getByRole('checkbox', {
    name: 'Select row 90000000-0000-4000-8000-000000000041',
  })
  await expect(trackedRow).toBeChecked()
  const hasNavigationContext = await trackedRow.evaluate((element) => {
    const row = element.closest('tr')!
    const viewport = element.closest('[data-slot="data-grid-viewport"]')!
    return (
      row.getBoundingClientRect().top >=
        viewport.querySelector('thead')!.getBoundingClientRect().bottom - 1 &&
      row.nextElementSibling!.getBoundingClientRect().bottom <=
        viewport.getBoundingClientRect().bottom + 1
    )
  })
  expect(hasNavigationContext).toBe(true)
})

test('discards a row edit without persisting it', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicEditableRecords')

  const table = page.getByRole('table', { name: 'publicEditableRecords rows' })
  await page
    .getByRole('checkbox', { name: 'Select row 50000000-0000-4000-8000-000000000001' })
    .click()
  await page.getByRole('textbox', { name: 'label' }).fill('Discarded through Playwright')
  await expect(table).toContainText('Discarded through Playwright')
  await page.getByRole('button', { name: 'Discard' }).click()

  await expect(table).toContainText('Publicly editable')
  await expect(table).not.toContainText('Discarded through Playwright')
  await page.reload()
  await expect(table).toContainText('Publicly editable')
  await expect(table).not.toContainText('Discarded through Playwright')
})

test('persists a Boolean row edit across reload', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicEditableRecords')

  const rowSelection = page.getByRole('checkbox', {
    name: 'Select row 50000000-0000-4000-8000-000000000001',
  })
  await rowSelection.click()
  await expect(page.getByRole('button', { name: 'True' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'False' }).click()
  await page.getByRole('button', { name: 'Apply changes' }).click()

  await page.reload()
  await rowSelection.click()
  await expect(page.getByRole('button', { name: 'False' })).toHaveAttribute('aria-pressed', 'true')
})

test('navigates across a real Jazz query page boundary', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'paginationRecords')

  const table = page.getByRole('table', { name: 'paginationRecords rows' })
  const nextPage = page.getByRole('button', { name: 'Next page' })
  await expect(nextPage).toBeEnabled()
  await expect(page.getByText('1–100 of 101+')).toBeVisible()

  await nextPage.click()

  await expect(page).toHaveURL(/[?&]page=2(?:&|$)/)
  await expect(page.getByText('Page 2')).toBeVisible()
  await expect(page.getByText('101–101 of 101')).toBeVisible()
  await expect(table).toContainText('Pagination row 101')
  await expect(table).not.toContainText('Pagination row 001')
})

test('navigates from a relation cell to its target table', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'relationChildren')

  await page
    .getByRole('link', { name: '20000000-0000-4000-8000-000000000001', exact: true })
    .first()
    .click()

  await expect(page.getByRole('table', { name: 'relationParents rows' })).toContainText(
    'Primary parent',
  )
})

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]
  if (value === undefined) throw new Error(`Missing ${name}`)
  return value
}

async function expectFilterToolbarAboveControls(page: Page): Promise<void> {
  const filterToolbar = page.getByRole('toolbar', { name: 'Table filters' })
  const pageSize = page.getByRole('combobox', { name: 'Rows per page' })
  const insertRow = page.getByRole('button', { name: 'Insert row' })
  const [filterBox, pageSizeBox, insertRowBox] = await Promise.all([
    filterToolbar.boundingBox(),
    pageSize.boundingBox(),
    insertRow.boundingBox(),
  ])

  expect(filterBox).not.toBeNull()
  expect(pageSizeBox).not.toBeNull()
  expect(insertRowBox).not.toBeNull()
  expect(filterBox!.y + filterBox!.height).toBeLessThanOrEqual(
    Math.min(pageSizeBox!.y, insertRowBox!.y) + 1,
  )
  expect(
    pageSizeBox!.x < insertRowBox!.x + insertRowBox!.width &&
      pageSizeBox!.x + pageSizeBox!.width > insertRowBox!.x &&
      pageSizeBox!.y < insertRowBox!.y + insertRowBox!.height &&
      pageSizeBox!.y + pageSizeBox!.height > insertRowBox!.y,
  ).toBe(false)
}

function fixtureConnection(): FixtureConnection {
  return {
    name: 'Inspektor Test fixture',
    serverUrl: requiredEnvironmentValue('INSPEKTOR_E2E_SERVER_URL'),
    appId: requiredEnvironmentValue('INSPEKTOR_E2E_APP_ID'),
    adminSecret: requiredEnvironmentValue('INSPEKTOR_E2E_ADMIN_SECRET'),
    backendSecret: requiredEnvironmentValue('INSPEKTOR_E2E_BACKEND_SECRET'),
    env: 'dev',
  }
}

async function connectToFixture(page: Page): Promise<void> {
  await page.goto('/conn/new')
  await fillConnectionForm(page)
  await page.getByRole('button', { name: 'Save connection' }).click()
  await expect(page).toHaveURL(/\/conn\/[^/]+\/tables(?:\/[^/?]+)?/)
}

async function fillConnectionForm(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Connection name' }).fill(connection.name)
  await page.getByRole('textbox', { name: 'Server URL' }).fill(connection.serverUrl)
  await page.getByRole('textbox', { name: 'App ID' }).fill(connection.appId)
  await page.getByRole('textbox', { name: 'Admin secret' }).fill(connection.adminSecret)
  await page.getByRole('textbox', { name: 'Env' }).fill(connection.env)
}

async function openTable(page: Page, tableName: string): Promise<void> {
  await page.getByRole('button', { name: tableName, exact: true }).click()
  await expect(page.getByRole('table', { name: `${tableName} rows` })).toBeVisible()
}

async function getCellByColumn(page: Page, row: Locator, columnName: string): Promise<Locator> {
  const columnIndex = (await page.getByRole('columnheader').allTextContents()).findIndex((label) =>
    label.includes(columnName),
  )
  expect(columnIndex, `column ${columnName}`).toBeGreaterThanOrEqual(0)
  return row.getByRole('cell').nth(columnIndex)
}
