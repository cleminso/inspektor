import type { TablePageSize } from "@tables/tableTypes";

export interface TableTabSearch {
  dir?: string;
  filters?: string;
  page?: number;
  pageSize?: TablePageSize;
  sort?: string;
  view?: string;
}

export interface TableTabsRouteSearch extends TableTabSearch {
  empty?: "true";
}

export interface TableDataTab {
  kind: "table";
  id: string;
  tableName: string;
  search: TableTabSearch;
}

export interface NewViewTab {
  kind: "newView";
  id: typeof NEW_VIEW_TAB_ID;
}

export type TableTab = TableDataTab | NewViewTab;

export interface TableTabsState {
  tabs: TableTab[];
  recentViews: TableDataTab[];
}

interface ReconcileTableTabInput {
  activeTabId: string | null;
  createId: () => string;
  search: TableTabSearch;
  tableName: string;
  tabs: readonly TableTab[];
}

interface ReconcileTableTabResult {
  activeTabId: string;
  tabs: TableTab[];
}

interface CloseTableTabResult {
  tabs: TableTab[];
  nextActiveTab: TableTab | null;
}

interface OpenNewViewTabResult {
  activeTabId: typeof NEW_VIEW_TAB_ID;
  tabs: TableTab[];
}

interface OpenBaseTableTabsResult {
  activeTabId: string | null;
  tabs: TableTab[];
}

const TABLE_TABS_STORAGE_KEY = "regarde-inspector-tabs";
const MAX_RECENT_VIEWS = 5;
export const NEW_VIEW_TAB_ID = "new-view" as const;

const createNewViewTab = (): NewViewTab => ({ kind: "newView", id: NEW_VIEW_TAB_ID });

function removeSoleNewViewTab(tabs: readonly TableTab[]): TableTab[] {
  return tabs.length === 1 && tabs[0]?.kind === "newView" ? [] : [...tabs];
}

const emptyTableTabsState = (): TableTabsState => ({
  tabs: [createNewViewTab()],
  recentViews: [],
});

export function createBaseTableTabId(tableName: string): string {
  return `table:${encodeURIComponent(tableName)}`;
}

export function createSchemaTableTabId(tableName: string): string {
  return `schema:${encodeURIComponent(tableName)}`;
}

export function createTableTabRouteSearch(tab: TableTab): TableTabsRouteSearch {
  return tab.kind === "newView" ? { empty: "true" } : { ...tab.search };
}

export function openBaseTableTabs(
  tabs: readonly TableTab[],
  orderedTableNames: readonly string[],
): OpenBaseTableTabsResult {
  const nextTabs = removeSoleNewViewTab(tabs);
  const tabIds = new Set(nextTabs.map((tab) => tab.id));
  let activeTabId: string | null = null;

  for (const tableName of orderedTableNames) {
    const tabId = createBaseTableTabId(tableName);
    activeTabId = tabId;
    if (tabIds.has(tabId) === true) {
      continue;
    }

    nextTabs.push({ kind: "table", id: tabId, tableName, search: {} });
    tabIds.add(tabId);
  }

  return { activeTabId, tabs: nextTabs };
}

export function reorderTableTabs(
  tabs: readonly TableTab[],
  orderedTabIds: readonly string[],
): TableTab[] {
  if (orderedTabIds.length !== tabs.length || new Set(orderedTabIds).size !== tabs.length) {
    return [...tabs];
  }
  const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));
  const reorderedTabs = orderedTabIds.flatMap((tabId) => {
    const tab = tabsById.get(tabId);
    return tab === undefined ? [] : [tab];
  });
  return reorderedTabs.length === tabs.length ? reorderedTabs : [...tabs];
}

function isBaseSearch(search: TableTabSearch): boolean {
  return (
    search.filters === undefined &&
    search.sort === undefined &&
    search.dir === undefined &&
    (search.view === undefined || search.view === "data")
  );
}

function isSchemaSearch(search: TableTabSearch): boolean {
  return search.view === "schema";
}

function canonicalizeSearch(search: TableTabSearch): TableTabSearch {
  return isSchemaSearch(search) === true ? { view: "schema" } : search;
}

function normalizeTableTab(tab: TableTab): TableTab {
  if (tab.kind === "newView" || isSchemaSearch(tab.search) === false) {
    return tab;
  }

  return {
    kind: "table",
    id: createSchemaTableTabId(tab.tableName),
    tableName: tab.tableName,
    search: { view: "schema" },
  };
}

function normalizeTabs(tabs: readonly TableTab[]): TableTab[] {
  const tabIds = new Set<string>();
  const nextTabs: TableTab[] = [];

  for (const candidate of tabs) {
    const tab = normalizeTableTab(candidate);
    if (tabIds.has(tab.id) === true) {
      continue;
    }

    tabIds.add(tab.id);
    nextTabs.push(tab);
  }

  return nextTabs;
}

