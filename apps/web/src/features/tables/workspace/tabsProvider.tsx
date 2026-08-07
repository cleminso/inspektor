import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { useInspector } from "@app/providers/inspectorProvider";
import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createTableTabRouteSearch,
  createSchemaTableTabId,
  loadTableTabsState,
  openBaseTableTabs,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  reorderTableTabs,
  replaceNewViewTab,
  saveTableTabsState,
  sanitizeTableTabsState,
  type TableDataTab,
  type TableTab,
  type TableTabSearch,
  type TableTabsState,
  type TableTabsRouteSearch,
} from "@tables/workspace/tabs";
import { appRoutes } from "@app/routing/appRoutes";
import { useAvailableTables } from "@tables/schema/useAvailableTables";

interface RouteSearch extends TableTabsRouteSearch {
  tab?: string;
}

interface TableTabsContextValue {
  activeTabId: string | null;
  recentViews: readonly TableDataTab[];
  tabs: readonly TableTab[];
  activateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  openBaseTabs: (orderedTableNames: readonly string[]) => void;
  openNewView: () => void;
  openRecentView: (view: TableDataTab) => void;
  openSchemaView: (tableName: string) => void;
  reorderTabs: (orderedTabIds: readonly string[]) => void;
}

const TableTabsContext = createContext<TableTabsContextValue | null>(null);

function createViewId(): string {
  return globalThis.crypto.randomUUID();
}

