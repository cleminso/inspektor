import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { AutoScroller, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react'

import { DataGridReorderContext, type DataGridHeaderSortableProps } from './dataGridReorderContext'

interface DataGridDragSource {
  element?: Element | null
  id: string | number
}

export function getDataGridHeaderSortableId(columnId: string): string {
  return JSON.stringify(['data-grid', 'header', columnId])
}

function getColumnIdFromHeaderSortableId(sortableId: string | number): string | null {
  if (typeof sortableId !== 'string') {
    return null
  }

  try {
    const value = JSON.parse(sortableId) as unknown
    return Array.isArray(value) === true &&
      value.length === 3 &&
      value[0] === 'data-grid' &&
      value[1] === 'header' &&
      typeof value[2] === 'string'
      ? value[2]
      : null
  } catch {
    return null
  }
}

export interface DataGridReorderProps {
  children: ReactNode
  columnOrder: readonly string[]
  onColumnOrderChange: (columnIds: string[]) => void
  overlayProps: { className?: string; style?: CSSProperties }
  renderOverlay: (source: DataGridDragSource) => ReactNode
  rootRef: RefObject<HTMLDivElement | null>
}

const dataGridPointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({ value: 4 })],
  preventActivation: (event) => {
    if (event.pointerType === 'touch') {
      return true
    }
    if (!(event.target instanceof Element)) {
      return false
    }
    return (
      event.target.closest(
        'a, button, input, select, textarea, [role="checkbox"], [data-slot="data-grid-resize-handle"]',
      ) !== null
    )
  },
})

const dataGridSensors = [dataGridPointerSensor]
const dataGridSortablePlugins = [SortableKeyboardPlugin]
const dataGridSortableTransition = { duration: 0 }

// Keep sortable ownership declarative: this ref belongs to the header that renders it.
// Do not replace this with DOM discovery; that makes reorder behavior depend on private markup.
function DataGridSortableHeader({ children, columnId, index }: DataGridHeaderSortableProps) {
  const sortable = useSortable({
    accept: 'column',
    id: getDataGridHeaderSortableId(columnId),
    index,
    disabled: {
      draggable: false,
      droppable: false,
    },
    plugins: dataGridSortablePlugins,
    transition: dataGridSortableTransition,
    type: 'column',
  })

  return children({
    isDragSource: sortable.isDragSource,
    isDropping: sortable.isDropping,
    setReorderRef: sortable.ref,
  })
}

function areColumnOrdersEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((columnId, index) => columnId === right[index])
}

export function DataGridReorder({
  children,
  columnOrder,
  onColumnOrderChange,
  overlayProps,
  renderOverlay,
  rootRef,
}: DataGridReorderProps) {
  const reorderContext = useMemo(() => ({ Header: DataGridSortableHeader }), [])
  const modifiers = useMemo(
    () => [
      RestrictToHorizontalAxis,
      RestrictToElement.configure({ element: () => rootRef.current }),
    ],
    [rootRef],
  )

  return (
    <DataGridReorderContext.Provider value={reorderContext}>
      <DragDropProvider
        sensors={dataGridSensors}
        modifiers={modifiers}
        plugins={(defaults) => [
          ...defaults,
          AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
        ]}
        onDragEnd={(event) => {
          if (event.canceled === true || event.operation.source?.type !== 'column') {
            return
          }

          const sortableColumnOrder = columnOrder.map(getDataGridHeaderSortableId)
          const nextSortableColumnOrder = move(sortableColumnOrder, event)
          const nextColumnOrder = nextSortableColumnOrder.flatMap((sortableId) => {
            const columnId = getColumnIdFromHeaderSortableId(sortableId)
            return columnId === null ? [] : [columnId]
          })
          if (areColumnOrdersEqual(columnOrder, nextColumnOrder) === false) {
            onColumnOrderChange(nextColumnOrder)
          }
        }}
      >
        {children}
        <DragOverlay
          {...overlayProps}
          dropAnimation={null}
        >
          {(source) => {
            const columnId = getColumnIdFromHeaderSortableId(source.id)
            return renderOverlay(columnId === null ? source : { ...source, id: columnId })
          }}
        </DragOverlay>
      </DragDropProvider>
    </DataGridReorderContext.Provider>
  )
}
