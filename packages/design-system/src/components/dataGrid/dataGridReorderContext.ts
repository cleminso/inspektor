import { createContext, use, type ComponentType, type ReactNode } from "react";

export interface DataGridHeaderSortableState {
  isDragSource: boolean;
  isDropping: boolean;
  setReorderRef: (element: HTMLTableCellElement | null) => void;
}

export interface DataGridHeaderSortableProps {
  children: (state: DataGridHeaderSortableState) => ReactNode;
  columnId: string;
  index: number;
}

export interface DataGridCellDroppableProps {
  children: (setReorderRef: (element: HTMLTableCellElement | null) => void) => ReactNode;
  columnId: string;
  index: number;
  rowId: string;
}

export interface DataGridReorderContextValue {
  Cell: ComponentType<DataGridCellDroppableProps> | null;
  Header: ComponentType<DataGridHeaderSortableProps> | null;
}

export const DataGridReorderContext = createContext<DataGridReorderContextValue>({
  Cell: null,
  Header: null,
});

export function useDataGridReorderContext(): DataGridReorderContextValue {
  return use(DataGridReorderContext);
}