function searchesMatch(left: TableTabSearch, right: TableTabSearch): boolean {
  return (
    left.dir === right.dir &&
    left.filters === right.filters &&
    left.page === right.page &&
    left.pageSize === right.pageSize &&
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

interface TableTabsProviderState extends TableTabsState {
  activeTabId: string | null;
}

export function TableTabsProvider({ children, scope }: TableTabsProviderProps): React.ReactElement {
  const { currentConnectionId, currentTableName } = useInspector();
  const navigate = useNavigate({ from: appRoutes.tables });
  const routeSearch = useSearch({ strict: false }) as RouteSearch;
  const { isSchemaReady, tables: availableTables } = useAvailableTables();
  const [state, setState] = useState<TableTabsProviderState>(() => ({
    ...loadTableTabsState(scope),
    activeTabId: null,
  }));
  const currentSearch = useMemo<TableTabSearch>(
    () => ({
      dir: routeSearch.dir,
      filters: routeSearch.filters,
      page: routeSearch.page,
      pageSize: routeSearch.pageSize,
      sort: routeSearch.sort,
      view: routeSearch.view,
    }),
    [
      routeSearch.dir,
      routeSearch.filters,
      routeSearch.page,
      routeSearch.pageSize,
      routeSearch.sort,
      routeSearch.view,
    ],
  );
  useEffect(() => {
    saveTableTabsState(scope, { tabs: state.tabs, recentViews: state.recentViews });
  }, [scope, state.recentViews, state.tabs]);

  useEffect(() => {
    if (routeSearch.tab === undefined) {
      return;
    }

    void navigate({
      replace: true,
      search: (search) => {
        const nextSearch = { ...search } as RouteSearch;
        delete nextSearch.tab;
        return nextSearch;
      },
    });
  }, [navigate, routeSearch.tab]);

  useEffect(() => {
    setState((currentState) => {
      const sanitizedTabsState =
        isSchemaReady === true
          ? sanitizeTableTabsState(currentState, availableTables)
          : currentState;
      const sanitizedState =
        sanitizedTabsState === currentState
          ? currentState
          : { ...sanitizedTabsState, activeTabId: currentState.activeTabId };
      if (currentTableName === null) {
        if (routeSearch.empty === "true") {
          const result = openNewViewTab(sanitizedState.tabs);
          if (
            tabsMatch(result.tabs, sanitizedState.tabs) === true &&
            sanitizedState.activeTabId === NEW_VIEW_TAB_ID
          ) {
            return sanitizedState;
          }

          return { ...sanitizedState, tabs: result.tabs, activeTabId: NEW_VIEW_TAB_ID };
        }

        return sanitizedState.activeTabId === null
          ? sanitizedState
          : { ...sanitizedState, activeTabId: null };
      }

      if (
        isSchemaReady === true &&
        availableTables.includes(currentTableName) === false
      ) {
        const result = openNewViewTab(sanitizedState.tabs);
        return { ...sanitizedState, tabs: result.tabs, activeTabId: NEW_VIEW_TAB_ID };
      }

      const result = reconcileTableTab({
        activeTabId: sanitizedState.activeTabId,
        createId: createViewId,
        search: currentSearch,
        tableName: currentTableName,
        tabs: sanitizedState.tabs,
      });
      const activeTableTab = result.tabs.find(
        (tab): tab is TableDataTab => tab.kind === "table" && tab.id === result.activeTabId,
      );
      const recentViews =
        activeTableTab === undefined
          ? sanitizedState.recentViews
          : recordRecentTableView(sanitizedState.recentViews, activeTableTab);
      if (
        tabsMatch(result.tabs, sanitizedState.tabs) === true &&
        tabsMatch(recentViews, sanitizedState.recentViews) === true &&
        sanitizedState.activeTabId === result.activeTabId
      ) {
        return sanitizedState;
      }

      return { tabs: result.tabs, recentViews, activeTabId: result.activeTabId };
    });
  }, [availableTables, currentSearch, currentTableName, isSchemaReady, routeSearch.empty]);

  useEffect(() => {
    if (
      currentConnectionId === null ||
      currentTableName === null ||
      isSchemaReady === false ||
      availableTables.includes(currentTableName) === true
    ) {
      return;
    }

    void navigate({
      to: appRoutes.tables,
      params: { connectionId: currentConnectionId },
      replace: true,
      search: { empty: "true" },
    });
  }, [availableTables, currentConnectionId, currentTableName, isSchemaReady, navigate]);

  const navigateToTab = useCallback(
    (tab: TableTab) => {
      if (currentConnectionId === null) {
        return;
      }

      const search = createTableTabRouteSearch(tab);

      if (tab.kind === "newView") {
        void navigate({
          to: appRoutes.tables,
          params: {
            connectionId: currentConnectionId,
          },
          search,
        });
        return;
      }

      void navigate({
        to: appRoutes.table,
        params: {
          connectionId: currentConnectionId,
          tableName: tab.tableName,
        },
        search,
      });
    },
    [currentConnectionId, navigate],
  );

  const activateTab = useCallback(
    (tabId: string) => {
      const tab = state.tabs.find((candidate) => candidate.id === tabId);
      if (tab !== undefined) {
        navigateToTab(tab);
      }
    },
    [navigateToTab, state.tabs],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      const result = closeTableTab(state.tabs, tabId);
      if (tabId !== state.activeTabId) {
        setState((currentState) => ({ ...currentState, tabs: result.tabs }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        tabs: result.tabs,
        activeTabId: result.nextActiveTab?.id ?? null,
      }));
      if (result.nextActiveTab !== null) {
        navigateToTab(result.nextActiveTab);
        return;
      }

      if (currentConnectionId !== null) {
        void navigate({
          to: appRoutes.tables,
          params: {
            connectionId: currentConnectionId,
          },
          search: { empty: "true" },
        });
      }
    },
    [
      currentConnectionId,
      navigate,
      navigateToTab,
      state.activeTabId,
      state.tabs,
    ],
  );

  const openNewView = useCallback(() => {
    const result = openNewViewTab(state.tabs);
    setState((currentState) => ({
      ...currentState,
      tabs: result.tabs,
      activeTabId: result.activeTabId,
    }));
    navigateToTab({ kind: "newView", id: NEW_VIEW_TAB_ID });
  }, [navigateToTab, state.tabs]);

  const openBaseTabs = useCallback(
    (orderedTableNames: readonly string[]) => {
      const sourceTabs =
        state.activeTabId === NEW_VIEW_TAB_ID
          ? state.tabs.filter((tab) => tab.kind !== "newView")
          : state.tabs;
      const result = openBaseTableTabs(sourceTabs, orderedTableNames);
      if (result.activeTabId === null) {
        return;
      }

      const activeTab = result.tabs.find((tab) => tab.id === result.activeTabId);
      if (activeTab === undefined) {
        return;
      }

      setState((currentState) => ({
        ...currentState,
        tabs: result.tabs,
        activeTabId: result.activeTabId,
      }));
      navigateToTab(activeTab);
    },
    [navigateToTab, state.activeTabId, state.tabs],
  );

  const openRecentView = useCallback(
    (view: TableDataTab) => {
      const tabs = replaceNewViewTab(state.tabs, view);
      setState({
        tabs,
        recentViews: recordRecentTableView(state.recentViews, view),
        activeTabId: view.id,
      });
      navigateToTab(view);
    },
    [navigateToTab, state.recentViews, state.tabs],
  );

  const openSchemaView = useCallback(
    (tableName: string) => {
      const schemaTab: TableDataTab = {
        kind: "table",
        id: createSchemaTableTabId(tableName),
        tableName,
        search: { view: "schema" },
      };
      navigateToTab(schemaTab);
    },
    [navigateToTab],
  );

  const reorderTabs = useCallback((orderedTabIds: readonly string[]) => {
    setState((currentState) => ({
      ...currentState,
      tabs: reorderTableTabs(currentState.tabs, orderedTabIds),
    }));
  }, []);

  const value = useMemo<TableTabsContextValue>(
    () => ({
      activeTabId: state.activeTabId,
      recentViews: state.recentViews,
      tabs: state.tabs,
      activateTab,
      closeTab,
      openBaseTabs,
      openNewView,
      openRecentView,
      openSchemaView,
      reorderTabs,
    }),
    [
      activateTab,
      closeTab,
      openBaseTabs,
      openNewView,
      openRecentView,
      openSchemaView,
      reorderTabs,
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
