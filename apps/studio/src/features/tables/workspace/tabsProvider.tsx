import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AlertDialog, Button, toasts } from '@inspektor/ds'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createBaseTableTabId,
  createRouteTableTabId,
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
  tableTabStatesMatch,
  type TableDataTab,
  type TableTab,
  type TableTabSearch,
  type TableTabsState,
  type TableTabsRouteSearch,
} from '@tables/workspace/tabs'
import { appRoutes } from '@app/routing/appRoutes'
import { resolveTableRowsSearch, toTableTabSearch } from '@tables/routing/tableRowsSearch'
import { useTableNavigationPreparation } from '@tables/routing/tableNavigationPreparation'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { useTableMutationWorkspace } from '@tables/mutationLedger/provider'
import { createTableScope } from '@tables/workspace/scope'

interface TableTabsContextValue {
  activeTabId: string | null
  pendingTableName: string | null
  recentViews: readonly TableDataTab[]
  replaceableTabId: string | null
  scope: string
  tabs: readonly TableTab[]
  activateTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  openBaseTabs: (orderedTableNames: readonly string[]) => void
  openTable: (tableName: string, search: TableTabSearch) => void
  openNewView: () => void
  openRecentView: (view: TableDataTab) => void
  openSchemaView: (tableName: string) => void
  persistTab: (tabId: string) => void
  persistTable: (tableName: string) => void
  reorderTabs: (orderedTabIds: readonly string[]) => void
}

const TableTabsContext = createContext<TableTabsContextValue | null>(null)

interface TableTabsProviderProps {
  children: ReactNode
  scope: string
}

interface TableTabsProviderState extends TableTabsState {
  replaceableTabId: string | null
}

interface PendingTabClose {
  tableName: string
  tabId: string
}

