export interface TableTabSearch {
  dir?: string;
  filters?: string;
  sort?: string;
  view?: string;
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
  createId: () => string;
  requestedTabId: string | null;
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

const emptyTableTabsState = (): TableTabsState => ({
  tabs: [createNewViewTab()],
  recentViews: [],
});

export function createBaseTableTabId(tableName: string): string {
  return `table:${encodeURIComponent(tableName)}`;
}

export function openBaseTableTabs(
  tabs: readonly TableTab[],
  orderedTableNames: readonly string[],
): OpenBaseTableTabsResult {
  const nextTabs = tabs.filter((tab) => tab.kind !== "newView");
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

function isBaseSearch(search: TableTabSearch): boolean {
  return (
    search.filters === undefined &&
    search.sort === undefined &&
    search.dir === undefined &&
    (search.view === undefined || search.view === "data")
  );
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

export function reconcileTableTab({
  createId,
  requestedTabId,
  search,
  tableName,
  tabs,
}: ReconcileTableTabInput): ReconcileTableTabResult {
  const requestedTab =
    requestedTabId === null ? undefined : tabs.find((tab) => tab.id === requestedTabId);
  const matchingView = tabs.find(
    (tab): tab is TableDataTab =>
      tab.kind === "table" &&
      tab.tableName === tableName &&
      searchesMatch(tab.search, search),
  );
  const reusableRequestedTabId =
    requestedTab?.kind === "table" && requestedTab.tableName === tableName
      ? requestedTab.id
      : requestedTab === undefined
        ? requestedTabId
        : null;
  const activeTabId =
    reusableRequestedTabId ??
    (isBaseSearch(search) === true
      ? createBaseTableTabId(tableName)
      : (matchingView?.id ?? `view:${createId()}`));
  const nextTab: TableDataTab = {
    kind: "table",
    id: activeTabId,
    tableName,
    search,
  };
  const existingIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  if (existingIndex === -1) {
    return {
      activeTabId,
      tabs: [...tabs, nextTab],
    };
  }

  return {
    activeTabId,
    tabs: tabs.map((tab, index) => (index === existingIndex ? nextTab : tab)),
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
  const newViewIndex = tabs.findIndex((tab) => tab.kind === "newView");
  const remainingTabs = tabs.filter(
    (tab) => tab.kind !== "newView" && tab.id !== selectedView.id,
  );
  if (newViewIndex === -1) {
    return [...remainingTabs, selectedView];
  }

  const insertionIndex = Math.min(newViewIndex, remainingTabs.length);
  return remainingTabs.toSpliced(insertionIndex, 0, selectedView);
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

  return Object.values(value).every((entry) => entry === undefined || typeof entry === "string");
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
