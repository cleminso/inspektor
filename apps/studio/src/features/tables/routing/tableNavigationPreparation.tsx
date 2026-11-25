import { createContext, use, useCallback, useLayoutEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Effect } from 'effect'
import { canonicalQuery } from '@inspektor/core/jazz/query'
import {
  createTableNavigationPreparation,
  type PreparationPolicy,
  type PreparationResult,
  type QueryDiagnosis,
} from '@inspektor/core/query'

import {
  useInspectorSessionState,
  useRuntimeClient,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import { SchemaCatalogueLoadError } from '@app/connections/connectionValidation'
import { appRoutes } from '@app/routing/appRoutes'
import { getCredentialSafeConnectionReturnUrl } from '@app/routing/credentialSafeUrl'
import { fetchConnectionSchemaCatalogueWithRetry } from '@app/routing/inspectorNavigation'
import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { buildTableRowsQuery } from '@tables/query/tableRowsQuery'
import type { TableRowsSearchState } from '@tables/tableTypes'

interface PrepareTableNavigationOptions {
  policy: PreparationPolicy
  search: TableRowsSearchState
  tableName: string
}

interface TableNavigationPreparationContextValue {
  cancel: () => void
  pendingTableName: string | null
  prepare: (
    options: PrepareTableNavigationOptions,
    commit: () => Promise<void> | void,
  ) => Promise<PreparationResult>
}

const TableNavigationPreparationContext =
  createContext<TableNavigationPreparationContextValue | null>(null)

interface TableNavigationPreparationProviderProps {
  children: React.ReactNode
  identity: string
  scope: string
}

export function TableNavigationPreparationProvider({
  children,
  identity,
  scope,
}: TableNavigationPreparationProviderProps): React.ReactElement {
  const { activeConnection } = useInspectorSessionState()
  const client = useRuntimeClient()
  const navigate = useNavigate()
  const wasmSchema = useRuntimeSchema()
  const [pendingTableName, setPendingTableName] = useState<string | null>(null)
  const [preparation] = useState(() =>
    createTableNavigationPreparation<SchemaCatalogueLoadError['reason']>(setPendingTableName),
  )

  const cancelActive = useCallback(() => {
    Effect.runSync(preparation.cancel)
  }, [preparation])

  useLayoutEffect(() => {
    setPendingTableName(null)
    return cancelActive
  }, [activeConnection, client, identity, scope, wasmSchema, cancelActive])

  const prepare = useCallback(
    async (
      options: PrepareTableNavigationOptions,
      commit: () => Promise<void> | void,
    ): Promise<PreparationResult> => {
      if (activeConnection === null || client === null || wasmSchema === null) {
        return 'unavailable'
      }

      const descriptor = canonicalQuery(
        client,
        buildTableRowsQuery({
          ...options.search,
          schema: wasmSchema,
          tableName: options.tableName,
        }),
        INSPEKTOR_QUERY_OPTIONS,
      )
      return Effect.runPromise(
        preparation.prepare({
          policy: options.policy,
          tableName: options.tableName,
          query: Effect.gen(function* () {
            yield* descriptor.acquire()
            yield* descriptor.prepare
          }),
          diagnose: Effect.tryPromise({
            try: async (signal): Promise<QueryDiagnosis<SchemaCatalogueLoadError['reason']>> => {
              try {
                await fetchConnectionSchemaCatalogueWithRetry(activeConnection, signal)
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
                  params: { connectionId: activeConnection.id },
                  search: {
                    recovery: reason,
                    returnTo:
                      getCredentialSafeConnectionReturnUrl(identity, activeConnection.id) ??
                      undefined,
                  },
                  replace: true,
                }),
              catch: (error) => error,
            }),
          commit: Effect.tryPromise({
            try: async () => {
              await commit()
            },
            catch: (error) => error,
          }),
        }),
      )
    },
    [activeConnection, client, identity, navigate, wasmSchema, preparation],
  )

  return (
    <TableNavigationPreparationContext.Provider
      value={{ cancel: cancelActive, pendingTableName, prepare }}
    >
      {children}
    </TableNavigationPreparationContext.Provider>
  )
}

export function useTableNavigationPreparation(): TableNavigationPreparationContextValue {
  const context = use(TableNavigationPreparationContext)
  if (context === null) {
    throw new Error(
      'useTableNavigationPreparation must be used within TableNavigationPreparationProvider',
    )
  }
  return context
}
