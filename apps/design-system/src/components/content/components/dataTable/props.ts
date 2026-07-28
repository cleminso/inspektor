export const dataTableRootPropNames = [
  'table',
  'density',
  'activeRowId',
  'activeColumnId',
  'activeCell',
  'selectedCells',
  'onRowActivate',
  'onColumnActivate',
  'onCellActivate',
  'onRowContextMenu',
  'onHeaderContextMenu',
  'onCellContextMenu',
  'columnOrder',
  'onColumnOrderChange',
  'children',
] as const

export const dataTableTablePropNames = ['aria-label', 'children'] as const
export const dataTableContentPropNames = [
  'loading',
  'loadingContent',
  'emptyContent',
] as const
export const dataTablePartPropNames = ['children'] as const
export const dataTableHeaderRowPropNames = ['headerGroup', 'children'] as const
export const dataTableHeaderCellPropNames = ['header', 'children'] as const
export const dataTableRowPropNames = ['row', 'children'] as const
export const dataTableCellPropNames = ['cell', 'children'] as const
export const dataTableExpandedRowPropNames = ['row', 'children'] as const
