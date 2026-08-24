import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableExplorerScreen } from '@tables/view'
import type { TableTabSearch } from '@tables/workspace/tabs'

const mocks = vi.hoisted(() => ({
  routeSearch: {} as { view?: string },
  tableListPaneProps: null as null | {
    tableSearchByName: ReadonlyMap<string, TableTabSearch>
  },
  tableTabsViewProps: null as null | {
    tableName: string | null
    view?: 'data' | 'schema'
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mocks.routeSearch,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection',
    currentSchemaHash: 'schema',
    currentTableName: 'accounts',
  }),
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => ({ isSchemaReady: true, tables: ['accounts', 'profiles'] }),
}))

vi.mock('@tables/tableList/pane', () => ({
  TableListPane: (props: { tableSearchByName: ReadonlyMap<string, TableTabSearch> }) => {
    mocks.tableListPaneProps = props
    return null
  },
}))

vi.mock('@tables/tableList/layout', () => {
  const LayoutPart = ({ children }: { children: ReactNode }) => <>{children}</>
  return {
    SidePanelLayout: Object.assign(LayoutPart, {
      Content: LayoutPart,
      Panel: LayoutPart,
    }),
  }
})

vi.mock('@tables/tableList/pins', () => ({
  loadPinnedTableNames: () => new Set<string>(),
  savePinnedTableNames: vi.fn(),
  updatePinnedTableNames: vi.fn(),
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({
    openBaseTabs: vi.fn(),
    persistTable: vi.fn(),
    tabs: [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: { filters: 'active-filter', page: 2, pageSize: 500, sort: 'createdAt' },
      },
      {
        kind: 'table',
        id: 'schema:profiles',
        tableName: 'profiles',
        search: { view: 'schema' },
      },
    ],
  }),
}))

vi.mock('@tables/workspace/tabsView', () => ({
  TableTabsView: (props: { tableName: string | null; view?: 'data' | 'schema' }) => {
    mocks.tableTabsViewProps = props
    return null
  },
}))

afterEach(cleanup)

beforeEach(() => {
  mocks.routeSearch = {}
  mocks.tableListPaneProps = null
  mocks.tableTabsViewProps = null
})

describe('TableExplorerScreen', () => {
  it('routes table-list links to each open data tab search state', () => {
    render(<TableExplorerScreen />)

    expect(mocks.tableListPaneProps?.tableSearchByName.get('accounts')).toEqual({
      filters: 'active-filter',
      page: 2,
      pageSize: 500,
      sort: 'createdAt',
    })
    expect(mocks.tableListPaneProps?.tableSearchByName.has('profiles')).toBe(false)
  })

  it('forwards schema route identity to the tabs view', () => {
    mocks.routeSearch = { view: 'schema' }

    render(<TableExplorerScreen />)

    expect(mocks.tableTabsViewProps).toMatchObject({ tableName: 'accounts', view: 'schema' })
  })
})