function searchesMatch(left: TableTabSearch, right: TableTabSearch): boolean {
  return (
    left.dir === right.dir &&
    left.filters === right.filters &&
    left.sort === right.sort &&
    left.view === right.view
  );
}

function tableViewsMatch(left: TableDataTab, right: TableDataTab): boolean {
  return (
    left.id === right.id ||
    (left.tableName === right.tableName && searchesMatch(left.search, right.search))
  );
}

function tabStatesMatch(left: readonly TableTab[], right: readonly TableTab[]): boolean {
  return (
    left.length === right.length &&
    left.every((tab, index) => {
      const candidate = right[index];
      if (candidate === undefined || tab.kind !== candidate.kind || tab.id !== candidate.id) {
        return false;
      }
      if (tab.kind === "newView" || candidate.kind === "newView") {
        return true;
      }

      return (
        tab.tableName === candidate.tableName &&
        tab.search.dir === candidate.search.dir &&
        tab.search.filters === candidate.search.filters &&
        tab.search.page === candidate.search.page &&
        tab.search.pageSize === candidate.search.pageSize &&
        tab.search.sort === candidate.search.sort &&
        tab.search.view === candidate.search.view
      );
    })
  );
}

export function reconcileTableTab({
  activeTabId: currentActiveTabId,
  createId,
  search,
  tableName,
  tabs,
}: ReconcileTableTabInput): ReconcileTableTabResult {
  const canonicalSearch = canonicalizeSearch(search);
  const normalizedTabs = normalizeTabs(tabs);
  const matchingView = normalizedTabs.find(
    (tab): tab is TableDataTab =>
      tab.kind === "table" &&
      tab.tableName === tableName &&
      searchesMatch(tab.search, canonicalSearch),
  );
  const reconciledTabs =
    currentActiveTabId === NEW_VIEW_TAB_ID && matchingView === undefined
      ? normalizedTabs.filter((tab) => tab.kind !== "newView")
      : removeSoleNewViewTab(normalizedTabs);
  const activeView = reconciledTabs.find(
    (tab): tab is TableDataTab =>
      tab.kind === "table" &&
      tab.id === currentActiveTabId &&
      tab.tableName === tableName &&
      isSchemaSearch(tab.search) === false &&
      tab.id !== createBaseTableTabId(tableName),
  );
  const activeTabId =
    isSchemaSearch(canonicalSearch) === true
      ? createSchemaTableTabId(tableName)
      : isBaseSearch(canonicalSearch) === true
      ? createBaseTableTabId(tableName)
      : (matchingView?.id ?? activeView?.id ?? `view:${createId()}`);
  const nextTab: TableDataTab = {
    kind: "table",
    id: activeTabId,
    tableName,
    search: canonicalSearch,
  };
  const existingIndex = reconciledTabs.findIndex((tab) => tab.id === activeTabId);

  if (existingIndex === -1) {
    return {
      activeTabId,
      tabs: [...reconciledTabs, nextTab],
    };
  }

  return {
    activeTabId,
    tabs: reconciledTabs.map((tab, index) => (index === existingIndex ? nextTab : tab)),
  };
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
  const availableTables = new Set(availableTableNames);
  const tabs = normalizeTabs(state.tabs).filter(
    (tab) => tab.kind === "newView" || availableTables.has(tab.tableName),
  );
  const recentViews = normalizeTabs(state.recentViews)
    .filter(
      (tab): tab is TableDataTab =>
        tab.kind === "table" && availableTables.has(tab.tableName),
    )
    .slice(0, MAX_RECENT_VIEWS);
  const nextTabs = tabs.length === 0 ? [createNewViewTab()] : tabs;

  if (
    tabStatesMatch(nextTabs, state.tabs) === true &&
    tabStatesMatch(recentViews, state.recentViews) === true
  ) {
    return state;
  }

  return {
    tabs: nextTabs,
    recentViews,
  };
}

export function openNewViewTab(tabs: readonly TableTab[]): OpenNewViewTabResult {
  if (tabs.some((tab) => tab.kind === "newView")) {
    return { activeTabId: NEW_VIEW_TAB_ID, tabs: [...tabs] };
  }

  return {
    activeTabId: NEW_VIEW_TAB_ID,
    tabs: [...tabs, createNewViewTab()],
  };
}

export function replaceNewViewTab(
  tabs: readonly TableTab[],
  selectedView: TableDataTab,
): TableTab[] {
  const sourceTabs = tabs.filter((tab) => tab.kind !== "newView");
  const selectedViewIndex = sourceTabs.findIndex((tab) => tab.id === selectedView.id);
  return selectedViewIndex === -1
    ? [...sourceTabs, selectedView]
    : sourceTabs.map((tab, index) => (index === selectedViewIndex ? selectedView : tab));
}

