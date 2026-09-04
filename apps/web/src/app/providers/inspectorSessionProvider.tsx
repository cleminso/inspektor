import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react'
import { useBlocker, useNavigate, useParams, useRouterState } from '@tanstack/react-router'

import {
  getConnectionDisplayName,
  type ConnectionDraft,
  type StoredConnection,
} from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'
import { resolveTablesNavigationTarget } from '@app/routing/inspectorNavigation'
import { useInspectorSession } from '@app/session/useInspectorSession'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import {
  RuntimeScopeExitGuardProvider,
  useRuntimeScopeExitGuard,
} from '@app/providers/runtimeScopeExitGuard'

/**
 * Accepted connection intent and persisted runtime selection that are safe to use before a Jazz
 * client exists.
 *
 * UI components originate intent. This boundary decides whether a runtime-scope change is safe,
 * requests connection navigation, and persists branch or schema selection. Connection-entry
 * discovery belongs to the route loader; active connectivity belongs to `InspectorProvider`.
 */
export interface InspectorSessionContextValue {
  connections: StoredConnection[]
  activeConnection: StoredConnection | null
  currentConnectionId: string | null
  currentBranch: string | null
  currentSchemaHash: string | null
  currentTableName: string | null
  runtimeScopeExitBlocked: boolean
  connectionLabel: string | null
  rememberedBranches: string[]
  /** Requests the canonical connection route without resolving or persisting its runtime target. */
  openConnection: (connectionId: string) => ConnectionOpenResult
  /** Resolves and persists a branch selection for the mounted connection without route entry. */
  switchBranch: (branch: string, knownSchemaHashes?: readonly string[]) => Promise<void>
  /** Persists a caller-selected schema without repeating discovery. */
  switchSchema: (schemaHash: string) => void
  saveConnectionWithContext: (
    draft: ConnectionDraft,
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) => ConnectionOpenResult
  deleteConnection: ReturnType<typeof useInspectorSession>['deleteConnection']
  getConnectionPreferences: ReturnType<typeof useInspectorSession>['getConnectionPreferences']
  setConnectionContext: (
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) => ConnectionOpenResult
}

type ConnectionOpenResult = 'accepted' | 'blocked'

const InspectorSessionContext = createContext<InspectorSessionContextValue | null>(null)

/**
 * Owns accepted connection intent, persisted selection, and runtime-scope exit policy.
 *
 * It stays above every route so onboarding can run without Jazz and so TanStack Router history
 * navigation cannot bypass workspace-owned mutation blockers. Remote connection-entry resolution
 * remains in the connection route loader.
 */
export function InspectorSessionProvider({ children }: PropsWithChildren): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <InspectorSessionProviderValue>{children}</InspectorSessionProviderValue>
    </RuntimeScopeExitGuardProvider>
  )
}

