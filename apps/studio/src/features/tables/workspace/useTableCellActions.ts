import { useCallback } from 'react'
import { toasts, type BinaryCopyFormat, type DataGridCellTarget } from '@inspektor/ds'
import {
  canCreateTableFilterClauseFromValue,
  createTableFilterClauseFromValue,
  tableIdFilterColumn,
} from '@tables/filters/filterParsing'
import type { TableFilterValueMatch } from '@tables/filters/tableFilters'
import { serializeCellValueForClipboard } from '@tables/grid/cellActions'
import { resolveStagedFieldValue } from '@tables/grid/stagedFieldValue'
import type { TableValuesByRowId } from '@tables/tableTypes'
import type { useTableViewState } from '@tables/workspace/useTableViewState'

type CellActionState = Pick<
  ReturnType<typeof useTableViewState>,
  'table' | 'tableColumns' | 'canOpenRowEditor' | 'setFilters' | 'filters'
>

/** Browser cell actions read the same sparse draft overlay as the rendered grid. */
export function useTableCellActions(
  state: CellActionState,
  draftValuesByRowId: TableValuesByRowId,
  mutationApplying: boolean,
  tableKey: string,
) {
  const resolveCellAction = useCallback(
    (target: DataGridCellTarget) => {
      const columnMeta = state.tableColumns.find((column) => column.id === target.columnId)
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      if (columnMeta === undefined || row === undefined) {
        return null
      }
      const value = resolveStagedFieldValue(
        row.original,
        draftValuesByRowId[target.rowId],
        columnMeta.accessorKey,
      )
      return { columnMeta, value }
    },
    [draftValuesByRowId, state.table, state.tableColumns],
  )
  const getCellActions = useCallback(
    (target: DataGridCellTarget) => {
      const resolvedCell = resolveCellAction(target)
      if (resolvedCell === null) {
        return {
          canCopy: false,
          canEdit: false,
          canExclude: false,
          canFilterBy: false,
          copyAs: [],
        }
      }
      const { columnMeta, value } = resolvedCell
      const filterColumn = columnMeta.column ?? tableIdFilterColumn
      const canEdit = state.canOpenRowEditor === true && mutationApplying === false
      return {
        canCopy: value !== undefined,
        canEdit,
        canExclude: canCreateTableFilterClauseFromValue(filterColumn, value, 'exclude'),
        canFilterBy: canCreateTableFilterClauseFromValue(filterColumn, value),
        copyAs: value instanceof Uint8Array ? (['hex', 'base64'] as const) : [],
      }
    },
    [mutationApplying, resolveCellAction, state.canOpenRowEditor],
  )
  const handleCopyCell = useCallback(
    async (target: DataGridCellTarget, format?: BinaryCopyFormat) => {
      const resolvedCell = resolveCellAction(target)
      if (resolvedCell === null) {
        return
      }
      try {
        const serializedValue = serializeCellValueForClipboard(
          resolvedCell.value,
          format ?? 'default',
        )
        await navigator.clipboard.writeText(serializedValue.text)
        toasts.success(serializedValue.toast, {
          duration: 'brief',
          id: JSON.stringify(['cell-copy', tableKey, target.rowId, target.columnId]),
        })
      } catch {
        toasts.error("Couldn't copy value")
      }
    },
    [resolveCellAction, tableKey],
  )
  const handleFilterByCell = (target: DataGridCellTarget, match: TableFilterValueMatch) => {
    const resolvedCell = resolveCellAction(target)
    if (resolvedCell === null) {
      return
    }
    const clause = createTableFilterClauseFromValue(
      resolvedCell.columnMeta.column ?? tableIdFilterColumn,
      resolvedCell.value,
      match,
    )
    if (clause !== null) {
      void state.setFilters([...state.filters, clause])
    }
  }
  const canSelectRow = useCallback(
    (rowId: string) => {
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === rowId)
      return row?.getCanSelect() === true && row.getIsSelected() === false
    },
    [state.table],
  )
  const handleSelectRow = useCallback(
    (rowId: string) => {
      if (canSelectRow(rowId) === false) {
        return
      }
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === rowId)
      row?.toggleSelected(true)
    },
    [canSelectRow, state.table],
  )
  const handleTouchCellContextMenuOpen = useCallback(
    (target: DataGridCellTarget) => {
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      const cell = row
        ?.getVisibleCells()
        .find((candidate) => candidate.column.id === target.columnId)
      if (cell?.getCanSelect() === true && cell.getIsSelected() === false) {
        state.table.selectCellRange({
          anchorRowId: target.rowId,
          anchorColumnId: target.columnId,
          focusRowId: target.rowId,
          focusColumnId: target.columnId,
        })
      }
    },
    [state.table],
  )
  return {
    getCellActions,
    handleCopyCell,
    handleFilterByCell,
    canSelectRow,
    handleSelectRow,
    handleTouchCellContextMenuOpen,
  }
}
