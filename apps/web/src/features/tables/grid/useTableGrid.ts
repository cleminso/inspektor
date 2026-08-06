// creates TanStack `Table` instance
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

import { dataGridFeatures, type DataGridTable } from '@inspector/ds'

import { buildDataGridColumns } from '@tables/grid/buildColumns'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import type { ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import type { RowSelectionRequest } from '@tables/grid/buildColumns'
import type {
  TableColumnMeta,
  TableColumnVisibilityState,
  TableRowId,
  TableSortDirection,
} from '@tables/tableTypes'

interface UseTableGridOptions {
  cellSelection: CellSelectionState
  columnOrder: string[]
  columnVisibility: TableColumnVisibilityState
  columns: TableColumnMeta[]
  onColumnMenuOpen: (columnId: string) => void
  onColumnMove: (columnId: string, direction: ColumnMoveDirection) => void
  onColumnOrderChange: OnChangeFn<ColumnOrderState>
  onColumnVisibilityChange: (next: TableColumnVisibilityState) => void
  onCellSelectionChange: OnChangeFn<CellSelectionState>
  onSelectedRowIdsChange: (rowIds: TableRowId[], request: RowSelectionRequest | null) => void
  onSortChange: (columnId: string, direction: TableSortDirection) => void
  rows: DynamicTableRow[]
  selectedRowIds: TableRowId[]
  sortColumn: string
  sortDirection: TableSortDirection
}

const selectNoInternalTableState = () => null

export function useTableGrid({
  cellSelection,
  columnOrder,
  columnVisibility,
  columns,
  onColumnMenuOpen,
  onColumnMove,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onCellSelectionChange,
  onSelectedRowIdsChange,
  onSortChange,
  rows,
  selectedRowIds,
  sortColumn,
  sortDirection,
}: UseTableGridOptions): DataGridTable<DynamicTableRow> {
  const rowSelectionRequestRef = useRef<RowSelectionRequest | null>(null)
  const columnDefs = useMemo(
    () =>
      buildDataGridColumns({
        columns,
        onColumnMenuOpen,
        onColumnMove,
        onRowSelectionRequest: (request) => {
          rowSelectionRequestRef.current = request
        },
      }),
    [columns, onColumnMenuOpen, onColumnMove],
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
      getRowId: (row) => String(row.id),
      autoResetCellSelection: false,
      columnResizeMode: 'onChange',
      enableRowSelection: true,
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
        const request = rowSelectionRequestRef.current
        rowSelectionRequestRef.current = null

        onSelectedRowIdsChange(nextSelectedRowIds, request)
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
