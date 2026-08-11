import { createContext, type ComponentType, type ReactNode } from 'react'

export type TabViewValue = string | number

export function getReorderedTabViewValues(
  values: readonly TabViewValue[],
  sourceValue: TabViewValue,
  destinationIndex: number,
): TabViewValue[] | null {
  const sourceIndex = values.indexOf(sourceValue)
  if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= values.length) {
    return null
  }
  if (sourceIndex === destinationIndex) {
    return null
  }

  const reorderedValues = [...values]
  const [source] = reorderedValues.splice(sourceIndex, 1)
  if (source === undefined) {
    return null
  }
  reorderedValues.splice(destinationIndex, 0, source)
  return reorderedValues
}

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
