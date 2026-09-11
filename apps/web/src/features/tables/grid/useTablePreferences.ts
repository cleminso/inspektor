import type { ColumnOrderState, OnChangeFn } from '@tanstack/react-table'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  getConnectionScopedStorageKey,
  getConnectionScopedStorageValue,
} from '@app/storage/connectionScopedStorage'
import { normalizeColumnOrder } from '@tables/grid/useColumnOrder'
import type { TableColumnVisibilityState } from '@tables/tableTypes'

interface UseTablePreferencesOptions {
  columnIds: string[]
  defaultHiddenColumnIds?: readonly string[]
  tableKey: string
}

interface TablePreferences {
  hidden: string[]
  order: string[]
}

interface UseTablePreferencesResult {
  columnOrder: string[]
  columnVisibility: TableColumnVisibilityState
  setColumnOrder: OnChangeFn<ColumnOrderState>
  setColumnVisibility: (next: TableColumnVisibilityState) => void
}

function readTablePreferences(
  tableKey: string,
  columnIds: string[],
  defaultHiddenColumnIds: readonly string[],
): TablePreferences {
  try {
    const storedValue = getConnectionScopedStorageValue('tablePreferences', tableKey)
    const parsed = JSON.parse(storedValue ?? 'null') as {
      version?: unknown
      hidden?: unknown
      order?: unknown
    } | null
    if (
      parsed?.version !== 1 ||
      Array.isArray(parsed.order) === false ||
      parsed.order.every((value) => typeof value === 'string') === false ||
      Array.isArray(parsed.hidden) === false ||
      parsed.hidden.every((value) => typeof value === 'string') === false
    ) {
      return { order: [...columnIds], hidden: [...defaultHiddenColumnIds] }
    }

    const storedHidden = parsed.hidden
    const storedOrder = parsed.order
    const knownColumnIds = new Set(storedOrder)
    return {
      order: storedOrder,
      hidden: [
        ...storedHidden,
        ...defaultHiddenColumnIds.filter(
          (columnId) =>
            knownColumnIds.has(columnId) === false && storedHidden.includes(columnId) === false,
        ),
      ],
    }
  } catch {
    return { order: [...columnIds], hidden: [...defaultHiddenColumnIds] }
  }
}

function writeTablePreferences(storageKey: string, preferences: TablePreferences): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...preferences }))
  } catch {}
}

function arraysMatch(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function useTablePreferences({
  columnIds,
  defaultHiddenColumnIds = [],
  tableKey,
}: UseTablePreferencesOptions): UseTablePreferencesResult {
  const storageKey = getConnectionScopedStorageKey('tablePreferences', tableKey)
  const [preferenceState, setPreferenceState] = useState(() => ({
    tableKey,
    preferences: readTablePreferences(tableKey, columnIds, defaultHiddenColumnIds),
  }))
  const preferences =
    preferenceState.tableKey === tableKey
      ? preferenceState.preferences
      : readTablePreferences(tableKey, columnIds, defaultHiddenColumnIds)
  if (preferenceState.tableKey !== tableKey) {
    setPreferenceState({ tableKey, preferences })
  }
  const preferencesRef = useRef(preferences)
  // Stable persistence callbacks must read only preferences that reached the committed UI.
  useLayoutEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])
  const columnOrder = useMemo(
    () => normalizeColumnOrder(preferences.order, columnIds),
    [columnIds, preferences.order],
  )

  const setColumnOrder = useCallback<OnChangeFn<ColumnOrderState>>(
    (updater) => {
      const current = preferencesRef.current
      const currentOrder = normalizeColumnOrder(current.order, columnIds)
      const candidateOrder = typeof updater === 'function' ? updater(currentOrder) : updater
      const order = normalizeColumnOrder(candidateOrder, columnIds)
      const knownColumnIds = new Set(columnIds)
      const storedOrder = [
        ...order,
        ...current.order.filter((columnId) => knownColumnIds.has(columnId) === false),
      ]
      if (arraysMatch(current.order, storedOrder) === true) {
        return
      }

      const next = { ...current, order: storedOrder }
      preferencesRef.current = next
      setPreferenceState({ tableKey, preferences: next })
      writeTablePreferences(storageKey, next)
    },
    [columnIds, storageKey, tableKey],
  )

  const setColumnVisibility = useCallback(
    (nextVisibility: TableColumnVisibilityState) => {
      const current = preferencesRef.current
      const knownColumnIds = new Set(columnIds)
      const hidden = [
        ...current.hidden.filter((columnId) => knownColumnIds.has(columnId) === false),
        ...columnIds.filter((columnId) => nextVisibility[columnId] === false),
      ]
      if (arraysMatch(current.hidden, hidden) === true) {
        return
      }

      const order = [
        ...current.order,
        ...defaultHiddenColumnIds.filter(
          (columnId) =>
            columnIds.includes(columnId) === true && current.order.includes(columnId) === false,
        ),
      ]
      const next = { order, hidden }
      preferencesRef.current = next
      setPreferenceState({ tableKey, preferences: next })
      writeTablePreferences(storageKey, next)
    },
    [columnIds, defaultHiddenColumnIds, storageKey, tableKey],
  )

  const columnVisibility = useMemo(() => {
    // Hidden columns are membership data; a Set avoids rescanning the array for every column.
    const hiddenColumnIds = new Set(preferences.hidden)
    return Object.fromEntries(
      columnIds.map((columnId) => [columnId, hiddenColumnIds.has(columnId) === false]),
    )
  }, [columnIds, preferences.hidden])

  return {
    columnOrder,
    columnVisibility,
    setColumnOrder,
    setColumnVisibility,
  }
}
