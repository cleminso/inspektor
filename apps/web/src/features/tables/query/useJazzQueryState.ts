import type { QueryBuilder, QueryOptions, SubscriptionDelta } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { useCallback, useEffectEvent, useRef, useSyncExternalStore } from 'react'

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

type JazzQueryManager = Pick<
  JazzClient['manager'],
  'computeKey' | 'getCacheEntry' | 'makeQueryKey' | 'peekState'
>

/**
 * Subscribes React to the canonical Jazz cache entry for a query.
 *
 * `useSyncExternalStore` keeps subscription setup and cleanup aligned with React's lifecycle while
 * preserving the cache entry's snapshot identity between Jazz updates. Query callers that use the
 * same builder serialization and options therefore share pending and fulfilled work.
 */
export function useJazzQueryState<T extends { id: string }>(
  manager: JazzQueryManager | null,
  query: QueryBuilder<T> | undefined,
  options?: QueryOptions,
  onDelta?: (delta: SubscriptionDelta<T>) => void,
): JazzQueryState<T> {
  const key = manager !== null && query !== undefined ? manager.computeKey(query, options) : null
  const queryRef = useRef(query)
  queryRef.current = query
  const optionsRef = useRef(options)
  optionsRef.current = options
  const notifyDelta = useEffectEvent((delta: SubscriptionDelta<T>) => onDelta?.(delta))
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const currentQuery = queryRef.current
      if (manager === null || currentQuery === undefined || key === null) {
        return () => undefined
      }

      manager.makeQueryKey(currentQuery, optionsRef.current)
      const entry = manager.getCacheEntry<T>(key)
      return entry.subscribe({
        onDelta: (delta) => {
          try {
            notifyDelta(delta)
          } finally {
            onStoreChange()
          }
        },
        onError: onStoreChange,
        onfulfilled: onStoreChange,
        onReset: onStoreChange,
      })
    },
    [key, manager],
  )
  // Return Jazz's state object directly: cloning it here would make every snapshot appear changed.
  const getSnapshot = useCallback(
    () =>
      manager === null || key === null
        ? (IDLE_QUERY_STATE as JazzQueryState<T>)
        : (manager.peekState<T>(key) as JazzQueryState<T>),
    [key, manager],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
