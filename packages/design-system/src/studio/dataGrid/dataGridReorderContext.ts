import { createContext, use, type ComponentType, type ReactNode } from 'react'

interface DataGridHeaderSortableState {
  isDragSource: boolean
  isDropping: boolean
  setReorderRef: (element: HTMLTableCellElement | null) => void
}

export type DataGridColumnRegion = 'center' | 'end' | 'start'

export interface DataGridHeaderSortableProps {
  children: (state: DataGridHeaderSortableState) => ReactNode
  columnId: string
  index: number
  region: DataGridColumnRegion
}

export interface DataGridReorderContextValue {
  Header: ComponentType<DataGridHeaderSortableProps> | null
}

export const DataGridReorderContext = createContext<DataGridReorderContextValue>({
  Header: null,
})

export function useDataGridReorderContext(): DataGridReorderContextValue {
  return use(DataGridReorderContext)
}
