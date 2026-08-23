/**
 * Persists local column visibility for one schema-driven Inspector table.
 *
 * Jazz schema metadata can expose many columns. The Inspector remembers which known
 * columns the user hid without changing the saved Jazz connection or runtime schema.
 */
import { useCallback, useMemo, useState } from 'react'

import type { TableColumnVisibilityState } from '@tables/tableTypes'

interface UseColumnVisibilityOptions {
  columnIds: string[]
  tableKey: string
}

interface UseColumnVisibilityResult {
  columnVisibility: TableColumnVisibilityState
  setColumnVisibility: (next: TableColumnVisibilityState) => void
}

/** Makes newly discovered schema columns visible by default. */
function createDefaultColumnVisibility(columnIds: string[]): TableColumnVisibilityState {
  return Object.fromEntries(columnIds.map((columnId) => [columnId, true]))
}

function areColumnVisibilityStatesEqual(
  left: TableColumnVisibilityState,
  right: TableColumnVisibilityState,
  columnIds: string[],
): boolean {
  return columnIds.every((columnId) => left[columnId] === right[columnId])
}

function readColumnVisibility(storageKey: string, columnIds: string[]): TableColumnVisibilityState {
  const defaultColumnVisibility = createDefaultColumnVisibility(columnIds)

  try {
    const storedValue = window.localStorage.getItem(storageKey)
    if (storedValue === null) {
      return defaultColumnVisibility
    }
    const parsedValue = JSON.parse(storedValue) as unknown
    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      Array.isArray(parsedValue) === true
    ) {
      return defaultColumnVisibility
    }

    const candidateVisibility = parsedValue as TableColumnVisibilityState
    for (const columnId of columnIds) {
      if (candidateVisibility[columnId] === false) {
        defaultColumnVisibility[columnId] = false
      }
    }
  } catch {
    return defaultColumnVisibility
  }

  return defaultColumnVisibility
}

/** Returns the visible/hidden column map and a setter that mirrors it to localStorage. */
export function useColumnVisibility({
  columnIds,
  tableKey,
}: UseColumnVisibilityOptions): UseColumnVisibilityResult {
  const storageKey = `inspector:column-visibility:${tableKey}`
  const defaultColumnVisibility = useMemo(
    () => createDefaultColumnVisibility(columnIds),
    [columnIds],
  )
  const [columnVisibility, setColumnVisibilityState] = useState<TableColumnVisibilityState>(() =>
    readColumnVisibility(storageKey, columnIds),
  )

  const setColumnVisibility = useCallback(
    (next: TableColumnVisibilityState) => {
      const nextValue: TableColumnVisibilityState = { ...defaultColumnVisibility, ...next }
      setColumnVisibilityState((currentColumnVisibility) => {
        if (
          areColumnVisibilityStatesEqual(currentColumnVisibility, nextValue, columnIds) === true
        ) {
          return currentColumnVisibility
        }

        return nextValue
      })
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextValue))
      } catch {
        return
      }
    },
    [columnIds, defaultColumnVisibility, storageKey],
  )

  return {
    columnVisibility,
    setColumnVisibility,
  }
}
