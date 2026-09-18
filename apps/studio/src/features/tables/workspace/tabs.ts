/**
 * Ownership: the tabs provider owns open tabs and recent views; the route owns the active view.
 * Projections: pure transitions reconcile route identity, tab identity, and stored tab snapshots.
 * Persistence: versioned workspace-scoped tabs and recent views are stored in localStorage.
 * Reset boundary: workspace scope changes reload state; schema changes sanitize unavailable tables.
 */
import {
  getConnectionScopedStorageKey,
  getConnectionScopedStorageValue,
} from '@app/storage/connectionScopedStorage'
import { toTableTabSearch } from '@tables/routing/tableRowsSearch'
import type { TableTabSearch, TableTabsRouteSearch } from '@tables/tableTypes'

export type { TableTabSearch, TableTabsRouteSearch } from '@tables/tableTypes'

export interface TableDataTab {
  kind: 'table'
  id: string
  tableName: string
  search: TableTabSearch
}

interface NewViewTab {
  kind: 'newView'
  id: typeof NEW_VIEW_TAB_ID
}

export type TableTab = TableDataTab | NewViewTab

export interface TableTabsState {
  tabs: TableTab[]
  recentViews: TableDataTab[]
}

interface ReconcileTableTabInput {
  replaceableTabId?: string | null
  search: TableTabSearch
  sourceTabId: string | null
  tableName: string
  tabs: readonly TableTab[]
}

interface ReconcileTableTabResult {
  destinationTabId: string
  tabs: TableTab[]
}

interface CloseTableTabResult {
  tabs: TableTab[]
  nextActiveTab: TableTab | null
}

interface OpenBaseTableTabsResult {
  activeTabId: string | null
  tabs: TableTab[]
}

const MAX_RECENT_VIEWS = 5
export const NEW_VIEW_TAB_ID = 'new-view' as const

const createNewViewTab = (): NewViewTab => ({ kind: 'newView', id: NEW_VIEW_TAB_ID })

function removeSoleNewViewTab(tabs: readonly TableTab[]): TableTab[] {
  return tabs.length === 1 && tabs[0]?.kind === 'newView' ? [] : [...tabs]
}

const emptyTableTabsState = (): TableTabsState => ({
  tabs: [createNewViewTab()],
  recentViews: [],
})

export function createBaseTableTabId(tableName: string): string {
  return `table:${encodeURIComponent(tableName)}`
}

export function createSchemaTableTabId(tableName: string): string {
  return `schema:${encodeURIComponent(tableName)}`
}

export function createRouteTableTabId(
  tableName: string | null,
  search: TableTabsRouteSearch,
): string | null {
  if (tableName === null) {
    return search.empty === 'true' ? NEW_VIEW_TAB_ID : null
  }

  return search.view === 'schema'
    ? createSchemaTableTabId(tableName)
    : createBaseTableTabId(tableName)
}

export function createTableTabRouteSearch(tab: TableTab): TableTabsRouteSearch {
  return tab.kind === 'newView' ? { empty: 'true' } : { ...tab.search }
}

export function createTableSearchByName(
  tabs: readonly TableTab[],
): ReadonlyMap<string, TableTabSearch> {
  const searches = new Map<string, TableTabSearch>()
  for (const tab of tabs) {
    if (tab.kind === 'table' && tab.search.view !== 'schema') {
      searches.set(tab.tableName, tab.search)
    }
  }
  return searches
}

export function selectInitialTableView(
  recentViews: readonly TableDataTab[],
  availableTables: readonly string[],
): TableDataTab | null {
  const recentView = recentViews.find((view) => availableTables.includes(view.tableName))
  if (recentView !== undefined) {
    return recentView
  }

  const tableName = availableTables[0]
  return tableName === undefined
    ? null
    : { kind: 'table', id: createBaseTableTabId(tableName), tableName, search: {} }
}

export function openBaseTableTabs(
  tabs: readonly TableTab[],
  orderedTableNames: readonly string[],
): OpenBaseTableTabsResult {
  const nextTabs = removeSoleNewViewTab(tabs)
  const tabIds = new Set(nextTabs.map((tab) => tab.id))
  let activeTabId: string | null = null

  for (const tableName of orderedTableNames) {
    const tabId = createBaseTableTabId(tableName)
    activeTabId = tabId
    if (tabIds.has(tabId) === true) {
      continue
    }

    nextTabs.push({ kind: 'table', id: tabId, tableName, search: {} })
    tabIds.add(tabId)
  }

  return { activeTabId, tabs: nextTabs }
}

export function reorderTableTabs(
  tabs: readonly TableTab[],
  orderedTabIds: readonly string[],
): TableTab[] {
  if (orderedTabIds.length !== tabs.length || new Set(orderedTabIds).size !== tabs.length) {
    return [...tabs]
  }
  const tabsById = new Map(tabs.map((tab) => [tab.id, tab]))
  const reorderedTabs = orderedTabIds.flatMap((tabId) => {
    const tab = tabsById.get(tabId)
    return tab === undefined ? [] : [tab]
  })
  return reorderedTabs.length === tabs.length ? reorderedTabs : [...tabs]
}

