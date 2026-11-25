import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ColumnDescriptor } from 'jazz-tools'
import type { RowEditingTable } from '@inspektor/core/workbench/rowEditing'
import { toasts } from '@inspektor/ds'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'

/** Applies confirmed feature outcomes to the current pane. It does not coordinate submission. */
export function useTableRowWrites({
  editing,
  columns,
  activeRowId,
  onApplied,
  onDeleted,
  onInserted,
  onDuplicated,
}: {
  editing: RowEditingTable<DynamicTableRow>
  columns: readonly ColumnDescriptor[]
  activeRowId: TableRowId | null
  onApplied: (fields: Readonly<Record<string, ReadonlySet<string>>>) => void
  onDeleted: (rowId: TableRowId) => void
  onInserted: (rowId: TableRowId, options: { keepOpen: boolean }) => void
  onDuplicated: (values: Record<string, unknown>) => void
}) {
  const [deleteRequestedRowId, setDeleteRequestedRowId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  useLayoutEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  const [resumingWrite, setResumingWrite] = useState(false)
  useEffect(() => {
    setDeleteError(null)
  }, [activeRowId])
  useEffect(() => {
    if (deleteRequestedRowId !== null && deleteRequestedRowId !== activeRowId) {
      setDeleteRequestedRowId(null)
    }
  }, [activeRowId, deleteRequestedRowId])

  const saveRow = async (): Promise<DynamicTableRow | null> => {
    if (activeRowId === null) return null
    const outcome = await editing.saveRow(activeRowId, columns)
    if (mountedRef.current === false) return null
    switch (outcome.status) {
      case 'invalid':
        throw new Error('Correct the invalid fields before saving.')
      case 'unchanged':
        return null
      case 'savedRefreshFailed':
        onApplied({ [activeRowId]: outcome.fields })
        throw new Error(
          `Row saved, but refresh failed. Reload the page to see current data. ${String(outcome.error)}`,
        )
      case 'saved':
        onApplied({ [activeRowId]: outcome.fields })
        if (outcome.row === null) onDeleted(activeRowId)
        return outcome.row
    }
  }
  const deleteRow = async (rowId: TableRowId) => {
    if (rowId !== activeRowId) return
    setDeleteError(null)
    try {
      await editing.deleteRow(rowId)
      if (mountedRef.current === false) return
      setDeleteRequestedRowId(null)
      onDeleted(rowId)
    } catch (error) {
      if (mountedRef.current === true) {
        setDeleteError(error instanceof Error ? error.message : String(error))
      }
    }
  }
  const insertRow = async (
    values: Record<string, unknown>,
    options: { keepOpen: boolean },
    onSuccess: () => void,
  ) => {
    const rowId = await editing.insertRow(values)
    if (mountedRef.current === false) return
    onInserted(rowId, options)
    onSuccess()
  }
  const resumeWaiting = () => {
    setResumingWrite(true)
    void editing
      .resumePending()
      .catch(() => {
        // The feature exposes retirement and native rejection through its snapshot.
      })
      .finally(() => {
        if (mountedRef.current === true) setResumingWrite(false)
      })
  }
  const duplicateRow = async (rowId: TableRowId) => {
    try {
      const values = await editing.loadDuplicate(rowId, columns)
      if (mountedRef.current === true) onDuplicated(values)
    } catch {
      if (mountedRef.current === true) toasts.error("Couldn't load the row to duplicate")
    }
  }
  return {
    saveRow,
    deleteRow,
    insertRow,
    duplicateRow,
    resumeWaiting,
    resumingWrite,
    deleteRequestedRowId,
    setDeleteRequestedRowId,
    deleteError,
    setDeleteError,
  }
}
