import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { AutoScroller, PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

import {
  DataTableReorderContext,
  type DataTableCellDroppableProps,
  type DataTableHeaderSortableProps,
} from "./dataTableReorderContext";

interface DataTableDragSource {
  element?: Element | null;
  id: string | number;
}

export interface DataTableReorderProps {
  children: ReactNode;
  columnOrder: readonly string[];
  onColumnOrderChange: (columnIds: string[]) => void;
  overlayProps: { className?: string; style?: CSSProperties };
  renderOverlay: (source: DataTableDragSource) => ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
}

const dataTablePointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({ value: 4 })],
  preventActivation: (event) => {
    if (event.pointerType === "touch") {
      return true;
    }
    if (!(event.target instanceof Element)) {
      return false;
    }
    return (
      event.target.closest(
        'a, button, input, select, textarea, [role="checkbox"], [data-slot="data-table-resize-handle"]',
      ) !== null
    );
  },
});

const dataTableSensors = [dataTablePointerSensor];

// Keep sortable ownership declarative: these refs belong to the header and cell that render them.
// Do not replace this with DOM discovery; that makes reorder behavior depend on private markup.
function DataTableSortableHeader({ children, columnId, index }: DataTableHeaderSortableProps) {
  const sortable = useSortable({
    accept: "column",
    id: columnId,
    index,
    disabled: {
      draggable: false,
      droppable: false,
    },
    type: "column",
  });

  return children({
    isDragSource: sortable.isDragSource,
    isDropping: sortable.isDropping,
    setReorderRef: sortable.ref,
  });
}

function DataTableDroppableCell({ children, columnId, index, rowId }: DataTableCellDroppableProps) {
  const sortable = useSortable({
    accept: "column-cell",
    id: `${rowId}:${columnId}`,
    index,
    group: `data-table-row:${rowId}`,
    disabled: {
      draggable: true,
      droppable: false,
    },
    type: "column-cell",
  });

  return children(sortable.targetRef);
}

function areColumnOrdersEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((columnId, index) => columnId === right[index]);
}

export function DataTableReorder({
  children,
  columnOrder,
  onColumnOrderChange,
  overlayProps,
  renderOverlay,
  rootRef,
}: DataTableReorderProps) {
  const initialColumnOrderRef = useRef<readonly string[]>([]);
  const reorderContext = useMemo(
    () => ({ Cell: DataTableDroppableCell, Header: DataTableSortableHeader }),
    [],
  );
  const modifiers = useMemo(
    () => [
      RestrictToHorizontalAxis,
      RestrictToElement.configure({ element: () => rootRef.current }),
    ],
    [rootRef],
  );

  return (
    <DataTableReorderContext.Provider value={reorderContext}>
      <DragDropProvider
        sensors={dataTableSensors}
        modifiers={modifiers}
        plugins={(defaults) => [
          ...defaults,
          AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
        ]}
        onDragStart={() => {
          initialColumnOrderRef.current = columnOrder;
        }}
        onDragOver={(event) => {
          if (event.operation.source?.type !== "column") {
            return;
          }
          const nextColumnOrder = move([...columnOrder], event);
          if (areColumnOrdersEqual(columnOrder, nextColumnOrder) === false) {
            onColumnOrderChange(nextColumnOrder);
          }
        }}
        onDragEnd={(event) => {
          if (event.canceled === false) {
            return;
          }
          const initialColumnOrder = initialColumnOrderRef.current;
          if (areColumnOrdersEqual(columnOrder, initialColumnOrder) === false) {
            onColumnOrderChange([...initialColumnOrder]);
          }
        }}
      >
        {children}
        <DragOverlay {...overlayProps} dropAnimation={null}>
          {(source) => renderOverlay(source)}
        </DragOverlay>
      </DragDropProvider>
    </DataTableReorderContext.Provider>
  );
}
