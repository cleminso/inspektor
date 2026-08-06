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

export interface DataGridReorderContextValue {
  Header: ComponentType<DataGridHeaderSortableProps> | null;
}

export const DataGridReorderContext = createContext<DataGridReorderContextValue>({
  Header: null,
});

export function useDataGridReorderContext(): DataGridReorderContextValue {
  return use(DataGridReorderContext);
}
