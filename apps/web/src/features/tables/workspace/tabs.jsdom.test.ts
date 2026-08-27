import { beforeEach, describe, expect, it } from 'vitest'

import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createRouteTableTabId,
  createTableTabRouteSearch,
  getFinalTableTabName,
  loadTableTabsState,
  openBaseTableTabs,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  reorderTableTabs,
  replaceNewViewTab,
  saveTableTabsState,
  selectInitialTableView,
  sanitizeTableTabsState,
  type TableDataTab,
  type TableTab,
} from '@tables/workspace/tabs'

describe('table tabs', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        get length() {
          return values.size
        },
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    })
  })

  it('derives active tab identity from the committed route', () => {
    expect(createRouteTableTabId('accounts', {})).toBe('table:accounts')
    expect(createRouteTableTabId('accounts', { view: 'schema' })).toBe('schema:accounts')
    expect(createRouteTableTabId(null, { empty: 'true' })).toBe(NEW_VIEW_TAB_ID)
    expect(createRouteTableTabId(null, {})).toBeNull()
  })

  it('keeps internal tab identity out of route search parameters', () => {
    expect(
      createTableTabRouteSearch({
        kind: 'table',
        id: 'view:accounts-filtered',
        tableName: 'accounts',
        search: { filters: 'active-filter', sort: 'createdAt', dir: 'desc' },
      }),
    ).toEqual({ filters: 'active-filter', sort: 'createdAt', dir: 'desc' })
    expect(createTableTabRouteSearch({ kind: 'newView', id: NEW_VIEW_TAB_ID })).toEqual({
      empty: 'true',
    })
  })

  it('selects the most recent available table view for connection entry', () => {
    const recentViews: TableDataTab[] = [
      { kind: 'table', id: 'table:removed', tableName: 'removed', search: {} },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: { filters: 'active', page: 2 },
      },
      { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
    ]

    expect(selectInitialTableView(recentViews, ['accounts', 'profiles'])).toEqual(recentViews[1])
    expect(selectInitialTableView(recentViews, ['sessions'])).toEqual({
      kind: 'table',
      id: 'table:sessions',
      tableName: 'sessions',
      search: {},
    })
    expect(selectInitialTableView(recentViews, [])).toBeNull()
  })

  it('opens missing base tabs without duplicating existing tabs', () => {
    const existingTab: TableTab = {
      kind: 'table',
      id: 'table:accounts',
      tableName: 'accounts',
      search: { sort: 'name' },
    }

    expect(openBaseTableTabs([existingTab], ['accounts', 'sessions', 'users'])).toEqual({
      activeTabId: 'table:users',
      tabs: [
        existingTab,
        { kind: 'table', id: 'table:sessions', tableName: 'sessions', search: {} },
        { kind: 'table', id: 'table:users', tableName: 'users', search: {} },
      ],
    })
  })

  it("keeps filtered route state on the table's single data tab", () => {
    const tabs: TableTab[] = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
    ]

    const result = reconcileTableTab({
      search: { filters: 'active-filter', sort: 'createdAt', dir: 'desc' },
      sourceTabId: 'table:accounts',
      tableName: 'accounts',
      tabs,
    })

    expect(result.destinationTabId).toBe('table:accounts')
    expect(result.tabs).toHaveLength(1)
    expect(result.tabs[0]?.kind === 'table' ? result.tabs[0].search : null).toEqual({
      filters: 'active-filter',
      sort: 'createdAt',
      dir: 'desc',
    })
  })

  it('stores pagination on the existing table view instead of creating another tab', () => {
    const baseTab: TableDataTab = {
      kind: 'table',
      id: 'table:accounts',
      tableName: 'accounts',
      search: {},
    }

    const result = reconcileTableTab({
      search: { page: 2, pageSize: 500 },
      sourceTabId: baseTab.id,
      tableName: 'accounts',
      tabs: [baseTab],
    })

    expect(result).toEqual({
      destinationTabId: 'table:accounts',
      tabs: [
        {
          ...baseTab,
          search: { page: 2, pageSize: 500 },
        },
      ],
    })
  })

  it('opens schema separately from an active filtered table tab', () => {
    const filteredTab: TableDataTab = {
      kind: 'table',
      id: 'table:accounts',
      tableName: 'accounts',
      search: { filters: 'active-filter', sort: 'createdAt', dir: 'desc' },
    }

    const result = reconcileTableTab({
      search: { filters: 'active-filter', sort: 'createdAt', dir: 'desc', view: 'schema' },
      sourceTabId: filteredTab.id,
      tableName: 'accounts',
      tabs: [filteredTab],
    })

    expect(result).toEqual({
      destinationTabId: 'schema:accounts',
      tabs: [
        filteredTab,
        {
          kind: 'table',
          id: 'schema:accounts',
          tableName: 'accounts',
          search: { view: 'schema' },
        },
      ],
    })
  })

  it('activates the existing canonical schema view', () => {
    const schemaTab: TableDataTab = {
      kind: 'table',
      id: 'schema:accounts',
      tableName: 'accounts',
      search: { view: 'schema' },
    }

    const result = reconcileTableTab({
      search: { filters: 'ignored-filter', sort: 'ignored-sort', view: 'schema' },
      sourceTabId: 'table:accounts',
      tableName: 'accounts',
      tabs: [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }, schemaTab],
    })

    expect(result.destinationTabId).toBe(schemaTab.id)
    expect(result.tabs).toHaveLength(2)
    expect(result.tabs[1]).toEqual(schemaTab)
  })

  it('replaces an active New view when opening a table beside existing tabs', () => {
    const newViewTab = { kind: 'newView', id: NEW_VIEW_TAB_ID } as const
    const existingTab = {
      kind: 'table' as const,
      id: 'table:users',
      tableName: 'users',
      search: {},
    }

    const result = reconcileTableTab({
      search: {},
      sourceTabId: NEW_VIEW_TAB_ID,
      tableName: 'accounts',
      tabs: [existingTab, newViewTab],
    })

    expect(result.tabs).toEqual([
      existingTab,
      { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
    ])
  })

  it('keeps New view when activating an existing table tab', () => {
    const newViewTab = { kind: 'newView', id: NEW_VIEW_TAB_ID } as const
    const existingTab = {
      kind: 'table' as const,
      id: 'table:accounts',
      tableName: 'accounts',
      search: {},
    }

    const result = reconcileTableTab({
      search: {},
      sourceTabId: NEW_VIEW_TAB_ID,
      tableName: 'accounts',
      tabs: [existingTab, newViewTab],
    })

    expect(result.tabs).toEqual([existingTab, newViewTab])
  })

  it('replaces the current replaceable data tab when another table opens', () => {
    const result = reconcileTableTab({
      replaceableTabId: 'table:accounts',
      search: {},
      sourceTabId: 'table:accounts',
      tableName: 'profiles',
      tabs: [
        { kind: 'table', id: 'table:users', tableName: 'users', search: {} },
        { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
      ],
    })

    expect(result).toEqual({
      destinationTabId: 'table:profiles',
      tabs: [
        { kind: 'table', id: 'table:users', tableName: 'users', search: {} },
        { kind: 'table', id: 'table:profiles', tableName: 'profiles', search: {} },
      ],
    })
  })

  it('replaces an active New view without removing another replaceable tab', () => {
    const replaceableTab: TableDataTab = {
      kind: 'table',
      id: 'table:accounts',
      tableName: 'accounts',
      search: {},
    }

    expect(
      reconcileTableTab({
        replaceableTabId: replaceableTab.id,
        search: {},
        sourceTabId: NEW_VIEW_TAB_ID,
        tableName: 'profiles',
        tabs: [replaceableTab, { kind: 'newView', id: NEW_VIEW_TAB_ID }],
      }),
    ).toEqual({
      destinationTabId: 'table:profiles',
      tabs: [
        replaceableTab,
        { kind: 'table', id: 'table:profiles', tableName: 'profiles', search: {} },
      ],
    })
  })

  it('activates an existing retained table without replacing the replaceable tab', () => {
    const tabs: TableTab[] = [
      { kind: 'table', id: 'table:users', tableName: 'users', search: {} },
      { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
    ]

    expect(
      reconcileTableTab({
        replaceableTabId: 'table:accounts',
        search: {},
        sourceTabId: 'table:accounts',
        tableName: 'users',
        tabs,
      }),
    ).toEqual({ destinationTabId: 'table:users', tabs })
  })

  it('selects the tab to the right when the active tab closes', () => {
    const tabs: TableTab[] = [
      { kind: 'table', id: 'one', tableName: 'accounts', search: {} },
      { kind: 'table', id: 'two', tableName: 'users', search: {} },
      { kind: 'table', id: 'three', tableName: 'sessions', search: {} },
    ]

    expect(closeTableTab(tabs, 'two')).toEqual({
      tabs: [tabs[0], tabs[2]],
      nextActiveTab: tabs[2],
    })
  })

  it('identifies only the final workspace tab representing a table', () => {
    const tabs: TableTab[] = [
      { kind: 'table', id: 'accounts-data', tableName: 'accounts', search: {} },
      {
        kind: 'table',
        id: 'accounts-schema',
        tableName: 'accounts',
        search: { view: 'schema' },
      },
      { kind: 'table', id: 'profiles-data', tableName: 'profiles', search: {} },
    ]

    expect(getFinalTableTabName(tabs, 'accounts-data')).toBeNull()
    expect(getFinalTableTabName(tabs, 'accounts-schema')).toBeNull()
    expect(getFinalTableTabName(tabs, 'profiles-data')).toBe('profiles')
  })

  it('reorders existing tabs from a complete id permutation', () => {
    const tabs: TableTab[] = [
      { kind: 'table', id: 'one', tableName: 'accounts', search: {} },
      { kind: 'table', id: 'two', tableName: 'users', search: {} },
      { kind: 'table', id: 'three', tableName: 'sessions', search: {} },
    ]

    expect(reorderTableTabs(tabs, ['three', 'one', 'two'])).toEqual([tabs[2], tabs[0], tabs[1]])
    expect(reorderTableTabs(tabs, ['three', 'one'])).toEqual(tabs)
  })

  it('replaces the final closed tab with the default new view', () => {
    expect(
      closeTableTab(
        [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }],
        'table:accounts',
      ),
    ).toEqual({
      tabs: [{ kind: 'newView', id: NEW_VIEW_TAB_ID }],
      nextActiveTab: { kind: 'newView', id: NEW_VIEW_TAB_ID },
    })
  })

  it('keeps one new-view placeholder tab', () => {
    const firstResult = openNewViewTab([])
    const secondResult = openNewViewTab(firstResult)

    expect(firstResult).toEqual([{ kind: 'newView', id: NEW_VIEW_TAB_ID }])
    expect(secondResult).toEqual(firstResult)
  })

  it('replaces a sole New view when base tabs open', () => {
    const newViewTab = { kind: 'newView', id: NEW_VIEW_TAB_ID } as const

    expect(openBaseTableTabs([newViewTab], ['accounts'])).toEqual({
      activeTabId: 'table:accounts',
      tabs: [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }],
    })
  })

  it('repairs persisted schema identities and removes unavailable tables', () => {
    const state = sanitizeTableTabsState(
      {
        tabs: [
          { kind: 'newView', id: NEW_VIEW_TAB_ID },
          {
            kind: 'table',
            id: 'view:legacy-schema',
            tableName: 'accounts',
            search: { filters: 'ignored', view: 'schema' },
          },
          {
            kind: 'table',
            id: 'schema:accounts-copy',
            tableName: 'accounts',
            search: { view: 'schema' },
          },
          {
            kind: 'table',
            id: 'view:malformed',
            tableName: 'view:malformed',
            search: { view: 'schema' },
          },
        ],
        recentViews: [],
      },
      ['accounts'],
    )

    expect(state.tabs).toEqual([
      { kind: 'newView', id: NEW_VIEW_TAB_ID },
      {
        kind: 'table',
        id: 'schema:accounts',
        tableName: 'accounts',
        search: { view: 'schema' },
      },
    ])
  })

  it('collapses persisted base and filtered data views into one table tab', () => {
    expect(
      sanitizeTableTabsState(
        {
          tabs: [
            { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
            {
              kind: 'table',
              id: 'view:accounts-filtered',
              tableName: 'accounts',
              search: { filters: 'active-filter' },
            },
          ],
          recentViews: [],
        },
        ['accounts'],
      ).tabs,
    ).toEqual([
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: { filters: 'active-filter' },
      },
    ])
  })

  it('preserves state identity when persisted tabs already match the available schema', () => {
    const state = {
      tabs: [
        { kind: 'newView' as const, id: NEW_VIEW_TAB_ID },
        {
          kind: 'table' as const,
          id: 'schema:accounts',
          tableName: 'accounts',
          search: { view: 'schema' },
        },
      ],
      recentViews: [
        {
          kind: 'table' as const,
          id: 'table:accounts',
          tableName: 'accounts',
          search: {},
        },
      ],
    }

    expect(sanitizeTableTabsState(state, ['accounts'])).toBe(state)
  })

  it('replaces the new-view placeholder with a selected table view', () => {
    const newViewTabs = openNewViewTab([])
    const selectedView = {
      kind: 'table' as const,
      id: 'table:accounts',
      tableName: 'accounts',
      search: {},
    }

    expect(replaceNewViewTab(newViewTabs, selectedView)).toEqual([selectedView])
  })

  it('keeps one current recent data view per table', () => {
    const views: TableDataTab[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'table' as const,
      id: `view:${index}`,
      tableName: 'accounts',
      search: { filters: `filter-${index}` },
    }))
    const recentViews = views.reduce(
      (currentViews, view) => recordRecentTableView(currentViews, view),
      [] as TableDataTab[],
    )

    expect(recentViews).toEqual([
      {
        ...views[5],
        id: 'table:accounts',
      },
    ])
  })

  it('persists one versioned record per workspace scope', () => {
    const state = {
      tabs: [{ kind: 'table' as const, id: 'table:accounts', tableName: 'accounts', search: {} }],
      recentViews: [],
    }

    saveTableTabsState('inspector', state)

    expect(loadTableTabsState('inspector')).toEqual(state)
    expect(window.localStorage.getItem('inspektor-tabs')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('inspektor-tabs:inspector') ?? 'null')).toEqual({
      version: 1,
      ...state,
    })
  })

  it('isolates tabs and recent views by workspace scope', () => {
    const accounts = {
      tabs: [{ kind: 'table' as const, id: 'table:accounts', tableName: 'accounts', search: {} }],
      recentViews: [],
    }
    const users = {
      tabs: [{ kind: 'table' as const, id: 'table:users', tableName: 'users', search: {} }],
      recentViews: [
        { kind: 'table' as const, id: 'table:profiles', tableName: 'profiles', search: {} },
      ],
    }

    saveTableTabsState('connection:main:schema-a', accounts)
    saveTableTabsState('connection:branch:schema-b', users)

    expect(loadTableTabsState('connection:main:schema-a')).toEqual(accounts)
    expect(loadTableTabsState('connection:branch:schema-b')).toEqual(users)
  })

  it('discards unsupported workspace tab versions', () => {
    window.localStorage.setItem(
      'inspektor-tabs:inspector',
      JSON.stringify({
        version: 2,
        tabs: [{ id: 'table:accounts', tableName: 'accounts', search: {} }],
        recentViews: [],
      }),
    )

    expect(loadTableTabsState('inspector')).toEqual({
      tabs: [{ kind: 'newView', id: NEW_VIEW_TAB_ID }],
      recentViews: [],
    })
  })

  it('canonicalizes untrusted stored tab search', () => {
    window.localStorage.setItem(
      'inspektor-tabs:inspector',
      JSON.stringify({
        version: 1,
        tabs: [
          {
            id: 'table:accounts',
            kind: 'table',
            tableName: 'accounts',
            search: {
              custom: 'drop',
              dir: 'sideways',
              filters: '{invalid',
              page: -1,
              pageSize: 250,
              view: 'unknown',
            },
          },
        ],
        recentViews: [],
      }),
    )

    expect(loadTableTabsState('inspector').tabs).toEqual([
      { id: 'table:accounts', kind: 'table', tableName: 'accounts', search: {} },
    ])
  })

  it('keeps in-memory tabs usable when storage persistence fails', () => {
    Object.defineProperty(window.localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })

    expect(() =>
      saveTableTabsState('inspector', {
        tabs: [{ kind: 'newView', id: NEW_VIEW_TAB_ID }],
        recentViews: [],
      }),
    ).not.toThrow()
  })
})
