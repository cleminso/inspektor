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

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createTableTabRouteSearch,
  loadTableTabsState,
  openBaseTableTabs,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  reorderTableTabs,
  replaceNewViewTab,
  saveTableTabsState,
  type TableDataTab,
  type TableTab,
  type TableTabSearch,
  type TableTabsState,
  type TableTabsRouteSearch,
} from "@/components/table-explorer/tableTabs";
import { appRoutes } from "@/lib/navigation/appRoutes";

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
  const navigate = useNavigate();
  const routeSearch = useSearch({ strict: false }) as RouteSearch;
  const [state, setState] = useState<TableTabsProviderState>(() => ({
    ...loadTableTabsState(scope),
    activeTabId: null,
  }));
  const currentSearch = useMemo<TableTabSearch>(
    () => ({
      dir: routeSearch.dir,
      filters: routeSearch.filters,
      sort: routeSearch.sort,
      view: routeSearch.view,
    }),
    [routeSearch.dir, routeSearch.filters, routeSearch.sort, routeSearch.view],
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
      if (currentTableName === null) {
        if (routeSearch.empty === "true") {
          const result = openNewViewTab(currentState.tabs);
          if (
            tabsMatch(result.tabs, currentState.tabs) === true &&
            currentState.activeTabId === NEW_VIEW_TAB_ID
          ) {
            return currentState;
          }

          return { ...currentState, tabs: result.tabs, activeTabId: NEW_VIEW_TAB_ID };
        }

        return currentState.activeTabId === null
          ? currentState
          : { ...currentState, activeTabId: null };
      }

      const tabsWithoutNewView = currentState.tabs.filter((tab) => tab.kind !== "newView");
      const result = reconcileTableTab({
        activeTabId: currentState.activeTabId,
        createId: createViewId,
        search: currentSearch,
        tableName: currentTableName,
        tabs: tabsWithoutNewView,
      });
      const activeTableTab = result.tabs.find(
        (tab): tab is TableDataTab => tab.kind === "table" && tab.id === result.activeTabId,
      );
      const recentViews =
        activeTableTab === undefined
          ? currentState.recentViews
          : recordRecentTableView(currentState.recentViews, activeTableTab);
      if (
        tabsMatch(result.tabs, currentState.tabs) === true &&
        tabsMatch(recentViews, currentState.recentViews) === true &&
        currentState.activeTabId === result.activeTabId
      ) {
        return currentState;
      }

      return { tabs: result.tabs, recentViews, activeTabId: result.activeTabId };
    });
  }, [currentSearch, currentTableName, routeSearch.empty]);

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
      const result = openBaseTableTabs(state.tabs, orderedTableNames);
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
    [navigateToTab, state.tabs],
  );

  const openRecentView = useCallback(
    (view: TableDataTab) => {
      const tabs =
        state.activeTabId === NEW_VIEW_TAB_ID
          ? replaceNewViewTab(state.tabs, view)
          : replaceNewViewTab(
              state.tabs.filter((tab) => tab.kind !== "newView"),
              view,
            );
      setState({
        tabs,
        recentViews: recordRecentTableView(state.recentViews, view),
        activeTabId: view.id,
      });
      navigateToTab(view);
    },
    [navigateToTab, state.activeTabId, state.recentViews, state.tabs],
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
      reorderTabs,
    }),
    [
      activateTab,
      closeTab,
      openBaseTabs,
      openNewView,
      openRecentView,
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
