import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react'
import { useBlocker, useNavigate, useParams, useSearch } from '@tanstack/react-router'

import {
  getConnectionDisplayName,
  type ConnectionDraft,
  type RuntimeConnection,
  type StoredConnection,
} from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'
import { useStoredConnections } from '@app/connections/useStoredConnections'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import {
  RuntimeScopeExitGuardProvider,
  useRuntimeScopeExitGuard,
} from '@app/providers/runtimeScopeExitGuard'

/**
 * Saved connections, restoration preferences, and guarded navigation commands.
 *
 * UI components originate intent. This boundary decides whether a runtime-scope change is safe,
 * Preferences record accepted selections; they do not select the running client.
 * Connection-entry discovery belongs to the route loader; runtime lifetime stays below it.
 */
export interface ConnectionsContextValue {
  connections: StoredConnection[]
  activeConnection: RuntimeConnection | null
  currentConnectionId: string | null
  currentBranch: string | null
  currentSchemaHash: string | null
  currentTableName: string | null
  runtimeScopeExitBlocked: boolean
  connectionLabel: string | null
  rememberedBranches: string[]
  /** Requests the canonical connection route without resolving or persisting its runtime target. */
  openConnection: (connectionId: string) => ConnectionOpenResult
  /** Requests schema navigation. Only committed entry records the new preference. */
  switchSchema: (schemaHash: string) => void
  saveConnectionWithContext: (
    draft: ConnectionDraft,
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) => ConnectionOpenResult
  deleteConnection: ReturnType<typeof useStoredConnections>['deleteConnection']
  getConnection: ReturnType<typeof useStoredConnections>['getConnection']
  findConnectionByCredentials: ReturnType<
    typeof useStoredConnections
  >['findConnectionByCredentials']
  getConnectionPreferences: ReturnType<typeof useStoredConnections>['getConnectionPreferences']
  setConnectionContext: (
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) => ConnectionOpenResult
}

type ConnectionOpenResult = 'accepted' | 'blocked'

const ConnectionsContext = createContext<ConnectionsContextValue | null>(null)

/**
 * Owns profile adapters, restoration preferences, and runtime-scope exit policy.
 *
 * It stays above every route so onboarding can run without Jazz and so TanStack Router history
 * navigation cannot bypass workspace-owned mutation blockers. Remote connection-entry resolution
 * remains in the connection route loader.
 */
export function ConnectionProvider({ children }: PropsWithChildren): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <ConnectionProviderValue>{children}</ConnectionProviderValue>
    </RuntimeScopeExitGuardProvider>
  )
}

