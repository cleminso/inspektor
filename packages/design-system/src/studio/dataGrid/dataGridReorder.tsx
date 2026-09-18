import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import {
  Accessibility,
  AutoScroller,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react'

import {
  DataGridReorderContext,
  type DataGridColumnRegion,
  type DataGridHeaderSortableProps,
} from './dataGridReorderContext'

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
  columnOrders: Readonly<Record<DataGridColumnRegion, readonly string[]>>
  onColumnOrderChange: (region: DataGridColumnRegion, columnIds: string[]) => void
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
    const target = event.target as Element | null
    if (typeof target?.closest !== 'function') {
      return false
    }
    return (
      target.closest(
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
function getRegionFromColumnSortableType(type: unknown): DataGridColumnRegion | null {
  if (type === 'column:start') {
    return 'start'
  }
  if (type === 'column:center') {
    return 'center'
  }
  if (type === 'column:end') {
    return 'end'
  }
  return null
}

function DataGridSortableHeader({
  children,
  columnId,
  index,
  region,
}: DataGridHeaderSortableProps) {
  const sortableType = `column:${region}`
  const sortable = useSortable({
    accept: sortableType,
    id: getDataGridHeaderSortableId(columnId),
    index,
    disabled: {
      draggable: false,
      droppable: false,
    },
    plugins: dataGridSortablePlugins,
    transition: dataGridSortableTransition,
    type: sortableType,
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

const reorderContext = { Header: DataGridSortableHeader }

export function DataGridReorder({
  children,
  columnOrders,
  onColumnOrderChange,
  overlayProps,
  renderOverlay,
  rootRef,
}: DataGridReorderProps) {
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
          ...defaults.filter((plugin) => plugin !== Accessibility),
          AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
        ]}
        onDragEnd={(event) => {
          const source = event.operation.source
          const target = event.operation.target
          const region = getRegionFromColumnSortableType(source?.type)
          if (
            event.canceled === true ||
            source === null ||
            target === null ||
            region === null ||
            target.type !== source.type
          ) {
            return
          }

          const columnOrder = columnOrders[region]
          const sourceColumnId = getColumnIdFromHeaderSortableId(source.id)
          const targetColumnId = getColumnIdFromHeaderSortableId(target.id)
          if (
            sourceColumnId === null ||
            targetColumnId === null ||
            columnOrder.includes(sourceColumnId) === false ||
            columnOrder.includes(targetColumnId) === false
          ) {
            return
          }
          const sortableColumnOrder = columnOrder.map(getDataGridHeaderSortableId)
          const nextSortableColumnOrder = move(sortableColumnOrder, event)
          const nextColumnOrder = nextSortableColumnOrder.flatMap((sortableId) => {
            const columnId = getColumnIdFromHeaderSortableId(sortableId)
            return columnId === null ? [] : [columnId]
          })
          if (areColumnOrdersEqual(columnOrder, nextColumnOrder) === false) {
            onColumnOrderChange(region, nextColumnOrder)
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
