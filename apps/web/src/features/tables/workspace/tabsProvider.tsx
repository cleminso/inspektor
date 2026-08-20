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
import { AlertDialog, Button } from "@inspector/ds";

import { useInspectorSessionState } from "@app/providers/inspectorProvider";
import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createBaseTableTabId,
  createTableTabRouteSearch,
  createSchemaTableTabId,
  getFinalTableTabName,
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
import { useTableMutationWorkspace } from "@tables/mutationLedger/provider";
import { createTableMutationScopeKey } from "@tables/mutationLedger/scope";

interface RouteSearch extends TableTabsRouteSearch {
  tab?: string;
}

interface TableTabsContextValue {
  activeTabId: string | null;
  recentViews: readonly TableDataTab[];
  replaceableTabId: string | null;
  tabs: readonly TableTab[];
  activateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  openBaseTabs: (orderedTableNames: readonly string[]) => void;
  openNewView: () => void;
  openRecentView: (view: TableDataTab) => void;
  openSchemaView: (tableName: string) => void;
  persistTab: (tabId: string) => void;
  persistTable: (tableName: string) => void;
  reorderTabs: (orderedTabIds: readonly string[]) => void;
}

const TableTabsContext = createContext<TableTabsContextValue | null>(null);

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
  replaceableTabId: string | null;
}

interface PendingTabClose {
  changeCount: number;
  tableName: string;
  tabId: string;
}