function isSchemaSearch(search: TableTabSearch): boolean {
  return search.view === 'schema'
}

function canonicalizeSearch(search: TableTabSearch): TableTabSearch {
  return isSchemaSearch(search) === true ? { view: 'schema' } : search
}

function normalizeTableDataTab(tab: TableDataTab): TableDataTab {
  return {
    kind: 'table',
    id:
      isSchemaSearch(tab.search) === true
        ? createSchemaTableTabId(tab.tableName)
        : createBaseTableTabId(tab.tableName),
    tableName: tab.tableName,
    search: canonicalizeSearch(tab.search),
  }
}

function normalizeTableTab(tab: TableTab): TableTab {
  return tab.kind === 'newView' ? tab : normalizeTableDataTab(tab)
}

function normalizeTabs(tabs: readonly TableTab[]): TableTab[] {
  const tabIndexes = new Map<string, number>()
  const nextTabs: TableTab[] = []

  for (const candidate of tabs) {
    const tab = normalizeTableTab(candidate)
    const existingIndex = tabIndexes.get(tab.id)
    if (existingIndex !== undefined) {
      nextTabs[existingIndex] = tab
      continue
    }

    tabIndexes.set(tab.id, nextTabs.length)
    nextTabs.push(tab)
  }

  return nextTabs
}

function searchesMatch(left: TableTabSearch, right: TableTabSearch): boolean {
  return (
    left.dir === right.dir &&
    left.filters === right.filters &&
    left.sort === right.sort &&
    left.view === right.view
  )
}

function tableViewsMatch(left: TableDataTab, right: TableDataTab): boolean {
  return (
    left.id === right.id ||
    (left.tableName === right.tableName && searchesMatch(left.search, right.search))
  )
}

export function tableTabStatesMatch(
  left: readonly TableTab[],
  right: readonly TableTab[],
): boolean {
  return (
    left.length === right.length &&
    left.every((tab, index) => {
      const candidate = right[index]
      if (candidate === undefined || tab.kind !== candidate.kind || tab.id !== candidate.id) {
        return false
      }
      if (tab.kind === 'newView' || candidate.kind === 'newView') {
        return true
      }

      return (
        tab.tableName === candidate.tableName &&
        tab.search.dir === candidate.search.dir &&
        tab.search.filters === candidate.search.filters &&
        tab.search.page === candidate.search.page &&
        tab.search.pageSize === candidate.search.pageSize &&
        tab.search.sort === candidate.search.sort &&
        tab.search.view === candidate.search.view
      )
    })
  )
}

export function reconcileTableTab({
  replaceableTabId = null,
  search,
  sourceTabId,
  tableName,
  tabs,
}: ReconcileTableTabInput): ReconcileTableTabResult {
  const canonicalSearch = canonicalizeSearch(search)
  const normalizedTabs = normalizeTabs(tabs)
  const activeTabId =
    isSchemaSearch(canonicalSearch) === true
      ? createSchemaTableTabId(tableName)
      : createBaseTableTabId(tableName)
  const existingView = normalizedTabs.find((tab) => tab.id === activeTabId)
  const reconciledTabs =
    sourceTabId === NEW_VIEW_TAB_ID && existingView === undefined
      ? normalizedTabs.filter((tab) => tab.kind !== 'newView')
      : removeSoleNewViewTab(normalizedTabs)
  const nextTab: TableDataTab = {
    kind: 'table',
    id: activeTabId,
    tableName,
    search: canonicalSearch,
  }
  const existingIndex = reconciledTabs.findIndex((tab) => tab.id === activeTabId)

  if (existingIndex === -1) {
    const replaceableIndex =
      sourceTabId !== NEW_VIEW_TAB_ID && isSchemaSearch(canonicalSearch) === false
        ? reconciledTabs.findIndex((tab) => tab.id === replaceableTabId)
        : -1
    if (replaceableIndex >= 0) {
      return {
        destinationTabId: activeTabId,
        tabs: reconciledTabs.map((tab, index) => (index === replaceableIndex ? nextTab : tab)),
      }
    }

    return {
      destinationTabId: activeTabId,
      tabs: [...reconciledTabs, nextTab],
    }
  }

  return {
    destinationTabId: activeTabId,
    tabs: reconciledTabs.map((tab, index) => (index === existingIndex ? nextTab : tab)),
  }
}

/**
 * Repairs persisted tab identities and removes tabs outside the active schema.
 * Returns the input state when no semantic repair is needed so provider consumers
 * and persistence effects retain their reference-based no-op contract.
 */
export function sanitizeTableTabsState(
  state: TableTabsState,
  availableTableNames: readonly string[],
): TableTabsState {
  const availableTables = new Set(availableTableNames)
  const tabs = normalizeTabs(state.tabs).filter(
    (tab) => tab.kind === 'newView' || availableTables.has(tab.tableName),
  )
  const recentViews = normalizeTabs(state.recentViews)
    .filter(
      (tab): tab is TableDataTab => tab.kind === 'table' && availableTables.has(tab.tableName),
    )
    .slice(0, MAX_RECENT_VIEWS)
  const nextTabs = tabs.length === 0 ? [createNewViewTab()] : tabs

  if (
    tableTabStatesMatch(nextTabs, state.tabs) === true &&
    tableTabStatesMatch(recentViews, state.recentViews) === true
  ) {
    return state
  }

  return {
    tabs: nextTabs,
    recentViews,
  }
}

