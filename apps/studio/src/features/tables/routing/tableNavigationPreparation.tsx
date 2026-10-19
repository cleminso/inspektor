import { createContext, use, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

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
import { prefetchJazzQuery } from '@tables/query/prefetchJazzQuery'
import { buildTableRowsQuery } from '@tables/query/tableRowsQuery'
import type { TableRowsSearchState } from '@tables/tableTypes'

type PreparationPolicy = 'ignore' | 'replace'
type PreparationResult = 'busy' | 'committed' | 'recovery' | 'superseded' | 'unavailable'

interface PrepareTableNavigationOptions {
  policy: PreparationPolicy
  search: TableRowsSearchState
  tableName: string
}

interface ActivePreparation {
  abort: () => void
  cancel: () => void
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
  const activeRef = useRef<ActivePreparation | null>(null)
  const [pendingTableName, setPendingTableName] = useState<string | null>(null)

  const cancelActive = useCallback(() => {
    const active = activeRef.current
    activeRef.current = null
    active?.abort()
    active?.cancel()
    setPendingTableName(null)
  }, [])

  useLayoutEffect(() => {
    setPendingTableName(null)
    return () => {
      const active = activeRef.current
      activeRef.current = null
      active?.abort()
      active?.cancel()
    }
  }, [activeConnection, client, identity, scope, wasmSchema])

  const prepare = useCallback(
    async (
      options: PrepareTableNavigationOptions,
      commit: () => Promise<void> | void,
    ): Promise<PreparationResult> => {
      if (activeRef.current !== null) {
        if (options.policy === 'ignore') return 'busy'
        cancelActive()
      }
      if (activeConnection === null || client === null || wasmSchema === null) {
        return 'unavailable'
      }

      const lease = prefetchJazzQuery(
        client,
        buildTableRowsQuery({
          ...options.search,
          schema: wasmSchema,
          tableName: options.tableName,
        }),
        INSPEKTOR_QUERY_OPTIONS,
      )
      let cancel: () => void = () => undefined
      const abortController = new AbortController()
      const cancelled = new Promise<'superseded'>((resolve) => {
        cancel = () => resolve('superseded')
      })
      const active = { abort: () => abortController.abort(), cancel }
      activeRef.current = active
      setPendingTableName(options.tableName)

      try {
        let readiness: 'ready' | 'superseded'
        try {
          readiness = await Promise.race([lease.promise.then(() => 'ready' as const), cancelled])
        } catch (queryError) {
          if (activeRef.current !== active) {
            return 'superseded'
          }

          try {
            await fetchConnectionSchemaCatalogueWithRetry(activeConnection, abortController.signal)
          } catch (connectionError) {
            if (abortController.signal.aborted === true || activeRef.current !== active) {
              return 'superseded'
            }
            if (connectionError instanceof SchemaCatalogueLoadError) {
              await navigate({
                to: appRoutes.editConnection,
                params: { connectionId: activeConnection.id },
                search: {
                  recovery: connectionError.reason,
                  returnTo:
                    getCredentialSafeConnectionReturnUrl(identity, activeConnection.id) ??
                    undefined,
                },
                replace: true,
              })
              return 'recovery'
            }
            throw queryError
          }

          if (activeRef.current !== active) {
            return 'superseded'
          }
          throw queryError
        }
        if (readiness === 'superseded' || activeRef.current !== active) {
          return 'superseded'
        }
        await commit()
        if (activeRef.current !== active) return 'superseded'
        return 'committed'
      } finally {
        lease.release()
        if (activeRef.current === active) {
          activeRef.current = null
          setPendingTableName(null)
        }
      }
    },
    [activeConnection, cancelActive, client, identity, navigate, wasmSchema],
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
