import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import { getSubscriptionStore, type JazzClient } from 'jazz-tools/client'
import type { SubscriptionDelta } from 'jazz-tools/shared'
import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'

/** Stable state projection exposed by one Jazz subscription-store cache entry. */
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
 * same client, builder serialization, and options therefore share pending and fulfilled work.
 */
export function useJazzQueryState<T extends { id: string }>(
  client: JazzClient | null,
  query: QueryBuilder<T> | undefined,
  options?: QueryOptions,
  onDelta?: (delta: SubscriptionDelta<T>) => void,
): JazzQueryState<T> {
  // Use Jazz's attached subscription store instead of relying on client internals.
  const store = client === null ? null : getSubscriptionStore(client)
  // Computing a key is render-safe; registering the query is deferred to subscription setup.
  const key = useMemo(
    () => (store !== null && query !== undefined ? store.computeKey(query, options) : null),
    [options, query, store],
  )
  const inputsRef = useRef({ query, options, onDelta })
  // Subscription callbacks must use committed inputs without changing subscription identity.
  useLayoutEffect(() => {
    inputsRef.current = { query, options, onDelta }
  })
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { query: currentQuery, options: currentOptions } = inputsRef.current
      if (store === null || currentQuery === undefined || key === null) {
        return () => undefined
      }

      // Registration must precede cache-entry access and cannot run during React rendering.
      store.makeQueryKey(currentQuery, currentOptions)
      const entry = store.getCacheEntry<T>(key)
      return entry.subscribe({
        onDelta: (delta) => {
          try {
            inputsRef.current.onDelta?.(delta)
          } finally {
            // React must receive Jazz's snapshot even when product-specific delta handling fails.
            onStoreChange()
          }
        },
        onError: onStoreChange,
        onfulfilled: onStoreChange,
        onReset: onStoreChange,
      })
    },
    [key, store],
  )
  // Return Jazz's state object directly: cloning it here would make every snapshot appear changed.
  const getSnapshot = useCallback(
    () =>
      store === null || key === null
        ? (IDLE_QUERY_STATE as JazzQueryState<T>)
        : (store.peekState<T>(key) as JazzQueryState<T>),
    [key, store],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
