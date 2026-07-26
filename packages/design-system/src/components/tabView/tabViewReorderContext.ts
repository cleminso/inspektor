import { createContext, type ComponentType, type ReactNode } from 'react'

export type TabViewValue = string | number

export interface TabViewSortableState {
  isDragSource: boolean
  setReorderRef: (element: HTMLDivElement | null) => void
}

export interface TabViewSortableItemProps {
  children: (state: TabViewSortableState) => ReactNode
  disabled?: boolean
  index: number
  value: TabViewValue
}

export interface TabViewReorderContextValue {
  getIndex: (value: TabViewValue) => number
  Item: ComponentType<TabViewSortableItemProps> | null
}

export const TabViewReorderContext = createContext<TabViewReorderContextValue>({
  getIndex: () => -1,
  Item: null,
})
