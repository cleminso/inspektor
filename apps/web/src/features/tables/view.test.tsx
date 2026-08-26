import { act, cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableExplorerScreen } from '@tables/view'
import type { TableTabSearch } from '@tables/workspace/tabs'

const mocks = vi.hoisted(() => ({
  availableTables: { isSchemaReady: true, tables: ['accounts', 'profiles'] },
  currentTableName: 'accounts' as string | null,
  routeSearch: {} as { empty?: string; view?: string },
  tableListPaneProps: null as null | {
    onPinTables: (tableNames: readonly string[]) => void
    tableSearchByName: ReadonlyMap<string, TableTabSearch>
  },
  tableTabsViewProps: null as null | {
    connectionEntryPending: boolean
    tableName: string | null
    view?: 'data' | 'schema'
  },
}))
const loadPinnedTableNames = vi.hoisted(() => vi.fn(() => new Set<string>()))
const savePinnedTableNames = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mocks.routeSearch,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentTableName: mocks.currentTableName,
  }),
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => mocks.availableTables,
}))

vi.mock('@tables/tableList/pane', () => ({
  TableListPane: (props: {
    onPinTables: (tableNames: readonly string[]) => void
    tableSearchByName: ReadonlyMap<string, TableTabSearch>
  }) => {
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
  loadPinnedTableNames,
  savePinnedTableNames,
  updatePinnedTableNames: (_current: ReadonlySet<string>, tableNames: readonly string[]) =>
    new Set(tableNames),
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({
    openBaseTabs: vi.fn(),
    persistTable: vi.fn(),
    scope: 'workspace-scope',
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
  TableTabsView: (props: {
    connectionEntryPending: boolean
    tableName: string | null
    view?: 'data' | 'schema'
  }) => {
    mocks.tableTabsViewProps = props
    return null
  },
}))

afterEach(cleanup)

beforeEach(() => {
  mocks.availableTables = { isSchemaReady: true, tables: ['accounts', 'profiles'] }
  mocks.currentTableName = 'accounts'
  mocks.routeSearch = {}
  mocks.tableListPaneProps = null
  mocks.tableTabsViewProps = null
  loadPinnedTableNames.mockClear()
  savePinnedTableNames.mockClear()
})

describe('TableExplorerScreen', () => {
  it('uses the tab workspace scope for pinned tables', () => {
    render(<TableExplorerScreen />)

    expect(loadPinnedTableNames).toHaveBeenCalledWith('workspace-scope')
    act(() => mocks.tableListPaneProps?.onPinTables(['accounts']))
    expect(savePinnedTableNames).toHaveBeenCalledWith('workspace-scope', expect.any(Set))
  })

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

  it('keeps connection entry pending until schema loading and initial table selection finish', () => {
    mocks.availableTables = { isSchemaReady: false, tables: [] }
    mocks.currentTableName = null
    const { rerender } = render(<TableExplorerScreen />)

    expect(mocks.tableTabsViewProps?.connectionEntryPending).toBe(true)

    mocks.availableTables = { isSchemaReady: true, tables: ['accounts'] }
    rerender(<TableExplorerScreen />)
    expect(mocks.tableTabsViewProps?.connectionEntryPending).toBe(true)

    mocks.currentTableName = 'accounts'
    rerender(<TableExplorerScreen />)
    expect(mocks.tableTabsViewProps?.connectionEntryPending).toBe(false)
  })

  it('keeps an explicit new view available after schema loading', () => {
    mocks.availableTables = { isSchemaReady: true, tables: ['accounts'] }
    mocks.currentTableName = null
    mocks.routeSearch = { empty: 'true' }

    render(<TableExplorerScreen />)

    expect(mocks.tableTabsViewProps?.connectionEntryPending).toBe(false)
  })
})
