import { Effect, Exit, Scope } from 'effect'
import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import type { JazzClient, UseAllState } from 'jazz-tools/client'
import type { SubscriptionDelta } from 'jazz-tools/shared'
import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { canonicalQuery } from '@inspektor/core/jazz/query'

export type JazzQueryState<T extends { id: string }> =
  | UseAllState<T>
  | { status: 'idle'; data: undefined; error: null }

const IDLE_QUERY_STATE = { status: 'idle', data: undefined, error: null } as const

/** React owns the listener scope. Jazz owns snapshots and canonical subscription identity. */
export function useJazzQueryState<T extends { id: string }>(
  client: JazzClient | null,
  query: QueryBuilder<T> | undefined,
  options?: QueryOptions,
  onDelta?: (delta: SubscriptionDelta<T>, state: UseAllState<T>) => void,
): JazzQueryState<T> {
  const descriptor = useMemo(
    () => (client === null || query === undefined ? null : canonicalQuery(client, query, options)),
    [client, query, options],
  )
  const inputsRef = useRef({ descriptor, onDelta })
  useLayoutEffect(() => {
    inputsRef.current = { descriptor, onDelta }
  })
  const key = descriptor?.key
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const current = inputsRef.current.descriptor
      if (client === null || current === null || current.key !== key) return () => undefined
      const scope = Scope.makeUnsafe()
      const release = () => Effect.runSync(Scope.close(scope, Exit.void))
      try {
        Effect.runSync(
          Scope.provide(
            current.acquire({
              onDelta: (delta) => {
                try {
                  inputsRef.current.onDelta?.(delta, current.getSnapshot())
                } finally {
                  onStoreChange()
                }
              },
              onError: onStoreChange,
              onfulfilled: onStoreChange,
              onReset: onStoreChange,
            }),
            scope,
          ),
        )
      } catch (error) {
        release()
        throw error
      }
      return release
    },
    [client, key],
  )
  const getSnapshot = useCallback(() => descriptor?.getSnapshot() ?? IDLE_QUERY_STATE, [descriptor])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
