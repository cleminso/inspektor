import { useEffect, useRef, useState } from 'react'
import type { useTableViewState } from '@tables/workspace/useTableViewState'

type QueryStatusState = Pick<
  ReturnType<typeof useTableViewState>,
  'error' | 'isInitialLoading' | 'isRefreshing' | 'isReconnecting' | 'rows' | 'filters' | 'page'
>

/** Keeps accessible refresh announcements separate from canonical query state. */
export function useTableQueryStatus(state: QueryStatusState) {
  const refreshPendingRef = useRef(false)
  const [refreshAnnouncement, setRefreshAnnouncement] = useState('')
  const filteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.rows.length === 0 &&
    state.filters.length > 0
  const unfilteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.rows.length === 0 &&
    state.page === 1 &&
    state.filters.length === 0
  const queryStatus =
    state.isReconnecting === true
      ? 'Reconnecting'
      : state.error !== null
        ? ''
        : state.isRefreshing === true
          ? 'Refreshing rows'
          : [
              refreshAnnouncement,
              filteredEmpty
                ? 'No rows match these filters'
                : unfilteredEmpty
                  ? 'This table is empty'
                  : '',
            ]
              .filter(Boolean)
              .join('. ')

  useEffect(() => {
    if (state.isInitialLoading === true || state.error !== null) {
      refreshPendingRef.current = false
      setRefreshAnnouncement('')
      return
    }
    if (state.isRefreshing === true) {
      refreshPendingRef.current = true
      return
    }
    if (refreshPendingRef.current === true) {
      refreshPendingRef.current = false
      setRefreshAnnouncement('Rows refreshed')
    }
  }, [state.error, state.isInitialLoading, state.isRefreshing])

  return { filteredEmpty, unfilteredEmpty, queryStatus }
}
