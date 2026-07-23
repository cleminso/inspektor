import { createContext, use } from 'react'

import type { RowData, Table } from '@tanstack/react-table'

import type {
  DataTableCellTarget,
  DataTableDensity,
  DataTableHeaderContextMenuHandler,
  DataTableRowContextMenuHandler,
  DataTableCellContextMenuHandler,
} from './dataTable'

export interface DataTableContextValue<TData extends RowData> {
  activeCell: DataTableCellTarget | null
  activeColumnId: string | null
  activeRowId: string | null
  density: DataTableDensity
  onCellActivate?: (target: DataTableCellTarget) => void
  onCellContextMenu?: DataTableCellContextMenuHandler
  onColumnActivate?: (columnId: string | null) => void
  onHeaderContextMenu?: DataTableHeaderContextMenuHandler
  onRowActivate?: (rowId: string) => void
  onRowContextMenu?: DataTableRowContextMenuHandler
  columnReorderEnabled: boolean
  getColumnReorderIndex: (columnId: string) => number
  table: Table<TData>
}

export const DataTableContext = createContext<DataTableContextValue<RowData> | null>(null)

export function useDataTableContext<TData extends RowData>(): DataTableContextValue<TData> {
  const context = use(DataTableContext)

  if (context === null) {
    throw new Error('DataTable parts must be rendered inside DataTable.Root')
  }

  return context as DataTableContextValue<TData>
}
