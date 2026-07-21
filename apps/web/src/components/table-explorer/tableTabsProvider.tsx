import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createBaseTableTabId,
  loadTableTabsState,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  replaceNewViewTab,
  saveTableTabsState,
  type TableDataTab,
  type TableTab,
  type TableTabSearch,
  type TableTabsState,
} from "@/components/table-explorer/tableTabs";
import { appRoutes } from "@/lib/navigation/appRoutes";

interface RouteSearch extends TableTabSearch {
  empty?: string;
  tab?: string;
}

interface TableTabsContextValue {
  activeTabId: string | null;
  recentViews: readonly TableDataTab[];
  tabs: readonly TableTab[];
  activateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  getBaseTabSearch: (tableName: string) => RouteSearch;
  openNewView: () => void;
  openRecentView: (view: TableDataTab) => void;
}

const TableTabsContext = createContext<TableTabsContextValue | null>(null);

function createViewId(): string {
  return globalThis.crypto.randomUUID();
}

function searchesMatch(left: TableTabSearch, right: TableTabSearch): boolean {
  return (
    left.dir === right.dir &&
    left.filters === right.filters &&
    left.sort === right.sort &&
    left.view === right.view
  );
}

function tabsMatch(left: readonly TableTab[], right: readonly TableTab[]): boolean {
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
        tab.tableName === candidate.tableName && searchesMatch(tab.search, candidate.search)
      );
    })
  );
}

interface TableTabsProviderProps {
  children: ReactNode;
  scope: string;
}