/** Profile commands remain available on onboarding routes, without an active runtime. */
function ConnectionProviderValue({ children }: PropsWithChildren): React.ReactElement {
  const session = useStoredConnections()
  const runtimeScopeExitGuard = useRuntimeScopeExitGuard()
  const navigate = useNavigate()
  const routeParams = useParams({ strict: false })
  const routeSearch = useSearch({ strict: false })
  const schemaNavigationOrigin =
    routeParams.tableName !== undefined
      ? '/conn/$connectionId/tables/$tableName/'
      : appRoutes.tables
  const navigateSchema = useNavigate({ from: schemaNavigationOrigin })
  const routeConnectionId = routeParams.connectionId ?? null
  const currentConnectionId = routeConnectionId ?? session.activeConnectionId
  const currentTableName = routeParams.tableName ?? null
  const activeConnection = useMemo(
    () =>
      routeConnectionId !== null
        ? session.getConnection(routeConnectionId)
        : session.activeConnection,
    [routeConnectionId, session],
  )
  const connectionPreferences =
    activeConnection === null ? null : session.getConnectionPreferences(activeConnection.id)
  const currentBranch = connectionPreferences?.lastBranch ?? null
  const currentSchemaHash = connectionPreferences?.lastSchemaHash ?? null

  useBlocker({
    enableBeforeUnload: false,
    shouldBlockFn: ({ next }) => {
      const nextConnectionId = 'connectionId' in next.params ? next.params.connectionId : null
      const nextSchema = 'schema' in next.search ? next.search.schema : undefined
      return (
        runtimeScopeExitGuard.isBlocked() === true &&
        (nextConnectionId !== currentConnectionId ||
          nextSchema !== routeSearch.schema ||
          next.fullPath.startsWith(appRoutes.tables) === false)
      )
    },
  })

  const openConnection = useCallback(
    (connectionId: string): ConnectionOpenResult => {
      if (connectionId !== currentConnectionId && runtimeScopeExitGuard.isBlocked() === true) {
        return 'blocked'
      }

      if (session.getConnection(connectionId) === null) {
        void navigate({
          to: appRoutes.editConnection,
          params: { connectionId },
        })
        return 'accepted'
      }

      void prepareJazzWasm()
      void navigate({
        to: appRoutes.tables,
        params: { connectionId },
        search: (previous) => ({ ...previous, schema: undefined }),
      })
      return 'accepted'
    },
    [currentConnectionId, navigate, runtimeScopeExitGuard, session],
  )

  const switchSchema = useCallback(
    (schemaHash: string) => {
      if (
        activeConnection === null ||
        currentBranch === null ||
        schemaHash === currentSchemaHash ||
        runtimeScopeExitGuard.isBlocked() === true
      ) {
        return
      }

      void navigateSchema({
        replace: true,
        resetScroll: false,
        search: (previous) => ({ ...previous, schema: schemaHash }),
      })
    },
    [activeConnection, currentBranch, currentSchemaHash, navigateSchema, runtimeScopeExitGuard],
  )
  const setConnectionContext = useCallback(
    (connectionId: string, branch: string, schemaHash: string) => {
      const changesRuntimeScope =
        connectionId !== currentConnectionId ||
        branch !== currentBranch ||
        schemaHash !== currentSchemaHash
      if (changesRuntimeScope === true && runtimeScopeExitGuard.isBlocked() === true) {
        return 'blocked'
      }
      session.setConnectionContext(connectionId, branch, schemaHash)
      return 'accepted'
    },
    [currentBranch, currentConnectionId, currentSchemaHash, runtimeScopeExitGuard, session],
  )
  const saveConnectionWithContext = useCallback(
    (draft: ConnectionDraft, connectionId: string, branch: string, schemaHash: string) => {
      if (runtimeScopeExitGuard.isBlocked() === true) {
        return 'blocked'
      }
      session.saveConnectionWithContext(draft, connectionId, branch, schemaHash)
      return 'accepted'
    },
    [runtimeScopeExitGuard, session],
  )

  const value = useMemo<ConnectionsContextValue>(
    () => ({
      connections: session.connections,
      activeConnection,
      currentConnectionId: activeConnection?.id ?? currentConnectionId,
      currentBranch,
      currentSchemaHash,
      currentTableName,
      runtimeScopeExitBlocked: runtimeScopeExitGuard.isBlocked(),
      connectionLabel:
        activeConnection !== null ? getConnectionDisplayName(activeConnection) : null,
      rememberedBranches:
        activeConnection !== null ? session.getRememberedBranches(activeConnection.id) : [],
      openConnection,
      switchSchema,
      saveConnectionWithContext,
      deleteConnection: session.deleteConnection,
      getConnection: session.getConnection,
      findConnectionByCredentials: session.findConnectionByCredentials,
      getConnectionPreferences: session.getConnectionPreferences,
      setConnectionContext,
    }),
    [
      activeConnection,
      currentBranch,
      currentConnectionId,
      currentSchemaHash,
      currentTableName,
      openConnection,
      runtimeScopeExitGuard,
      session,
      saveConnectionWithContext,
      setConnectionContext,
      switchSchema,
    ],
  )

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
}

/** Saved profile access and navigation commands do not require a Jazz client. */
export function useConnections(): ConnectionsContextValue {
  const context = useContext(ConnectionsContext)
  if (context === null) {
    throw new Error('useConnections must be used within ConnectionProvider')
  }

  return context
}
