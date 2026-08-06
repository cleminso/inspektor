import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { useCallback, useEffect, useRef } from 'react'

import type { TableFilterClause } from '@tables/filters/tableFilters'
import {
  startTableRowsPrefetch,
  TABLE_ROWS_PREFETCH_INTENT_DELAY_MS,
} from '@tables/query/tableRowsPrefetch'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

export interface TableRowsPrefetchTarget {
  filters?: readonly TableFilterClause[]
  key: string
  page?: number
  pageSize?: TablePageSize
  sortColumn?: string
  sortDirection?: TableSortDirection
  tableName: string
}

interface UseTableRowsPrefetchIntentOptions {
  activeKey: string | null
  availableKeys: readonly string[]
  client: Pick<JazzClient, 'manager'> | null
  schema: WasmSchema | null
}

interface TableRowsPrefetchIntent {
  cancelScheduled: () => void
  prefetch: (target: TableRowsPrefetchTarget) => void
  release: (key?: string) => void
  schedule: (target: TableRowsPrefetchTarget) => void
}

/** Owns one speculative table-row subscription across pointer and keyboard intent. */
export function useTableRowsPrefetchIntent({
  activeKey,
  availableKeys,
  client,
  schema,
}: UseTableRowsPrefetchIntentOptions): TableRowsPrefetchIntent {
  const runtimeRef = useRef({ client, schema })
  runtimeRef.current = { client, schema }
  const activeKeyRef = useRef(activeKey)
  activeKeyRef.current = activeKey
  const activePrefetchRef = useRef<{ key: string; release: () => void } | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const cancelScheduled = useCallback(() => {
    if (timeoutRef.current === null) {
      return
    }

    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const release = useCallback((key?: string) => {
    const activePrefetch = activePrefetchRef.current
    if (activePrefetch === null || (key !== undefined && activePrefetch.key !== key)) {
      return
    }

    activePrefetchRef.current = null
    activePrefetch.release()
  }, [])

  const prefetch = useCallback(
    (target: TableRowsPrefetchTarget) => {
      cancelScheduled()
      const runtime = runtimeRef.current
      if (
        target.key === activeKeyRef.current ||
        activePrefetchRef.current?.key === target.key ||
        runtime.client === null ||
        runtime.schema === null
      ) {
        return
      }

      release()
      activePrefetchRef.current = {
        key: target.key,
        release: startTableRowsPrefetch({
          client: runtime.client,
          filters: target.filters,
          page: target.page,
          pageSize: target.pageSize,
          schema: runtime.schema,
          sortColumn: target.sortColumn,
          sortDirection: target.sortDirection,
          tableName: target.tableName,
        }),
      }
    },
    [cancelScheduled, release],
  )

  const schedule = useCallback(
    (target: TableRowsPrefetchTarget) => {
      if (activePrefetchRef.current?.key === target.key) {
        return
      }

      cancelScheduled()
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        prefetch(target)
      }, TABLE_ROWS_PREFETCH_INTENT_DELAY_MS)
    },
    [cancelScheduled, prefetch],
  )

  useEffect(
    () => () => {
      cancelScheduled()
      release()
    },
    [cancelScheduled, client, release, schema],
  )

  useEffect(() => {
    const activePrefetch = activePrefetchRef.current
    if (
      activePrefetch !== null &&
      (activePrefetch.key === activeKey || availableKeys.includes(activePrefetch.key) === false)
    ) {
      activePrefetchRef.current = null
      activePrefetch.release()
    }
  }, [activeKey, availableKeys])

  return { cancelScheduled, prefetch, release, schedule }
}
