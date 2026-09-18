import {
  cellSelectionFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type RowData,
  type Table,
} from '@tanstack/react-table'

export const dataGridFeatures = tableFeatures({
  cellSelectionFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
})

export type DataGridFeatures = typeof dataGridFeatures
export type DataGridTable<TData extends RowData> = Table<DataGridFeatures, TData>
