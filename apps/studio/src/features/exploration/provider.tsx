import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import type { ConnectionCredentials } from '@inspektor/core/connection'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Effect } from 'effect'
import type { Exploration } from '@inspektor/core/workbench/exploration'
import type { PreparationPolicy, QueryDiagnosis } from '@inspektor/core/query'
import type { TableRowsSearchState } from '@tables/tableTypes'

import { SchemaCatalogueLoadError } from '@app/connections/connectionValidation'
import { fetchConnectionSchemaCatalogueWithRetry } from '@app/connections/connectionEntry'
import { getCredentialSafeConnectionReturnUrl } from '@app/routing/credentialSafeUrl'
import { appRoutes } from '@app/routing/appRoutes'

type ConnectionFailure = SchemaCatalogueLoadError['reason']
export type StudioExploration = Exploration<ConnectionFailure>
const ExplorationContext = createContext<StudioExploration | null>(null)

/** Browser and router effects are ports. Core owns query lifetime and recovery decisions. */
export function ExplorationProvider({
  children,
  exploration,
  client,
  schema,
  targetKey,
  connectionId,
  connection,
  replaceRuntime,
}: PropsWithChildren<{
  exploration: StudioExploration
  client: JazzClient | null
  schema: WasmSchema | null
  targetKey: string
  connectionId: string
  connection: ConnectionCredentials | null
  replaceRuntime: () => void
}>) {
  const origin = useRouterState({ select: (state) => state.location.href })
  const navigate = useNavigate()
  useLayoutEffect(
    () =>
      exploration.connect({
        targetKey,
        origin,
        client,
        schema,
        replaceRuntime,
        diagnose: () =>
          Effect.tryPromise({
            try: async (signal): Promise<QueryDiagnosis<ConnectionFailure>> => {
              if (connection === null) throw new Error('Connection is unavailable.')
              try {
                await fetchConnectionSchemaCatalogueWithRetry(connection, signal)
                return { status: 'reachable' }
              } catch (error) {
                if (error instanceof SchemaCatalogueLoadError) {
                  return { status: 'connectionFailure', reason: error.reason }
                }
                throw error
              }
            },
            catch: (error) => error,
          }),
        repair: (reason) =>
          Effect.tryPromise({
            try: () =>
              navigate({
                to: appRoutes.editConnection,
                params: { connectionId },
                search: {
                  recovery: reason,
                  returnTo: getCredentialSafeConnectionReturnUrl(origin, connectionId) ?? undefined,
                },
                replace: true,
              }),
            catch: (error) => error,
          }),
      }),
    [
      client,
      connection,
      connectionId,
      exploration,
      navigate,
      origin,
      replaceRuntime,
      schema,
      targetKey,
    ],
  )
  return <ExplorationContext value={exploration}>{children}</ExplorationContext>
}

export function useExploration(): StudioExploration {
  const exploration = useContext(ExplorationContext)
  if (exploration === null) throw new Error('Exploration requires ExplorationProvider')
  return exploration
}

export function useExplorationState() {
  const exploration = useExploration()
  return useSyncExternalStore(
    exploration.subscribe,
    exploration.getSnapshot,
    exploration.getSnapshot,
  )
}

/** Workspace destinations supply route commits, not query acquisition or diagnosis steps. */
export function useExplorationNavigation() {
  const exploration = useExploration()
  const state = useExplorationState()
  const prepare = useCallback(
    (
      options: {
        tableName: string
        search: TableRowsSearchState
        policy: PreparationPolicy
      },
      commit: () => Promise<void> | void,
    ) =>
      exploration.navigate({
        intent: { ...options.search, tableName: options.tableName },
        policy: options.policy,
        commit,
      }),
    [exploration],
  )
  return {
    prepare,
    cancel: exploration.cancelNavigation,
    pendingTableName: state.pendingTableName,
  }
}
