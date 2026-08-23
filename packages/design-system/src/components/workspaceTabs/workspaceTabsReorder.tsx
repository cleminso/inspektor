import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import {
  Accessibility,
  AutoScroller,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { useMemo, type ReactNode, type RefObject } from 'react'

import {
  WorkspaceTabsReorderContext,
  getReorderedWorkspaceTabsValues,
  type WorkspaceTabsSortableItemProps,
  type WorkspaceTabsValue,
} from './workspaceTabsReorderContext'

export interface WorkspaceTabsReorderProps {
  children: ReactNode
  listRef: RefObject<HTMLDivElement | null>
  values: readonly WorkspaceTabsValue[]
  onReorder: (values: WorkspaceTabsValue[]) => void
}

const workspaceTabsPointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({ value: 4 })],
  preventActivation: (event) => {
    if (event.pointerType === 'touch') {
      return true
    }
    if (!(event.target instanceof Element)) {
      return false
    }
    return (
      event.target.closest('[data-slot="workspace-tabs-close"]') !== null ||
      event.target.closest('[contenteditable="true"]') !== null
    )
  },
})

const workspaceTabsSensors = [workspaceTabsPointerSensor]

// Keep sortable ownership declarative: the hook's ref belongs to the WorkspaceTabs.Tab for this value.
// Do not replace this with DOM discovery or an external `element`; that caused cross-tab movement.
function SortableWorkspaceTabsItem({
  children,
  disabled,
  index,
  value,
}: WorkspaceTabsSortableItemProps) {
  const sortable = useSortable({
    id: value,
    index,
    disabled: {
      draggable: disabled === true,
      droppable: false,
    },
  })

  return children({
    isDragSource: sortable.isDragSource,
    setReorderRef: sortable.ref,
  })
}

export function WorkspaceTabsReorder({
  children,
  listRef,
  values,
  onReorder,
}: WorkspaceTabsReorderProps) {
  const valueIndices = useMemo(
    () => new Map(values.map((value, index) => [value, index])),
    [values],
  )
  const reorderContext = useMemo(
    () => ({
      getIndex: (value: WorkspaceTabsValue) => valueIndices.get(value) ?? -1,
      Item: SortableWorkspaceTabsItem,
    }),
    [valueIndices],
  )
  const modifiers = useMemo(
    () => [
      RestrictToHorizontalAxis,
      RestrictToElement.configure({ element: () => listRef.current }),
    ],
    [listRef],
  )

  return (
    <WorkspaceTabsReorderContext.Provider value={reorderContext}>
      <DragDropProvider
        sensors={workspaceTabsSensors}
        modifiers={modifiers}
        plugins={(defaults) => [
          ...defaults.filter((plugin) => plugin !== Accessibility),
          AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
          Feedback.configure({ dropAnimation: null }),
        ]}
        onDragEnd={(event) => {
          if (event.canceled === true) {
            return
          }
          const source = event.operation.source
          if (isSortable(source) === false) {
            return
          }
          const tab = source.element?.querySelector('[data-slot="workspace-tabs-tab"]')
          if (tab instanceof HTMLButtonElement && tab.disabled === false) {
            tab.click()
          }
          const reorderedValues = getReorderedWorkspaceTabsValues(values, source.id, source.index)
          if (reorderedValues !== null) {
            onReorder(reorderedValues)
          }
        }}
      >
        {children}
      </DragDropProvider>
    </WorkspaceTabsReorderContext.Provider>
  )
}
