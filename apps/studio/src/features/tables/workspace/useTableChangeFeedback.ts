import { useEffect, useRef, useState } from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import { valuesEqual } from '@inspektor/core/draft'
import type { DynamicTableRow, TableFieldsByRowId, TableRowId } from '@tables/tableTypes'

const emptyRecentlyAppliedCells: TableFieldsByRowId = {}
const emptyRecentlyInsertedRowIds: ReadonlySet<TableRowId> = new Set()
const recentChangeStatusDuration = 1200
const recentlyAppliedTimerKey = Symbol('recentlyApplied')

/** Deduplicates local/live insert feedback and expires cell and row highlights. */
export function useTableChangeFeedback(schemaColumns: ColumnDescriptor[]) {
  const [recentlyInsertedRowIds, setRecentlyInsertedRowIds] = useState<ReadonlySet<TableRowId>>(
    emptyRecentlyInsertedRowIds,
  )
  const [recentlyAppliedCells, setRecentlyAppliedCells] =
    useState<TableFieldsByRowId>(emptyRecentlyAppliedCells)
  const recentChangeTimersRef = useRef(
    new Map<TableRowId | typeof recentlyAppliedTimerKey, ReturnType<typeof setTimeout>>(),
  )
  // Local success and the live query can report the same insert; feedback runs once per view.
  const highlightedInsertedRowIdsRef = useRef(new Set<TableRowId>())

  useEffect(() => {
    const timers = recentChangeTimersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const scheduleRecentChangeExpiry = (
    key: TableRowId | typeof recentlyAppliedTimerKey,
    onExpire: () => void,
  ) => {
    const timers = recentChangeTimersRef.current
    clearTimeout(timers.get(key))
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        onExpire()
      }, recentChangeStatusDuration),
    )
  }

  const highlightRecentlyInsertedRow = (rowId: TableRowId) => {
    if (highlightedInsertedRowIdsRef.current.has(rowId) === true) {
      return
    }
    highlightedInsertedRowIdsRef.current.add(rowId)
    setRecentlyInsertedRowIds((currentRowIds) => {
      return new Set([...currentRowIds, rowId])
    })
    scheduleRecentChangeExpiry(rowId, () => {
      setRecentlyInsertedRowIds((currentRowIds) => {
        if (currentRowIds.has(rowId) === false) {
          return currentRowIds
        }
        const nextRowIds = new Set(currentRowIds)
        nextRowIds.delete(rowId)
        return nextRowIds
      })
    })
  }

  const highlightRecentlyAppliedCells = (appliedUpdateFields: TableFieldsByRowId) => {
    if (Object.keys(appliedUpdateFields).length === 0) {
      return
    }
    setRecentlyAppliedCells(appliedUpdateFields)
    scheduleRecentChangeExpiry(recentlyAppliedTimerKey, () => {
      setRecentlyAppliedCells(emptyRecentlyAppliedCells)
    })
  }

  function handleRowsAdded(rowIds: readonly TableRowId[]) {
    for (const rowId of rowIds) {
      highlightRecentlyInsertedRow(rowId)
    }
  }

  function handleRowsUpdated(
    updates: readonly { current: DynamicTableRow; previous: DynamicTableRow }[],
  ) {
    const changedFieldsByRowId: Record<TableRowId, ReadonlySet<string>> = {}
    for (const { current, previous } of updates) {
      const changedFields = new Set(
        schemaColumns
          .filter(
            (column) =>
              valuesEqual(column.column_type, previous[column.name], current[column.name]) ===
              false,
          )
          .map((column) => column.name),
      )
      if (changedFields.size > 0) {
        changedFieldsByRowId[current.id] = changedFields
      }
    }
    highlightRecentlyAppliedCells(changedFieldsByRowId)
  }

  return {
    recentlyInsertedRowIds,
    recentlyAppliedCells,
    highlightRecentlyInsertedRow,
    highlightRecentlyAppliedCells,
    handleRowsAdded,
    handleRowsUpdated,
  }
}
