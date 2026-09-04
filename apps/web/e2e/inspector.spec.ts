import { expect, test, type Locator, type Page } from '@playwright/test'
import { createJazzContext } from 'jazz-tools/backend'

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
  await connectToFixture(page)

  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
  await page.reload()

  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Switch connection' })).toContainText(
    connection.name,
  )
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
  const submit = page.getByRole('button', { name: 'Add connection' })
  await submit.click()

  const error = page.getByRole('status').filter({ hasText: 'No stored schemas found' })
  await expect(error).toContainText('This app has no published schema.')
  await expect(page).toHaveURL(/\/conn\/new/)
  await expect(submit).toBeEnabled()

  await submit.click()
  await expect(page.getByRole('list', { name: 'Tables' })).toBeVisible()
})

test('prefills connection fields from the URL fragment', async ({ page }) => {
  const fragment = new URLSearchParams({
    name: 'Fragment app',
    serverUrl: 'https://example.com',
    appId: 'fragment-app',
    adminSecret: 'fragment-secret',
    env: 'dev',
    branch: 'main',
  })

  await page.goto(`/conn/new#${fragment}`)

  await expect(page.getByRole('textbox', { name: 'Connection name' })).toHaveValue('Fragment app')
  await expect(page.getByRole('textbox', { name: 'Server URL' })).toHaveValue('https://example.com')
  await expect(page.getByRole('textbox', { name: 'App ID' })).toHaveValue('fragment-app')
  await expect(page.getByLabel('Admin secret')).toHaveValue('fragment-secret')
  await expect(page.getByRole('textbox', { name: 'Env' })).toHaveValue('dev')
  await expect(page.getByRole('textbox', { name: 'Branch' })).toHaveValue('main')
  expect(new URL(page.url()).searchParams.has('adminSecret')).toBe(false)
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
  await page.getByRole('menuitem', { name: 'Sort Ascending' }).click()

  const table = page.getByRole('table', { name: 'columnTypeShowcase rows' })
  await expect(table.getByRole('row')).toContainText([
    'Optional values null',
    'Optional values populated',
  ])

  await page.getByRole('button', { name: 'Filter table' }).click()
  await page.getByRole('option', { name: 'label Text', exact: true }).click()
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

test('keeps nullable Enum selection and NULL intent in one field control', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'columnTypeShowcase')

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
  await page.getByRole('option', { name: 'timestampValue Timestamp', exact: true }).click()
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

test('highlights rows and cells changed through an external live client', async ({ page }) => {
  await connectToFixture(page)
  await openTable(page, 'publicEditableRecords')
  const context = createJazzContext({
    app,
    permissions,
    appId: connection.appId,
    backendSecret: connection.backendSecret,
    driver: { type: 'memory' },
    env: 'dev',
    serverUrl: connection.serverUrl,
    userBranch: 'main',
  })
  const db = context.asBackend()
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
      await context.shutdown()
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
})

test('moves a single checked row with the row pane navigation', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Add connection' }).click()
  await expect(page).toHaveURL(/\/conn\/[^/]+\/tables(?:\/[^/?]+)?/)
}

async function fillConnectionForm(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Connection name' }).fill(connection.name)
  await page.getByRole('textbox', { name: 'Server URL' }).fill(connection.serverUrl)
  await page.getByRole('textbox', { name: 'App ID' }).fill(connection.appId)
  await page.getByRole('textbox', { name: 'Admin secret' }).fill(connection.adminSecret)
  await page.getByRole('textbox', { name: 'Env' }).fill(connection.env)
  await page.getByRole('textbox', { name: 'Branch' }).fill('main')
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
