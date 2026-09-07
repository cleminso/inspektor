import { useMemo, useRef } from 'react'

import {
  type CellSelectionState,
  type ColumnOrderState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import type { DynamicTableRow } from 'jazz-tools'

import { dataGridFeatures, type DataGridTable } from '@inspektor/ds'

import { buildDataGridColumns } from '@tables/grid/buildColumns'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import type { ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import type {
  TableColumnMeta,
  TableColumnVisibilityState,
  TableRowId,
  TableSortDirection,
  TableValuesByRowId,
} from '@tables/tableTypes'

interface UseTableGridOptions {
  cellSelection: CellSelectionState
  columnOrder: string[]
  columnVisibility: TableColumnVisibilityState
  columns: TableColumnMeta[]
  disabledRowIds: ReadonlySet<TableRowId>
  onColumnMenuOpen: (columnId: string) => void
  onColumnMove: (columnId: string, direction: ColumnMoveDirection) => void
  onColumnOrderChange: OnChangeFn<ColumnOrderState>
  onColumnVisibilityChange: (next: TableColumnVisibilityState) => void
  onCellSelectionChange: OnChangeFn<CellSelectionState>
  onSelectedRowIdsChange: (rowIds: TableRowId[], intentRowId: TableRowId | null) => void
  onSortChange: (columnId: string, direction: TableSortDirection) => void
  onUndoRowDeletions?: (rowIds: readonly TableRowId[]) => void
  rows: DynamicTableRow[]
  selectedRowIds: TableRowId[]
  sortColumn: string
  sortDirection: TableSortDirection
  stagedValuesByRowId: TableValuesByRowId
}

const selectNoInternalTableState = () => null

export function useTableGrid({
  cellSelection,
  columnOrder,
  columnVisibility,
  columns,
  disabledRowIds,
  onColumnMenuOpen,
  onColumnMove,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onCellSelectionChange,
  onSelectedRowIdsChange,
  onSortChange,
  onUndoRowDeletions,
  rows,
  selectedRowIds,
  sortColumn,
  sortDirection,
  stagedValuesByRowId,
}: UseTableGridOptions): DataGridTable<DynamicTableRow> {
  const rowSelectionRequestRef = useRef<TableRowId | null>(null)
  // Column definitions describe schema and behavior; mutable staged values travel through table meta.
  const columnDefs = useMemo(
    () =>
      buildDataGridColumns({
        columns,
        onColumnMenuOpen,
        onColumnMove,
        onUndoRowDeletions,
        onRowSelectionRequest: (rowId) => {
          rowSelectionRequestRef.current = rowId
        },
      }),
    [columns, onColumnMenuOpen, onColumnMove, onUndoRowDeletions],
  )

  const rowSelection = useMemo<RowSelectionState>(() => {
    return Object.fromEntries(selectedRowIds.map((rowId) => [rowId, true]))
  }, [selectedRowIds])

  const sorting = useMemo<SortingState>(
    () => [{ id: sortColumn, desc: sortDirection === 'desc' }],
    [sortColumn, sortDirection],
  )
  const tableColumnOrder = useMemo(
    () => [tableGridSelectionColumnId, ...columnOrder],
    [columnOrder],
  )

  return useTable(
    {
      features: dataGridFeatures,
      data: rows,
      columns: columnDefs,
      meta: { stagedValuesByRowId },
      getRowId: (row) => String(row.id),
      autoResetCellSelection: false,
      columnResizeMode: 'onChange',
      enableRowSelection: (row) => disabledRowIds.has(row.id) === false,
      enableCellSelection: (cell) => disabledRowIds.has(cell.row.id) === false,
      manualSorting: true,
      state: {
        cellSelection,
        columnVisibility: columnVisibility as ColumnVisibilityState,
        columnOrder: tableColumnOrder,
        rowSelection,
        sorting,
      },
      onCellSelectionChange,
      onColumnOrderChange: (updater) => {
        onColumnOrderChange((currentColumnOrder) => {
          const currentTableColumnOrder = [tableGridSelectionColumnId, ...currentColumnOrder]
          const nextTableColumnOrder =
            typeof updater === 'function' ? updater(currentTableColumnOrder) : updater
          return nextTableColumnOrder.filter((columnId) => columnId !== tableGridSelectionColumnId)
        })
      },
      onRowSelectionChange: (updater) => {
        const nextRowSelection = typeof updater === 'function' ? updater(rowSelection) : updater
        const nextSelectedRowIds = rows
          .filter((row) => nextRowSelection[String(row.id)] === true)
          .map((row) => String(row.id))
        const interaction = rowSelectionRequestRef.current
        rowSelectionRequestRef.current = null

        onSelectedRowIdsChange(nextSelectedRowIds, interaction)
      },
      onColumnVisibilityChange: (updater) => {
        const nextColumnVisibility =
          typeof updater === 'function'
            ? updater(columnVisibility as ColumnVisibilityState)
            : updater
        onColumnVisibilityChange(nextColumnVisibility as TableColumnVisibilityState)
      },
      onSortingChange: (updater) => {
        const nextSorting = typeof updater === 'function' ? updater(sorting) : updater
        const nextSort = nextSorting[0]

        if (nextSort === undefined) {
          onSortChange('id', 'asc')
          return
        }

        onSortChange(nextSort.id, nextSort.desc === true ? 'desc' : 'asc')
      },
    },
    selectNoInternalTableState,
  )
}
