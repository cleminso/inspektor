import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import { useJazzClient } from 'jazz-tools/react'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

/** Stable state projection exposed by one Jazz orchestrator cache entry. */
export type JazzQueryState<T> =
  | { status: 'idle'; data: undefined; error: null }
  | { status: 'pending'; data: undefined; error: null }
  | { status: 'fulfilled'; data: T[]; error: null }
  | { status: 'rejected'; data: undefined; error: unknown }

const IDLE_QUERY_STATE = {
  status: 'idle',
  data: undefined,
  error: null,
} as const satisfies JazzQueryState<never>

/**
 * Subscribes React to the canonical Jazz cache entry for a query.
 *
 * `useSyncExternalStore` keeps subscription setup and cleanup aligned with React's lifecycle while
 * preserving the cache entry's snapshot identity between Jazz updates. Query callers that use the
 * same builder serialization and options therefore share pending and fulfilled work.
 */
export function useJazzQueryState<T extends { id: string }>(
  query: QueryBuilder<T> | undefined,
  options?: QueryOptions,
): JazzQueryState<T> {
  const { manager } = useJazzClient()
  const entry = useMemo(() => {
    if (query === undefined) {
      return null
    }

    const key = manager.makeQueryKey(query, options)
    return manager.getCacheEntry<T>(key)
  }, [manager, options, query])
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (entry === null) {
        return () => undefined
      }

      return entry.subscribe({
        onDelta: onStoreChange,
        onError: onStoreChange,
        onfulfilled: onStoreChange,
      })
    },
    [entry],
  )
  // Return Jazz's state object directly: cloning it here would make every snapshot appear changed.
  const getSnapshot = useCallback(
    () =>
      entry === null ? (IDLE_QUERY_STATE as JazzQueryState<T>) : (entry.state as JazzQueryState<T>),
    [entry],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
