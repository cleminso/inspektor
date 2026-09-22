import { createContext, use, useCallback, useLayoutEffect, useRef, useState } from 'react'

import { useRuntimeClient, useRuntimeSchema } from '@app/providers/inspectorProvider'
import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { prefetchJazzQuery } from '@tables/query/prefetchJazzQuery'
import { buildTableRowsQuery } from '@tables/query/tableRowsQuery'
import type { TableRowsSearchState } from '@tables/tableTypes'

type PreparationPolicy = 'ignore' | 'replace'
type PreparationResult = 'busy' | 'committed' | 'superseded' | 'unavailable'

interface PrepareTableNavigationOptions {
  policy: PreparationPolicy
  search: TableRowsSearchState
  tableName: string
}

interface ActivePreparation {
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
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const activeRef = useRef<ActivePreparation | null>(null)
  const [pendingTableName, setPendingTableName] = useState<string | null>(null)

  const cancelActive = useCallback(() => {
    const active = activeRef.current
    activeRef.current = null
    active?.cancel()
    setPendingTableName(null)
  }, [])

  useLayoutEffect(() => {
    setPendingTableName(null)
    return () => {
      const active = activeRef.current
      activeRef.current = null
      active?.cancel()
    }
  }, [client, identity, scope, wasmSchema])

  const prepare = useCallback(
    async (
      options: PrepareTableNavigationOptions,
      commit: () => Promise<void> | void,
    ): Promise<PreparationResult> => {
      if (activeRef.current !== null) {
        if (options.policy === 'ignore') return 'busy'
        cancelActive()
      }
      if (client === null || wasmSchema === null) {
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
      const cancelled = new Promise<'superseded'>((resolve) => {
        cancel = () => resolve('superseded')
      })
      const active = { cancel }
      activeRef.current = active
      setPendingTableName(options.tableName)

      try {
        const readiness = await Promise.race([
          lease.promise.then(() => 'ready' as const),
          cancelled,
        ])
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
    [cancelActive, client, wasmSchema],
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