export function TableTabsProvider({ children, scope }: TableTabsProviderProps): React.ReactElement {
  const { currentConnectionId, currentTableName } = useInspectorSessionState()
  const { cancel: cancelPreparation, pendingTableName, prepare } = useTableNavigationPreparation()
  const navigate = useNavigate({ from: appRoutes.tables })
  const routeSearch = useSearch({ strict: false }) as TableTabsRouteSearch
  const { isSchemaReady, tables: availableTables } = useAvailableTables()
  const mutationWorkspace = useTableMutationWorkspace()
  const [pendingTabClose, setPendingTabClose] = useState<PendingTabClose | null>(null)
  const [state, setState] = useState<TableTabsProviderState>(() => ({
    ...loadTableTabsState(scope),
    replaceableTabId: null,
  }))
  const currentSearch = useMemo<TableTabSearch>(() => toTableTabSearch(routeSearch), [routeSearch])
  const activeTabId = createRouteTableTabId(currentTableName, routeSearch)
  const previousActiveTabIdRef = useRef(activeTabId)
  useEffect(() => {
    saveTableTabsState(scope, {
      tabs: state.tabs.filter((tab) => tab.id !== state.replaceableTabId),
      recentViews: state.recentViews,
    })
  }, [scope, state.recentViews, state.replaceableTabId, state.tabs])

  useEffect(() => {
    const sourceTabId = previousActiveTabIdRef.current
    previousActiveTabIdRef.current = activeTabId
    setState((currentState) => {
      const sanitizedTabsState =
        isSchemaReady === true
          ? sanitizeTableTabsState(currentState, availableTables)
          : currentState
      const sanitizedState =
        sanitizedTabsState === currentState
          ? currentState
          : {
              ...sanitizedTabsState,
              replaceableTabId:
                sanitizedTabsState.tabs.some((tab) => tab.id === currentState.replaceableTabId) ===
                true
                  ? currentState.replaceableTabId
                  : null,
            }
      if (currentTableName === null) {
        if (routeSearch.empty === 'true') {
          const tabs = openNewViewTab(sanitizedState.tabs)
          if (tableTabStatesMatch(tabs, sanitizedState.tabs) === true) {
            return sanitizedState
          }

          return { ...sanitizedState, tabs }
        }

        return sanitizedState
      }

      if (isSchemaReady === true && availableTables.includes(currentTableName) === false) {
        return sanitizedState
      }

      const result = reconcileTableTab({
        replaceableTabId: sanitizedState.replaceableTabId,
        search: currentSearch,
        sourceTabId,
        tableName: currentTableName,
        tabs: sanitizedState.tabs,
      })
      const destinationWasOpen = sanitizedState.tabs.some(
        (tab) =>
          tab.kind === 'table' &&
          tab.tableName === currentTableName &&
          (tab.search.view === 'schema') === (currentSearch.view === 'schema'),
      )
      const replaceableTabId =
        sourceTabId === NEW_VIEW_TAB_ID ||
        currentSearch.view === 'schema' ||
        destinationWasOpen === true
          ? sanitizedState.replaceableTabId
          : result.destinationTabId
      const activeTableTab = result.tabs.find(
        (tab): tab is TableDataTab => tab.kind === 'table' && tab.id === result.destinationTabId,
      )
      const recentViews =
        activeTableTab === undefined
          ? sanitizedState.recentViews
          : recordRecentTableView(sanitizedState.recentViews, activeTableTab)
      if (
        tableTabStatesMatch(result.tabs, sanitizedState.tabs) === true &&
        tableTabStatesMatch(recentViews, sanitizedState.recentViews) === true &&
        sanitizedState.replaceableTabId === replaceableTabId
      ) {
        return sanitizedState
      }

      return {
        tabs: result.tabs,
        recentViews,
        replaceableTabId,
      }
    })
  }, [
    activeTabId,
    availableTables,
    currentSearch,
    currentTableName,
    isSchemaReady,
    routeSearch.empty,
  ])

  useEffect(() => {
    if (
      currentConnectionId === null ||
      currentTableName === null ||
      isSchemaReady === false ||
      availableTables.includes(currentTableName) === true
    ) {
      return
    }

    void navigate({
      to: appRoutes.tables,
      params: { connectionId: currentConnectionId },
      replace: true,
      search: { empty: 'true' },
    })
  }, [availableTables, currentConnectionId, currentTableName, isSchemaReady, navigate])

  const navigateToTab = useCallback(
    (tab: TableTab) => {
      if (currentConnectionId === null) {
        return
      }

      const search = createTableTabRouteSearch(tab)

      if (tab.kind === 'newView') {
        cancelPreparation()
        void navigate({
          to: appRoutes.tables,
          params: { connectionId: currentConnectionId },
          search,
        })
        return
      }
      if (tab.search.view === 'schema') {
        cancelPreparation()
        void navigate({
          to: appRoutes.table,
          params: { connectionId: currentConnectionId, tableName: tab.tableName },
          search,
        })
        return
      }

      const commitNavigation = () =>
        navigate({
          to: appRoutes.table,
          params: {
            connectionId: currentConnectionId,
            tableName: tab.tableName,
          },
          search,
        })
      void prepare(
        {
          policy: 'replace',
          search: resolveTableRowsSearch(tab.search),
          tableName: tab.tableName,
        },
        commitNavigation,
      ).catch(() => toasts.error("Couldn't open table"))
    },
    [cancelPreparation, currentConnectionId, navigate, prepare],
  )

  const openTable = useCallback(
    (tableName: string, search: TableTabSearch) => {
      navigateToTab({
        kind: 'table',
        id: createBaseTableTabId(tableName),
        tableName,
        search,
      })
    },
    [navigateToTab],
  )

  const activateTab = useCallback(
    (tabId: string) => {
      const tab = state.tabs.find((candidate) => candidate.id === tabId)
      if (tab !== undefined) {
        navigateToTab(tab)
      }
    },
    [navigateToTab, state.tabs],
  )

  const closeTabWithoutConfirmation = useCallback(
    (tabId: string) => {
      const result = closeTableTab(state.tabs, tabId)
      setState((currentState) => ({
        ...currentState,
        tabs: result.tabs,
        replaceableTabId:
          currentState.replaceableTabId === tabId ? null : currentState.replaceableTabId,
      }))
      if (tabId !== activeTabId) {
        return
      }

      if (result.nextActiveTab !== null) {
        navigateToTab(result.nextActiveTab)
        return
      }

      if (currentConnectionId !== null) {
        void navigate({
          to: appRoutes.tables,
          params: {
            connectionId: currentConnectionId,
          },
          search: { empty: 'true' },
        })
      }
    },
    [activeTabId, currentConnectionId, navigate, navigateToTab, state.tabs],
  )

  const closeTab = useCallback(
    (tabId: string) => {
      const finalTableName = getFinalTableTabName(state.tabs, tabId)
      if (finalTableName !== null) {
        const scopeKey = createTableScope(scope, finalTableName)
        if (mutationWorkspace.hasPendingChanges(scopeKey) === true) {
          setPendingTabClose({
            tableName: finalTableName,
            tabId,
          })
          return
        }
      }
      closeTabWithoutConfirmation(tabId)
    },
    [closeTabWithoutConfirmation, mutationWorkspace, scope, state.tabs],
  )

  const discardPendingChangesAndCloseTab = useCallback(() => {
    if (pendingTabClose === null) {
      return
    }
    if (getFinalTableTabName(state.tabs, pendingTabClose.tabId) === null) {
      closeTabWithoutConfirmation(pendingTabClose.tabId)
      setPendingTabClose(null)
      return
    }
    if (
      mutationWorkspace.discardPendingChanges(
        createTableScope(scope, pendingTabClose.tableName),
      ) === false
    ) {
      return
    }
    closeTabWithoutConfirmation(pendingTabClose.tabId)
    setPendingTabClose(null)
  }, [closeTabWithoutConfirmation, mutationWorkspace, pendingTabClose, scope, state.tabs])

  const openNewView = useCallback(() => {
    const tabs = openNewViewTab(state.tabs)
    setState((currentState) => ({
      ...currentState,
      tabs,
    }))
    navigateToTab({ kind: 'newView', id: NEW_VIEW_TAB_ID })
  }, [navigateToTab, state.tabs])

  const openBaseTabs = useCallback(
    (orderedTableNames: readonly string[]) => {
      const sourceTabs =
        activeTabId === NEW_VIEW_TAB_ID
          ? state.tabs.filter((tab) => tab.kind !== 'newView')
          : state.tabs
      const result = openBaseTableTabs(sourceTabs, orderedTableNames)
      if (result.activeTabId === null) {
        return
      }

      const activeTab = result.tabs.find((tab) => tab.id === result.activeTabId)
      if (activeTab === undefined) {
        return
      }

      setState((currentState) => ({
        ...currentState,
        tabs: result.tabs,
        replaceableTabId:
          orderedTableNames.some(
            (tableName) => createBaseTableTabId(tableName) === currentState.replaceableTabId,
          ) === true
            ? null
            : currentState.replaceableTabId,
      }))
      navigateToTab(activeTab)
    },
    [activeTabId, navigateToTab, state.tabs],
  )

  const openRecentView = useCallback(
    (view: TableDataTab) => {
      const tabs = replaceNewViewTab(state.tabs, view)
      setState({
        tabs,
        recentViews: recordRecentTableView(state.recentViews, view),
        replaceableTabId: state.replaceableTabId === view.id ? null : state.replaceableTabId,
      })
      navigateToTab(view)
    },
    [navigateToTab, state.recentViews, state.replaceableTabId, state.tabs],
  )

  const openSchemaView = useCallback(
    (tableName: string) => {
      const schemaTab: TableDataTab = {
        kind: 'table',
        id: createSchemaTableTabId(tableName),
        tableName,
        search: { view: 'schema' },
      }
      navigateToTab(schemaTab)
    },
    [navigateToTab],
  )

  const reorderTabs = useCallback((orderedTabIds: readonly string[]) => {
    setState((currentState) => ({
      ...currentState,
      tabs: reorderTableTabs(currentState.tabs, orderedTabIds),
    }))
  }, [])

  const persistTab = useCallback((tabId: string) => {
    setState((currentState) =>
      currentState.replaceableTabId === tabId
        ? { ...currentState, replaceableTabId: null }
        : currentState,
    )
  }, [])

  const persistTable = useCallback(
    (tableName: string) => {
      const tabId = createBaseTableTabId(tableName)
      setState((currentState) => {
        if (currentState.tabs.some((tab) => tab.id === tabId)) {
          return currentState.replaceableTabId === tabId
            ? { ...currentState, replaceableTabId: null }
            : currentState
        }

        const result = reconcileTableTab({
          replaceableTabId: currentState.replaceableTabId,
          search: {},
          sourceTabId: activeTabId,
          tableName,
          tabs: currentState.tabs,
        })
        return {
          ...currentState,
          tabs: result.tabs,
          replaceableTabId: null,
        }
      })
    },
    [activeTabId],
  )

  const value = useMemo<TableTabsContextValue>(
    () => ({
      activeTabId,
      pendingTableName,
      recentViews: state.recentViews,
      replaceableTabId: state.replaceableTabId,
      scope,
      tabs: state.tabs,
      activateTab,
      closeTab,
      openBaseTabs,
      openTable,
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
      openTable,
      openNewView,
      openRecentView,
      openSchemaView,
      persistTab,
      persistTable,
      reorderTabs,
      activeTabId,
      pendingTableName,
      scope,
      state,
    ],
  )

  return (
    <TableTabsContext.Provider value={value}>
      {children}
      <AlertDialog.Root
        open={pendingTabClose !== null}
        onOpenChange={(open) => {
          if (open === false) {
            setPendingTabClose(null)
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Discard staged changes?</AlertDialog.Title>
          <AlertDialog.Description>
            {pendingTabClose === null
              ? null
              : `Closing the final ${pendingTabClose.tableName} view will discard any staged changes. This cannot be undone.`}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Keep editing</AlertDialog.Close>
            <Button
              variant="danger"
              onClick={discardPendingChangesAndCloseTab}
            >
              Discard and close
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </TableTabsContext.Provider>
  )
}

export function useTableTabs(): TableTabsContextValue {
  const context = use(TableTabsContext)
  if (context === null) {
    throw new Error('useTableTabs must be used within TableTabsProvider')
  }

  return context
}

export function useOptionalTableTabs(): TableTabsContextValue | null {
  return use(TableTabsContext)
}
