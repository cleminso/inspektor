import { createContext, type ComponentType, type ReactNode } from 'react'

export type WorkspaceTabsValue = string | number

export function getReorderedWorkspaceTabsValues(
  values: readonly WorkspaceTabsValue[],
  sourceValue: WorkspaceTabsValue,
  destinationIndex: number,
): WorkspaceTabsValue[] | null {
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

export interface WorkspaceTabsSortableState {
  isDragSource: boolean
  setReorderRef: (element: HTMLDivElement | null) => void
}

export interface WorkspaceTabsSortableItemProps {
  children: (state: WorkspaceTabsSortableState) => ReactNode
  disabled?: boolean
  index: number
  value: WorkspaceTabsValue
}

export interface WorkspaceTabsReorderContextValue {
  getIndex: (value: WorkspaceTabsValue) => number
  Item: ComponentType<WorkspaceTabsSortableItemProps> | null
}

export const WorkspaceTabsReorderContext = createContext<WorkspaceTabsReorderContextValue>({
  getIndex: () => -1,
  Item: null,
})
