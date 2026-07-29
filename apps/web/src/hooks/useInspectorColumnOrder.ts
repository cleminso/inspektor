import { useCallback, useState } from "react";

interface UseInspectorColumnOrderOptions {
  columnIds: string[];
  tableKey: string;
}

interface UseInspectorColumnOrderResult {
  columnOrder: string[];
  setColumnOrder: (columnIds: string[]) => void;
}

export type ColumnMoveDirection = "end" | "left" | "right" | "start";

export function moveColumnInOrder(
  columnOrder: readonly string[],
  columnId: string,
  direction: ColumnMoveDirection,
  visibleColumnOrder: readonly string[] = columnOrder,
): string[] {
  const currentIndex = columnOrder.indexOf(columnId);
  const visibleIndex = visibleColumnOrder.indexOf(columnId);
  if (currentIndex < 0 || visibleIndex < 0) {
    return [...columnOrder];
  }

  const lastVisibleIndex = visibleColumnOrder.length - 1;
  const nextVisibleIndex =
    direction === "start"
      ? 0
      : direction === "end"
        ? lastVisibleIndex
        : direction === "left"
          ? Math.max(visibleIndex - 1, 0)
          : Math.min(visibleIndex + 1, lastVisibleIndex);
  const targetColumnId = visibleColumnOrder[nextVisibleIndex];
  if (targetColumnId === undefined || targetColumnId === columnId) {
    return [...columnOrder];
  }
  const nextIndex = columnOrder.indexOf(targetColumnId);

  const nextColumnOrder = [...columnOrder];
  const [column] = nextColumnOrder.splice(currentIndex, 1);
  if (column !== undefined) {
    nextColumnOrder.splice(nextIndex, 0, column);
  }
  return nextColumnOrder;
}

function areColumnOrdersEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((columnId, index) => columnId === right[index]);
}

export function normalizeColumnOrder(
  candidateColumnIds: readonly string[],
  knownColumnIds: readonly string[],
): string[] {
  const knownColumnIdSet = new Set(knownColumnIds);
  const includedColumnIds = new Set<string>();
  const normalizedColumnIds: string[] = [];

  for (const columnId of candidateColumnIds) {
    if (knownColumnIdSet.has(columnId) === true && includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId);
      normalizedColumnIds.push(columnId);
    }
  }

  for (const columnId of knownColumnIds) {
    if (includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId);
      normalizedColumnIds.push(columnId);
    }
  }

  return normalizedColumnIds;
}

function readColumnOrder(storageKey: string, columnIds: string[]): string[] {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === null) {
      return [...columnIds];
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return Array.isArray(parsedValue) === true &&
      parsedValue.every((value) => typeof value === "string")
      ? normalizeColumnOrder(parsedValue, columnIds)
      : [...columnIds];
  } catch {
    return [...columnIds];
  }
}

export function useInspectorColumnOrder({
  columnIds,
  tableKey,
}: UseInspectorColumnOrderOptions): UseInspectorColumnOrderResult {
  const storageKey = `inspector:column-order:${tableKey}`;
  // Use lazy initialization to expose persisted order directly, without an effect-synchronized intermediate state.
  const [columnOrder, setColumnOrderState] = useState<string[]>(() =>
    readColumnOrder(storageKey, columnIds),
  );

  const setColumnOrder = useCallback(
    (nextColumnIds: string[]) => {
      const nextColumnOrder = normalizeColumnOrder(nextColumnIds, columnIds);
      setColumnOrderState((currentColumnOrder) =>
        areColumnOrdersEqual(currentColumnOrder, nextColumnOrder) === true
          ? currentColumnOrder
          : nextColumnOrder,
      );
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextColumnOrder));
      } catch {
        return;
      }
    },
    [columnIds, storageKey],
  );

  return { columnOrder, setColumnOrder };
}
