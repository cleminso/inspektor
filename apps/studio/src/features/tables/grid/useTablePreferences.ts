import type { ColumnOrderState, OnChangeFn } from '@tanstack/react-table'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

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
  pinned: string[]
}

interface UseTablePreferencesResult {
  columnOrder: string[]
  columnVisibility: TableColumnVisibilityState
  pinnedColumnIds: string[]
  setColumnOrder: OnChangeFn<ColumnOrderState>
  setPinnedColumnIds: OnChangeFn<string[]>
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
      pinned?: unknown
    } | null
    if (
      parsed?.version !== 1 ||
      Array.isArray(parsed.order) === false ||
      parsed.order.every((value) => typeof value === 'string') === false ||
      Array.isArray(parsed.hidden) === false ||
      parsed.hidden.every((value) => typeof value === 'string') === false ||
      (parsed.pinned !== undefined &&
        (Array.isArray(parsed.pinned) === false ||
          parsed.pinned.every((value) => typeof value === 'string') === false))
    ) {
      return { order: [...columnIds], hidden: [...defaultHiddenColumnIds], pinned: [] }
    }

    const storedHidden = parsed.hidden
    const storedOrder = parsed.order
    const knownColumnIds = new Set(storedOrder)
    return {
      order: storedOrder,
      pinned: parsed.pinned ?? [],
      hidden: [
        ...storedHidden,
        ...defaultHiddenColumnIds.filter(
          (columnId) =>
            knownColumnIds.has(columnId) === false && storedHidden.includes(columnId) === false,
        ),
      ],
    }
  } catch {
    return { order: [...columnIds], hidden: [...defaultHiddenColumnIds], pinned: [] }
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

function normalizePinnedColumnIds(pinned: readonly string[], columnIds: readonly string[]): string[] {
  const knownColumnIds = new Set(columnIds)
  const normalized = new Set<string>()
  for (const columnId of pinned) {
    if (knownColumnIds.has(columnId) === true) {
      normalized.add(columnId)
    }
  }
  return [...normalized]
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
  const preferencesRef = useRef(preferences)
  // Stable persistence callbacks must read only preferences that reached the committed UI.
  useLayoutEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])
  // Reading a new table scope during render keeps the UI current without scheduling a render-phase
  // update. Persist only committed state so localStorage does not block the interaction itself.
  useEffect(() => {
    if (preferenceState.tableKey === tableKey) {
      writeTablePreferences(storageKey, preferenceState.preferences)
    }
  }, [preferenceState, storageKey, tableKey])
  const columnOrder = useMemo(
    () => normalizeColumnOrder(preferences.order, columnIds),
    [columnIds, preferences.order],
  )
  const pinnedColumnIds = useMemo(
    () => normalizePinnedColumnIds(preferences.pinned, columnIds),
    [columnIds, preferences.pinned],
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
    },
    [columnIds, tableKey],
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
      const next = { ...current, order, hidden }
      preferencesRef.current = next
      setPreferenceState({ tableKey, preferences: next })
    },
    [columnIds, defaultHiddenColumnIds, tableKey],
  )

  const setPinnedColumnIds = useCallback<OnChangeFn<string[]>>(
    (updater) => {
      const current = preferencesRef.current
      const currentPinned = normalizePinnedColumnIds(current.pinned, columnIds)
      const candidatePinned = typeof updater === 'function' ? updater(currentPinned) : updater
      const pinned = normalizePinnedColumnIds(candidatePinned, columnIds)
      const knownColumnIds = new Set(columnIds)
      const storedPinned = [
        ...pinned,
        ...current.pinned.filter((columnId) => knownColumnIds.has(columnId) === false),
      ]
      if (arraysMatch(current.pinned, storedPinned) === true) {
        return
      }

      const next = { ...current, pinned: storedPinned }
      preferencesRef.current = next
      setPreferenceState({ tableKey, preferences: next })
    },
    [columnIds, tableKey],
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
    pinnedColumnIds,
    setColumnOrder,
    setPinnedColumnIds,
    setColumnVisibility,
  }
}