/** Projects route identity and pending matches into persisted, router-blocked session commands. */
function InspectorSessionProviderValue({ children }: PropsWithChildren): React.ReactElement {
  const session = useInspectorSession()
  const runtimeScopeExitGuard = useRuntimeScopeExitGuard()
  const runtimeScopeExitGuardRef = useRef(runtimeScopeExitGuard)
  runtimeScopeExitGuardRef.current = runtimeScopeExitGuard
  const navigate = useNavigate()
  const routeParams = useParams({ strict: false })
  const isLiveQueriesRoute = useRouterState({
    select: (state) =>
      state.matches.some((candidate) => candidate.routeId === '/conn/$connectionId/live-queries'),
  })
  const schemaNavigationOrigin =
    routeParams.tableName !== undefined
      ? '/conn/$connectionId/tables/$tableName/'
      : isLiveQueriesRoute === true
        ? appRoutes.liveQueries
        : appRoutes.tables
  const navigateSchema = useNavigate({ from: schemaNavigationOrigin })
  const routeConnectionId = routeParams.connectionId ?? null
  const currentConnectionId = routeConnectionId ?? session.activeConnectionId
  const currentTableName = routeParams.tableName ?? null
  const activeConnection =
    routeConnectionId !== null ? session.getConnection(routeConnectionId) : session.activeConnection
  const activeConnectionIdRef = useRef(activeConnection?.id ?? null)
  activeConnectionIdRef.current = activeConnection?.id ?? null
  const branchRequestRef = useRef(0)
  const connectionPreferences =
    activeConnection === null ? null : session.getConnectionPreferences(activeConnection.id)
  const currentBranch = connectionPreferences?.lastBranch ?? null
  const currentSchemaHash = connectionPreferences?.lastSchemaHash ?? null
  const currentBranchRef = useRef(currentBranch)
  const currentSchemaHashRef = useRef(currentSchemaHash)
  currentBranchRef.current = currentBranch
  currentSchemaHashRef.current = currentSchemaHash

  useBlocker({
    enableBeforeUnload: false,
    shouldBlockFn: ({ next }) => {
      const nextConnectionId = 'connectionId' in next.params ? next.params.connectionId : null
      return (
        runtimeScopeExitGuard.isBlocked() === true &&
        (nextConnectionId !== currentConnectionId ||
          next.fullPath.startsWith(appRoutes.tables) === false)
      )
    },
  })

  const openConnection = useCallback(
    (connectionId: string): ConnectionOpenResult => {
      if (connectionId !== currentConnectionId && runtimeScopeExitGuard.isBlocked() === true) {
        return 'blocked'
      }

      void prepareJazzWasm()
      void navigate({
        to: appRoutes.tables,
        params: { connectionId },
        search: (previous) => ({ ...previous, schema: undefined }),
      })
      return 'accepted'
    },
    [currentConnectionId, navigate, runtimeScopeExitGuard],
  )

  const switchBranch = useCallback(
    async (branch: string, knownSchemaHashes?: readonly string[]) => {
      if (
        activeConnection === null ||
        branch === currentBranch ||
        runtimeScopeExitGuardRef.current.isBlocked() === true
      ) {
        return
      }

      const requestId = branchRequestRef.current + 1
      branchRequestRef.current = requestId
      const nextTarget = await resolveTablesNavigationTarget({
        connectionId: activeConnection.id,
        branchOverride: branch,
        schemaHashOverride: currentSchemaHash,
        getConnection: session.getConnection,
        resolveBranch: session.resolveBranch,
        resolveSchemaHash: session.resolveSchemaHash,
        knownSchemaHashes,
      })
      if (
        nextTarget === null ||
        branchRequestRef.current !== requestId ||
        activeConnectionIdRef.current !== activeConnection.id ||
        currentBranchRef.current !== currentBranch ||
        currentSchemaHashRef.current !== currentSchemaHash ||
        runtimeScopeExitGuardRef.current.isBlocked() === true
      ) {
        return
      }

      session.setConnectionContext(activeConnection.id, nextTarget.branch, nextTarget.schemaHash)
    },
    [activeConnection, currentBranch, currentSchemaHash, session],
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

      session.setConnectionContext(activeConnection.id, currentBranch, schemaHash)
      void navigateSchema({
        replace: true,
        resetScroll: false,
        search: (previous) => ({ ...previous, schema: schemaHash }),
      })
    },
    [
      activeConnection,
      currentBranch,
      currentSchemaHash,
      navigateSchema,
      runtimeScopeExitGuard,
      session,
    ],
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
      void prepareJazzWasm()
      session.saveConnectionWithContext(draft, connectionId, branch, schemaHash)
      return 'accepted'
    },
    [runtimeScopeExitGuard, session],
  )

  const value = useMemo<InspectorSessionContextValue>(
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
      switchBranch,
      switchSchema,
      saveConnectionWithContext,
      deleteConnection: session.deleteConnection,
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
      switchBranch,
      switchSchema,
    ],
  )

  return (
    <InspectorSessionContext.Provider value={value}>{children}</InspectorSessionContext.Provider>
  )
}

/** Returns session-level state for screens that do not require a Jazz client. */
export function useInspectorSessionContext(): InspectorSessionContextValue {
  const context = useContext(InspectorSessionContext)
  if (context === null) {
    throw new Error('useInspectorSessionContext must be used within InspectorSessionProvider')
  }

  return context
}
