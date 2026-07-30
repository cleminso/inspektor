export const dataGridRootPropNames = [
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
  'columnDragPreview',
  'columnOrder',
  'onColumnOrderChange',
  'children',
] as const

export const dataGridTablePropNames = ['aria-label', 'children'] as const
export const dataGridContentPropNames = [
  'loading',
  'loadingContent',
  'emptyContent',
] as const
export const dataGridPartPropNames = ['children'] as const
export const dataGridHeaderRowPropNames = ['headerGroup', 'children'] as const
export const dataGridHeaderCellPropNames = ['header', 'children'] as const
export const dataGridRowPropNames = ['row', 'children'] as const
export const dataGridCellPropNames = ['cell', 'children'] as const
export const dataGridExpandedRowPropNames = ['row', 'children'] as const
