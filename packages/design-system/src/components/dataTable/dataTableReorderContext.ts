import { createContext, use, type ComponentType, type ReactNode } from "react";

export interface DataTableHeaderSortableState {
  isDragSource: boolean;
  isDropping: boolean;
  setReorderRef: (element: HTMLTableCellElement | null) => void;
}

export interface DataTableHeaderSortableProps {
  children: (state: DataTableHeaderSortableState) => ReactNode;
  columnId: string;
  index: number;
}

export interface DataTableCellDroppableProps {
  children: (setReorderRef: (element: HTMLTableCellElement | null) => void) => ReactNode;
  columnId: string;
  index: number;
  rowId: string;
}

export interface DataTableReorderContextValue {
  Cell: ComponentType<DataTableCellDroppableProps> | null;
  Header: ComponentType<DataTableHeaderSortableProps> | null;
}

export const DataTableReorderContext = createContext<DataTableReorderContextValue>({
  Cell: null,
  Header: null,
});

export function useDataTableReorderContext(): DataTableReorderContextValue {
  return use(DataTableReorderContext);
}
