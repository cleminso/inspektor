import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { AutoScroller, Feedback, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { arrayMove } from '@dnd-kit/helpers'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { useMemo, type ReactNode, type RefObject } from 'react'

import {
  TabViewReorderContext,
  type TabViewSortableItemProps,
  type TabViewValue,
} from './tabViewReorderContext'

export interface TabViewReorderProps {
  children: ReactNode
  listRef: RefObject<HTMLDivElement | null>
  values: readonly TabViewValue[]
  onReorder: (values: TabViewValue[]) => void
}

const tabViewPointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({ value: 4 })],
  preventActivation: (event) => {
    if (event.pointerType === 'touch') {
      return true
    }
    if (!(event.target instanceof Element)) {
      return false
    }
    return (
      event.target.closest('[data-slot="tab-view-close"]') !== null ||
      event.target.closest('[contenteditable="true"]') !== null
    )
  },
})

const tabViewSensors = [tabViewPointerSensor]

function getReorderedValues(
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
  return arrayMove([...values], sourceIndex, destinationIndex)
}

// Keep sortable ownership declarative: the hook's ref belongs to the TabView.Item for this value.
// Do not replace this with DOM discovery or an external `element`; that caused cross-tab movement.
function SortableTabViewItem({ children, disabled, index, value }: TabViewSortableItemProps) {
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

export function TabViewReorder({ children, listRef, values, onReorder }: TabViewReorderProps) {
  const valueIndices = useMemo(
    () => new Map(values.map((value, index) => [value, index])),
    [values],
  )
  const reorderContext = useMemo(
    () => ({
      getIndex: (value: TabViewValue) => valueIndices.get(value) ?? -1,
      Item: SortableTabViewItem,
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
    <TabViewReorderContext.Provider value={reorderContext}>
      <DragDropProvider
        sensors={tabViewSensors}
        modifiers={modifiers}
        plugins={(defaults) => [
          ...defaults,
          AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
          Feedback.configure({ dropAnimation: null }),
        ]}
        onDragStart={(event) => {
          const tab = event.operation.source?.element?.querySelector('[data-slot="tab-view-tab"]')
          if (tab instanceof HTMLButtonElement && tab.disabled === false) {
            tab.click()
          }
        }}
        onDragEnd={(event) => {
          if (event.canceled === true) {
            return
          }
          const source = event.operation.source
          if (isSortable(source) === false) {
            return
          }
          const reorderedValues = getReorderedValues(values, source.id, source.index)
          if (reorderedValues !== null) {
            onReorder(reorderedValues)
          }
        }}
      >
        {children}
      </DragDropProvider>
    </TabViewReorderContext.Provider>
  )
}