export function TableTabsProvider({ children, scope }: TableTabsProviderProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash, currentTableName } =
    useInspector();
  const navigate = useNavigate();
  const routeSearch = useSearch({ strict: false }) as RouteSearch;
  const [state, setState] = useState<TableTabsState>(() => loadTableTabsState(scope));
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const closingActiveTabIdRef = useRef<string | null>(null);
  const pendingNavigationTabIdRef = useRef<string | null>(null);
  const currentSearch = useMemo<TableTabSearch>(
    () => ({
      dir: routeSearch.dir,
      filters: routeSearch.filters,
      sort: routeSearch.sort,
      view: routeSearch.view,
    }),
    [routeSearch.dir, routeSearch.filters, routeSearch.sort, routeSearch.view],
  );
  const tabsById = useMemo(
    () => new Map(state.tabs.map((tab) => [tab.id, tab])),
    [state.tabs],
  );

  useEffect(() => {
    saveTableTabsState(scope, state);
  }, [scope, state]);

  useEffect(() => {
    if (
      pendingNavigationTabIdRef.current !== null &&
      pendingNavigationTabIdRef.current !== routeSearch.tab
    ) {
      return;
    }
    pendingNavigationTabIdRef.current = null;

    if (currentTableName === null) {
      closingActiveTabIdRef.current = null;
      if (routeSearch.tab === NEW_VIEW_TAB_ID) {
        const result = openNewViewTab(state.tabs);
        if (tabsMatch(result.tabs, state.tabs) === false) {
          setState((currentState) => ({ ...currentState, tabs: result.tabs }));
        }
        setActiveTabId(NEW_VIEW_TAB_ID);
        return;
      }

      setActiveTabId(null);
      return;
    }

    if (closingActiveTabIdRef.current === routeSearch.tab) {
      return;
    }
    closingActiveTabIdRef.current = null;

    const tabsWithoutNewView = state.tabs.filter((tab) => tab.kind !== "newView");
    const result = reconcileTableTab({
      createId: createViewId,
      requestedTabId: routeSearch.tab ?? null,
      search: currentSearch,
      tableName: currentTableName,
      tabs: tabsWithoutNewView,
    });
    const activeTableTab = result.tabs.find(
      (tab): tab is TableDataTab => tab.kind === "table" && tab.id === result.activeTabId,
    );
    const recentViews =
      activeTableTab === undefined
        ? state.recentViews
        : recordRecentTableView(state.recentViews, activeTableTab);
    if (
      tabsMatch(result.tabs, state.tabs) === false ||
      tabsMatch(recentViews, state.recentViews) === false
    ) {
      setState({ tabs: result.tabs, recentViews });
    }
    setActiveTabId(result.activeTabId);

    if (
      routeSearch.tab === undefined &&
      currentConnectionId !== null &&
      currentBranch !== null &&
      currentSchemaHash !== null
    ) {
      void navigate({
        to: appRoutes.table,
        params: {
          connectionId: currentConnectionId,
          branch: currentBranch,
          schemaHash: currentSchemaHash,
          tableName: currentTableName,
        },
        search: { ...currentSearch, tab: result.activeTabId },
        replace: true,
      });
    }
  }, [
    currentBranch,
    currentConnectionId,
    currentSchemaHash,
    currentSearch,
    currentTableName,
    navigate,
    routeSearch.tab,
    state,
  ]);

  const navigateToTab = useCallback(
    (tab: TableTab) => {
      if (currentConnectionId === null || currentBranch === null || currentSchemaHash === null) {
        return;
      }

      if (tab.kind === "newView") {
        void navigate({
          to: appRoutes.tables,
          params: {
            connectionId: currentConnectionId,
            branch: currentBranch,
            schemaHash: currentSchemaHash,
          },
          search: { tab: NEW_VIEW_TAB_ID },
        });
        return;
      }

      void navigate({
        to: appRoutes.table,
        params: {
          connectionId: currentConnectionId,
          branch: currentBranch,
          schemaHash: currentSchemaHash,
          tableName: tab.tableName,
        },
        search: { ...tab.search, tab: tab.id },
      });
    },
    [currentBranch, currentConnectionId, currentSchemaHash, navigate],
  );

  const activateTab = useCallback(
    (tabId: string) => {
      const tab = state.tabs.find((candidate) => candidate.id === tabId);
      if (tab !== undefined) {
        pendingNavigationTabIdRef.current = tab.id;
        navigateToTab(tab);
      }
    },
    [navigateToTab, state.tabs],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      const result = closeTableTab(state.tabs, tabId);
      setState((currentState) => ({ ...currentState, tabs: result.tabs }));
      if (tabId !== activeTabId) {
        return;
      }

      closingActiveTabIdRef.current = tabId;
      setActiveTabId(result.nextActiveTab?.id ?? null);
      if (result.nextActiveTab !== null) {
        pendingNavigationTabIdRef.current = result.nextActiveTab.id;
        navigateToTab(result.nextActiveTab);
        return;
      }

      if (currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null) {
        void navigate({
          to: appRoutes.tables,
          params: {
            connectionId: currentConnectionId,
            branch: currentBranch,
            schemaHash: currentSchemaHash,
          },
          search: { empty: "true" },
        });
      }
    },
    [
      activeTabId,
      currentBranch,
      currentConnectionId,
      currentSchemaHash,
      navigate,
      navigateToTab,
      state.tabs,
    ],
  );

  const openNewView = useCallback(() => {
    const result = openNewViewTab(state.tabs);
    setState((currentState) => ({ ...currentState, tabs: result.tabs }));
    setActiveTabId(result.activeTabId);
    pendingNavigationTabIdRef.current = result.activeTabId;
    navigateToTab({ kind: "newView", id: NEW_VIEW_TAB_ID });
  }, [navigateToTab, state.tabs]);

  const openRecentView = useCallback(
    (view: TableDataTab) => {
      const tabs =
        activeTabId === NEW_VIEW_TAB_ID
          ? replaceNewViewTab(state.tabs, view)
          : replaceNewViewTab(
              state.tabs.filter((tab) => tab.kind !== "newView"),
              view,
            );
      setState({
        tabs,
        recentViews: recordRecentTableView(state.recentViews, view),
      });
      setActiveTabId(view.id);
      pendingNavigationTabIdRef.current = view.id;
      navigateToTab(view);
    },
    [activeTabId, navigateToTab, state.recentViews, state.tabs],
  );

  const getBaseTabSearch = useCallback(
    (tableName: string): RouteSearch => {
      const id = createBaseTableTabId(tableName);
      const candidate = tabsById.get(id);
      const savedTab = candidate?.kind === "table" ? candidate : undefined;
      return { ...savedTab?.search, tab: id };
    },
    [tabsById],
  );

  const value = useMemo<TableTabsContextValue>(
    () => ({
      activeTabId,
      recentViews: state.recentViews,
      tabs: state.tabs,
      activateTab,
      closeTab,
      getBaseTabSearch,
      openNewView,
      openRecentView,
    }),
    [
      activeTabId,
      activateTab,
      closeTab,
      getBaseTabSearch,
      openNewView,
      openRecentView,
      state,
    ],
  );

  return <TableTabsContext.Provider value={value}>{children}</TableTabsContext.Provider>;
}

export function useTableTabs(): TableTabsContextValue {
  const context = use(TableTabsContext);
  if (context === null) {
    throw new Error("useTableTabs must be used within TableTabsProvider");
  }

  return context;
}
