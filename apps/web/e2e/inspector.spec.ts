import { expect, test, type Page } from '@playwright/test'

import { seedInspectorTest } from '../../inspector-test/seedInspectorTest.js'

interface FixtureConnection {
  name: string
  serverUrl: string
  appId: string
  adminSecret: string
  backendSecret: string
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
    name: 'Inspector Test fixture',
    serverUrl: requiredEnvironmentValue('INSPECTOR_E2E_SERVER_URL'),
    appId: requiredEnvironmentValue('INSPECTOR_E2E_APP_ID'),
    adminSecret: requiredEnvironmentValue('INSPECTOR_E2E_ADMIN_SECRET'),
    backendSecret: requiredEnvironmentValue('INSPECTOR_E2E_BACKEND_SECRET'),
  }
}

async function connectToFixture(page: Page): Promise<void> {
  await page.goto('/conn/new')
  await page.getByRole('textbox', { name: 'Connection name' }).fill(connection.name)
  await page.getByRole('textbox', { name: 'Server URL' }).fill(connection.serverUrl)
  await page.getByRole('textbox', { name: 'App ID' }).fill(connection.appId)
  await page.getByRole('textbox', { name: 'Admin secret' }).fill(connection.adminSecret)
  await page.getByRole('textbox', { name: 'Env' }).fill('dev')
  await page.getByRole('textbox', { name: 'Branch' }).fill('main')
  await page.getByRole('button', { name: 'Add connection' }).click()
  await expect(page).toHaveURL(/\/conn\/[^/]+\/tables(?:\/[^/?]+)?/)
}

async function openTable(page: Page, tableName: string): Promise<void> {
  await page.getByRole('button', { name: tableName, exact: true }).click()
  await expect(page.getByRole('table', { name: `${tableName} rows` })).toBeVisible()
}
