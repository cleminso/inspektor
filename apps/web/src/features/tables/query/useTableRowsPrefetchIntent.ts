import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { useCallback, useEffect, useRef } from 'react'

import type { TableFilterClause } from '@tables/filters/tableFilters'
import {
  startTableRowsPrefetch,
  TABLE_ROWS_PREFETCH_INTENT_DELAY_MS,
} from '@tables/query/tableRowsPrefetch'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

interface TableRowsPrefetchTarget {
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

function getTargetIdentity(target: TableRowsPrefetchTarget): string {
  return JSON.stringify([
    target.tableName,
    target.filters ?? null,
    target.page ?? null,
    target.pageSize ?? null,
    target.sortColumn ?? null,
    target.sortDirection ?? null,
  ])
}

/** Owns one speculative table-row subscription for a navigation surface. */
export function useTableRowsPrefetchIntent({
  activeKey,
  availableKeys,
  client,
  schema,
}: UseTableRowsPrefetchIntentOptions) {
  const runtimeRef = useRef({ client, schema })
  runtimeRef.current = { client, schema }
  const activeKeyRef = useRef(activeKey)
  activeKeyRef.current = activeKey
  const activePrefetchRef = useRef<{
    key: string
    release: () => void
    targetIdentity: string
  } | null>(null)
  const timeoutRef = useRef<{ key: string; timeoutId: number } | null>(null)

  const cancelScheduled = useCallback(() => {
    if (timeoutRef.current === null) {
      return
    }

    window.clearTimeout(timeoutRef.current.timeoutId)
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
      const targetIdentity = getTargetIdentity(target)
      const activePrefetch = activePrefetchRef.current
      if (activePrefetch?.targetIdentity === targetIdentity) {
        activePrefetch.key = target.key
        return
      }
      if (
        target.key === activeKeyRef.current ||
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
        targetIdentity,
      }
    },
    [cancelScheduled, release],
  )

  const schedule = useCallback(
    (target: TableRowsPrefetchTarget) => {
      cancelScheduled()
      const activePrefetch = activePrefetchRef.current
      if (activePrefetch?.targetIdentity === getTargetIdentity(target)) {
        activePrefetch.key = target.key
        return
      }

      const timeoutId = window.setTimeout(() => {
        timeoutRef.current = null
        prefetch(target)
      }, TABLE_ROWS_PREFETCH_INTENT_DELAY_MS)
      timeoutRef.current = { key: target.key, timeoutId }
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
    const scheduledPrefetch = timeoutRef.current
    if (
      scheduledPrefetch !== null &&
      (scheduledPrefetch.key === activeKey ||
        availableKeys.includes(scheduledPrefetch.key) === false)
    ) {
      cancelScheduled()
    }
    const activePrefetch = activePrefetchRef.current
    if (
      activePrefetch !== null &&
      (activePrefetch.key === activeKey || availableKeys.includes(activePrefetch.key) === false)
    ) {
      release(activePrefetch.key)
    }
  }, [activeKey, availableKeys, cancelScheduled, release])

  return { cancelScheduled, prefetch, release, schedule }
}