export function TableTabsProvider({ children, scope }: TableTabsProviderProps): React.ReactElement {
  const { currentConnectionId, currentTableName } = useInspectorSessionState();
  const navigate = useNavigate({ from: appRoutes.tables });
  const routeSearch = useSearch({ strict: false }) as RouteSearch;
  const { isSchemaReady, tables: availableTables } = useAvailableTables();
  const mutationWorkspace = useTableMutationWorkspace();
  const [pendingTabClose, setPendingTabClose] = useState<PendingTabClose | null>(null);
  const [state, setState] = useState<TableTabsProviderState>(() => ({
    ...loadTableTabsState(scope),
    activeTabId: null,
    replaceableTabId: null,
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
    saveTableTabsState(scope, {
      tabs: state.tabs.filter((tab) => tab.id !== state.replaceableTabId),
      recentViews: state.recentViews,
    });
  }, [scope, state.recentViews, state.replaceableTabId, state.tabs]);

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
          : {
              ...sanitizedTabsState,
              activeTabId: currentState.activeTabId,
              replaceableTabId:
                sanitizedTabsState.tabs.some(
                  (tab) => tab.id === currentState.replaceableTabId,
                ) === true
                  ? currentState.replaceableTabId
                  : null,
            };
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
        replaceableTabId: sanitizedState.replaceableTabId,
        search: currentSearch,
        tableName: currentTableName,
        tabs: sanitizedState.tabs,
      });
      const destinationWasOpen = sanitizedState.tabs.some(
        (tab) =>
          tab.kind === "table" &&
          tab.tableName === currentTableName &&
          (tab.search.view === "schema") === (currentSearch.view === "schema"),
      );
      const replaceableTabId =
        currentSearch.view === "schema" || destinationWasOpen === true
          ? sanitizedState.replaceableTabId
          : result.activeTabId;
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
        sanitizedState.activeTabId === result.activeTabId &&
        sanitizedState.replaceableTabId === replaceableTabId
      ) {
        return sanitizedState;
      }

      return {
        tabs: result.tabs,
        recentViews,
        activeTabId: result.activeTabId,
        replaceableTabId,
      };
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

  const closeTabWithoutConfirmation = useCallback(
    (tabId: string) => {
      const result = closeTableTab(state.tabs, tabId);
      if (tabId !== state.activeTabId) {
        setState((currentState) => ({
          ...currentState,
          tabs: result.tabs,
          replaceableTabId:
            currentState.replaceableTabId === tabId ? null : currentState.replaceableTabId,
        }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        tabs: result.tabs,
        activeTabId: result.nextActiveTab?.id ?? null,
        replaceableTabId:
          currentState.replaceableTabId === tabId ? null : currentState.replaceableTabId,
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

  const closeTab = useCallback(
    (tabId: string) => {
      const finalTableName = getFinalTableTabName(state.tabs, tabId);
      if (finalTableName !== null) {
        const scopeKey = createTableMutationScopeKey(scope, finalTableName);
        if (mutationWorkspace.hasPendingChanges(scopeKey) === true) {
          const tab = state.tabs.find((candidate) => candidate.id === tabId);
          if (tab !== undefined && tabId !== state.activeTabId) {
            navigateToTab(tab);
          }
          setPendingTabClose({
            changeCount: mutationWorkspace.getPendingChangeCount(scopeKey),
            tableName: finalTableName,
            tabId,
          });
          return;
        }
      }
      closeTabWithoutConfirmation(tabId);
    }, [
      closeTabWithoutConfirmation,
      mutationWorkspace,
      navigateToTab,
      scope,
      state.activeTabId,
      state.tabs,
    ],
  );

  const discardPendingChangesAndCloseTab = useCallback(() => {
    if (pendingTabClose === null) {
      return;
    }
    mutationWorkspace.discardPendingChanges(
      createTableMutationScopeKey(scope, pendingTabClose.tableName),
    );
    closeTabWithoutConfirmation(pendingTabClose.tabId);
    setPendingTabClose(null);
  }, [closeTabWithoutConfirmation, mutationWorkspace, pendingTabClose, scope]);

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
        replaceableTabId:
          orderedTableNames.some(
            (tableName) => createBaseTableTabId(tableName) === currentState.replaceableTabId,
          ) === true
            ? null
            : currentState.replaceableTabId,
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
        replaceableTabId: state.replaceableTabId === view.id ? null : state.replaceableTabId,
      });
      navigateToTab(view);
    },
    [navigateToTab, state.recentViews, state.replaceableTabId, state.tabs],
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

  const persistTab = useCallback((tabId: string) => {
    setState((currentState) =>
      currentState.replaceableTabId === tabId
        ? { ...currentState, replaceableTabId: null }
        : currentState,
    );
  }, []);

  const persistTable = useCallback((tableName: string) => {
    const tabId = createBaseTableTabId(tableName);
    setState((currentState) => {
      if (currentState.tabs.some((tab) => tab.id === tabId)) {
        return currentState.replaceableTabId === tabId
          ? { ...currentState, replaceableTabId: null }
          : currentState;
      }

      const result = reconcileTableTab({
        activeTabId: currentState.activeTabId,
        replaceableTabId: currentState.replaceableTabId,
        search: {},
        tableName,
        tabs: currentState.tabs,
      });
      return {
        ...currentState,
        activeTabId: result.activeTabId,
        tabs: result.tabs,
        replaceableTabId: null,
      };
    });
  }, []);

  const value = useMemo<TableTabsContextValue>(
    () => ({
      activeTabId: state.activeTabId,
      recentViews: state.recentViews,
      replaceableTabId: state.replaceableTabId,
      tabs: state.tabs,
      activateTab,
      closeTab,
      openBaseTabs,
      openNewView,
      openRecentView,
      openSchemaView,
      persistTab,
      persistTable,
      reorderTabs,
    }),
    [
      activateTab,
      closeTab,
      openBaseTabs,
      openNewView,
      openRecentView,
      openSchemaView,
      persistTab,
      persistTable,
      reorderTabs,
      state,
    ],
  );

  const stagedChangeLabel = pendingTabClose?.changeCount === 1 ? "change" : "changes";

  return (
    <TableTabsContext.Provider value={value}>
      {children}
      <AlertDialog.Root
        open={pendingTabClose !== null}
        onOpenChange={(open) => {
          if (open === false) {
            setPendingTabClose(null);
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Discard staged changes?</AlertDialog.Title>
          <AlertDialog.Description>
            {pendingTabClose === null
              ? null
              : `Closing the final ${pendingTabClose.tableName} view will discard ${pendingTabClose.changeCount} staged ${stagedChangeLabel}. This cannot be undone.`}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Keep editing</AlertDialog.Close>
            <Button variant="danger" onClick={discardPendingChangesAndCloseTab}>
              Discard and close
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </TableTabsContext.Provider>
  );
}

export function useTableTabs(): TableTabsContextValue {
  const context = use(TableTabsContext);
  if (context === null) {
    throw new Error("useTableTabs must be used within TableTabsProvider");
  }

  return context;
}
