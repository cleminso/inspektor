import { fetchServerSubscriptions } from 'jazz-tools'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ConnectionCredentials } from '@app/connections/connections'

import {
  normalizeQuerySubscriptionsError,
  projectQuerySubscriptionsTimeline,
  reduceQuerySubscriptionsHistory,
  validateQuerySubscriptionsResponse,
  type QuerySubscriptionsCapture,
  type QuerySubscriptionsTimeline,
} from './querySubscriptions'

const SERVER_SUBSCRIPTIONS_POLL_MS = 20_000
const QUERY_SUBSCRIPTIONS_HISTORY_LIMIT = 60

export type QuerySubscriptionsTelemetryState =
  | { kind: 'initial-loading' }
  | { kind: 'ready' }
  | { kind: 'refreshing' }
  | { kind: 'failed-initial-load' }
  | { kind: 'stale-history' }
  | { kind: 'cleared'; isRefreshing: boolean }

export interface QuerySubscriptionsTelemetry {
  clearHistory: () => void
  history: readonly QuerySubscriptionsCapture[]
  isPaused: boolean
  timeline: QuerySubscriptionsTimeline
  state: QuerySubscriptionsTelemetryState
  refresh: () => void
  setPaused: (paused: boolean) => void
}

/**
 * Retains history for one connection identity. History resets on connection
 * replacement are owned by the keyed `ConnectedLiveQueriesView` mount.
 */
export function useQuerySubscriptionsTelemetry(
  connection: ConnectionCredentials,
): QuerySubscriptionsTelemetry {
  const [history, setHistory] = useState<readonly QuerySubscriptionsCapture[]>([])
  const [latestRequestKind, setLatestRequestKind] = useState<
    QuerySubscriptionsCapture['kind'] | 'cleared' | null
  >(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const refreshRef = useRef<(() => void) | null>(null)
  const setPausedRef = useRef<((paused: boolean) => void) | null>(null)
  const { adminSecret, appId, serverUrl } = connection

  const refresh = useCallback(() => refreshRef.current?.(), [])
  const setPaused = useCallback((paused: boolean) => setPausedRef.current?.(paused), [])
  const clearHistory = useCallback(() => {
    setHistory([])
    setLatestRequestKind('cleared')
  }, [])

  useEffect(() => {
    let active = true
    let inFlight = false
    let paused = false
    let requestAfterFlight = false
    let requestCount = 0
    let timer: number | null = null

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    const schedule = () => {
      if (paused === false) {
        timer = window.setTimeout(startRequest, SERVER_SUBSCRIPTIONS_POLL_MS)
      }
    }

    const commit = (capture: QuerySubscriptionsCapture) => {
      setHistory((current) =>
        reduceQuerySubscriptionsHistory(current, capture, QUERY_SUBSCRIPTIONS_HISTORY_LIMIT),
      )
      setLatestRequestKind(capture.kind)
    }

    const startRequest = () => {
      if (active === false || inFlight === true) {
        return
      }

      clearTimer()

      inFlight = true
      requestCount += 1
      setIsRequesting(true)
      const attemptedAt = Date.now()
      const id = `query-subscriptions-${requestCount}`

      void fetchServerSubscriptions(serverUrl, {
        appId,
        adminSecret,
      })
        .then((response) => {
          if (active === false) {
            return
          }

          const validation = validateQuerySubscriptionsResponse(response, appId)
          commit(
            validation.valid === true
              ? {
                  kind: 'success',
                  id,
                  generatedAt: validation.value.generatedAt,
                  groups: validation.value.queries,
                }
              : {
                  kind: 'failure',
                  id,
                  attemptedAt,
                  error: validation.error,
                },
          )
        })
        .catch((error: unknown) => {
          if (active === false) {
            return
          }

          commit({
            kind: 'failure',
            id,
            attemptedAt,
            error: normalizeQuerySubscriptionsError(error),
          })
        })
        .finally(() => {
          if (active === false) {
            return
          }

          inFlight = false
          setIsRequesting(false)
          if (requestAfterFlight === true) {
            requestAfterFlight = false
            startRequest()
          } else {
            schedule()
          }
        })
    }

    const setPaused = (nextPaused: boolean) => {
      if (active === false || paused === nextPaused) {
        return
      }

      paused = nextPaused
      setIsPaused(nextPaused)
      if (nextPaused === true) {
        requestAfterFlight = false
        clearTimer()
      } else if (inFlight === true) {
        requestAfterFlight = true
      } else {
        startRequest()
      }
    }

    refreshRef.current = startRequest
    setPausedRef.current = setPaused
    startRequest()

    return () => {
      active = false
      clearTimer()
      if (refreshRef.current === startRequest) {
        refreshRef.current = null
      }
      if (setPausedRef.current === setPaused) {
        setPausedRef.current = null
      }
    }
  }, [adminSecret, appId, serverUrl])

  const timeline = useMemo(() => projectQuerySubscriptionsTimeline(history), [history])
  const state: QuerySubscriptionsTelemetryState =
    latestRequestKind === 'cleared'
      ? { kind: 'cleared', isRefreshing: isRequesting }
      : history.length === 0 || (isRequesting === true && timeline.latestSuccessfulCapture === null)
        ? { kind: 'initial-loading' }
        : isRequesting === true
          ? { kind: 'refreshing' }
          : latestRequestKind === 'failure'
            ? timeline.latestSuccessfulCapture === null
              ? { kind: 'failed-initial-load' }
              : { kind: 'stale-history' }
            : { kind: 'ready' }

  return {
    clearHistory,
    history,
    isPaused,
    timeline,
    state,
    refresh,
    setPaused,
  }
}