export function recordRecentTableView(
  recentViews: readonly TableDataTab[],
  tableView: TableDataTab,
): TableDataTab[] {
  const matchingIndex = recentViews.findIndex((view) => tableViewsMatch(view, tableView));
  if (matchingIndex === 0 && tableViewsMatch(recentViews[0]!, tableView)) {
    return [...recentViews];
  }

  return [tableView, ...recentViews.filter((view) => tableViewsMatch(view, tableView) === false)].slice(
    0,
    MAX_RECENT_VIEWS,
  );
}

export function closeTableTab(
  tabs: readonly TableTab[],
  tabId: string,
): CloseTableTabResult {
  const closedIndex = tabs.findIndex((tab) => tab.id === tabId);
  if (closedIndex === -1) {
    return { tabs: [...tabs], nextActiveTab: null };
  }

  const nextTabs = tabs.filter((tab) => tab.id !== tabId);
  if (nextTabs.length === 0) {
    const newViewTab = createNewViewTab();
    return {
      tabs: [newViewTab],
      nextActiveTab: newViewTab,
    };
  }

  return {
    tabs: nextTabs,
    nextActiveTab: nextTabs[closedIndex] ?? nextTabs[closedIndex - 1] ?? null,
  };
}

function isTableTabSearch(value: unknown): value is TableTabSearch {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const search = value as TableTabSearch;
  return (
    (search.dir === undefined || typeof search.dir === "string") &&
    (search.filters === undefined || typeof search.filters === "string") &&
    (search.page === undefined || (Number.isInteger(search.page) && search.page > 0)) &&
    (search.pageSize === undefined ||
      search.pageSize === 100 ||
      search.pageSize === 500 ||
      search.pageSize === 1000) &&
    (search.sort === undefined || typeof search.sort === "string") &&
    (search.view === undefined || typeof search.view === "string")
  );
}

function parseTableDataTab(value: unknown): TableDataTab | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const tab = value as Partial<TableDataTab>;
  if (
    (tab.kind !== undefined && tab.kind !== "table") ||
    typeof tab.id !== "string" ||
    typeof tab.tableName !== "string" ||
    isTableTabSearch(tab.search) === false
  ) {
    return null;
  }

  return {
    kind: "table",
    id: tab.id,
    tableName: tab.tableName,
    search: tab.search,
  };
}

function parseTableTab(value: unknown): TableTab | null {
  if (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<NewViewTab>).kind === "newView" &&
    (value as Partial<NewViewTab>).id === NEW_VIEW_TAB_ID
  ) {
    return { kind: "newView", id: NEW_VIEW_TAB_ID };
  }

  return parseTableDataTab(value);
}

function parseTabs(values: unknown): TableTab[] {
  if (Array.isArray(values) === false) {
    return [];
  }

  return values.flatMap((value) => {
    const tab = parseTableTab(value);
    return tab === null ? [] : [tab];
  });
}

function parseRecentViews(values: unknown): TableDataTab[] {
  if (Array.isArray(values) === false) {
    return [];
  }

  return values
    .flatMap((value) => {
      const tab = parseTableDataTab(value);
      return tab === null ? [] : [tab];
    })
    .slice(0, MAX_RECENT_VIEWS);
}

function readStoredScopes(): Record<string, TableTabsState> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(TABLE_TABS_STORAGE_KEY) ?? "null") as {
      version?: unknown;
      scopes?: unknown;
    } | null;
    if (typeof parsed?.scopes !== "object" || parsed.scopes === null) {
      return {};
    }

    const scopes: Record<string, TableTabsState> = {};
    for (const [scope, value] of Object.entries(parsed.scopes)) {
      if (parsed.version === 1) {
        scopes[scope] = { tabs: parseTabs(value), recentViews: [] };
        continue;
      }
      if (parsed.version !== 2 || typeof value !== "object" || value === null) {
        continue;
      }

      const storedState = value as Partial<TableTabsState>;
      scopes[scope] = {
        tabs: parseTabs(storedState.tabs),
        recentViews: parseRecentViews(storedState.recentViews),
      };
    }
    return scopes;
  } catch {
    return {};
  }
}

export function loadTableTabsState(scope: string): TableTabsState {
  const state = readStoredScopes()[scope] ?? emptyTableTabsState();
  return state.tabs.length === 0 ? { ...state, tabs: [createNewViewTab()] } : state;
}

export function saveTableTabsState(scope: string, state: TableTabsState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const scopes = readStoredScopes();
    scopes[scope] = state;
    window.localStorage.setItem(TABLE_TABS_STORAGE_KEY, JSON.stringify({ version: 2, scopes }));
  } catch {}
}
