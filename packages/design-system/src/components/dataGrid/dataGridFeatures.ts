import {
  cellSelectionFeature,
  columnOrderingFeature,
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
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
})

export type DataGridFeatures = typeof dataGridFeatures
export type DataGridTable<TData extends RowData> = Table<DataGridFeatures, TData>
