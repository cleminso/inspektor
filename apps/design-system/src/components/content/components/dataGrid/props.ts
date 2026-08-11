export const dataGridRootPropNames = [
  'table',
  'density',
  'activeRowId',
  'activeColumnId',
  'onRowActivate',
  'onColumnActivate',
  'onCellActivate',
  'onRowContextMenu',
  'onHeaderContextMenu',
  'onCellContextMenu',
  'columnDragPreview',
  'reorderableColumnIds',
  'children',
] as const

export const dataGridTablePropNames = ['aria-busy', 'aria-label', 'statusContent', 'children'] as const
export const dataGridContentPropNames = [
  'loading',
  'loadingContent',
  'rowRendering',
  'emptyContent',
] as const
export const dataGridPartPropNames = ['children'] as const
export const dataGridViewportPropNames = ['scrollResetKey', 'children'] as const
export const dataGridBodyPropNames = ['children'] as const
export const dataGridHeaderRowPropNames = ['headerGroup', 'children'] as const
export const dataGridHeaderCellPropNames = ['header', 'children'] as const
export const dataGridRowPropNames = ['row', 'children'] as const
export const dataGridCellPropNames = ['cell', 'children'] as const
export const dataGridExpandedRowPropNames = ['row', 'children'] as const