export function openNewViewTab(tabs: readonly TableTab[]): TableTab[] {
  if (tabs.some((tab) => tab.kind === 'newView')) {
    return [...tabs]
  }

  return [...tabs, createNewViewTab()]
}

export function replaceNewViewTab(
  tabs: readonly TableTab[],
  selectedView: TableDataTab,
): TableTab[] {
  const sourceTabs = tabs.filter((tab) => tab.kind !== 'newView')
  const selectedViewIndex = sourceTabs.findIndex((tab) => tab.id === selectedView.id)
  return selectedViewIndex === -1
    ? [...sourceTabs, selectedView]
    : sourceTabs.map((tab, index) => (index === selectedViewIndex ? selectedView : tab))
}

export function recordRecentTableView(
  recentViews: readonly TableDataTab[],
  tableView: TableDataTab,
): TableDataTab[] {
  const normalizedView = normalizeTableDataTab(tableView)
  const normalizedRecentViews = normalizeTabs(recentViews).filter(
    (view): view is TableDataTab => view.kind === 'table',
  )
  return [
    normalizedView,
    ...normalizedRecentViews.filter((view) => tableViewsMatch(view, normalizedView) === false),
  ].slice(0, MAX_RECENT_VIEWS)
}

export function closeTableTab(tabs: readonly TableTab[], tabId: string): CloseTableTabResult {
  const closedIndex = tabs.findIndex((tab) => tab.id === tabId)
  if (closedIndex === -1) {
    return { tabs: [...tabs], nextActiveTab: null }
  }

  const nextTabs = tabs.filter((tab) => tab.id !== tabId)
  if (nextTabs.length === 0) {
    const newViewTab = createNewViewTab()
    return {
      tabs: [newViewTab],
      nextActiveTab: newViewTab,
    }
  }

  return {
    tabs: nextTabs,
    nextActiveTab: nextTabs[closedIndex] ?? nextTabs[closedIndex - 1] ?? null,
  }
}

export function getFinalTableTabName(tabs: readonly TableTab[], tabId: string): string | null {
  const tab = tabs.find(
    (candidate): candidate is TableDataTab => candidate.kind === 'table' && candidate.id === tabId,
  )
  if (tab === undefined) {
    return null
  }
  const hasAnotherRepresentation = tabs.some(
    (candidate) =>
      candidate.kind === 'table' && candidate.id !== tabId && candidate.tableName === tab.tableName,
  )
  return hasAnotherRepresentation === true ? null : tab.tableName
}

function isTableTabSearch(value: unknown): value is TableTabSearch {
  return typeof value === 'object' && value !== null
}

function parseTableDataTab(value: unknown): TableDataTab | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const tab = value as Partial<TableDataTab>
  if (
    (tab.kind !== undefined && tab.kind !== 'table') ||
    typeof tab.id !== 'string' ||
    typeof tab.tableName !== 'string' ||
    isTableTabSearch(tab.search) === false
  ) {
    return null
  }

  return {
    kind: 'table',
    id: tab.id,
    tableName: tab.tableName,
    search: toTableTabSearch(tab.search),
  }
}

function parseTableTab(value: unknown): TableTab | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'newView' &&
    'id' in value &&
    value.id === NEW_VIEW_TAB_ID
  ) {
    return { kind: 'newView', id: NEW_VIEW_TAB_ID }
  }

  return parseTableDataTab(value)
}

function parseTabs(values: unknown): TableTab[] {
  if (Array.isArray(values) === false) {
    return []
  }

  return values.flatMap((value) => {
    const tab = parseTableTab(value)
    return tab === null ? [] : [tab]
  })
}

function parseRecentViews(values: unknown): TableDataTab[] {
  if (Array.isArray(values) === false) {
    return []
  }

  return values
    .flatMap((value) => {
      const tab = parseTableDataTab(value)
      return tab === null ? [] : [tab]
    })
    .slice(0, MAX_RECENT_VIEWS)
}

function readStoredState(scope: string): TableTabsState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedValue = getConnectionScopedStorageValue('tabs', scope)
    const parsed = JSON.parse(storedValue ?? 'null') as {
      version?: unknown
      tabs?: unknown
      recentViews?: unknown
    } | null
    if (parsed?.version !== 1) {
      return null
    }

    return {
      tabs: parseTabs(parsed.tabs),
      recentViews: parseRecentViews(parsed.recentViews),
    }
  } catch {
    return null
  }
}

export function loadTableTabsState(scope: string): TableTabsState {
  const state = readStoredState(scope) ?? emptyTableTabsState()
  return state.tabs.length === 0 ? { ...state, tabs: [createNewViewTab()] } : state
}

export function saveTableTabsState(scope: string, state: TableTabsState): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getConnectionScopedStorageKey('tabs', scope),
      JSON.stringify({ version: 1, ...state }),
    )
  } catch {}
}
