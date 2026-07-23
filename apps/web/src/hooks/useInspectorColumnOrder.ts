import { useState } from "react";

interface UseInspectorColumnOrderOptions {
  columnIds: string[];
  tableKey: string;
}

interface UseInspectorColumnOrderResult {
  columnOrder: string[];
  setColumnOrder: (columnIds: string[]) => void;
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

export function useInspectorColumnOrder({
  columnIds,
  tableKey,
}: UseInspectorColumnOrderOptions): UseInspectorColumnOrderResult {
  const storageKey = `inspector:column-order:${tableKey}`;
  // Use lazy initialization to expose persisted order directly, without an effect-synchronized intermediate state.
  const [columnOrder, setColumnOrderState] = useState<string[]>(() => {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === null) {
      return [...columnIds];
    }

    try {
      const parsedValue = JSON.parse(storedValue) as unknown;
      return Array.isArray(parsedValue) === true &&
        parsedValue.every((value) => typeof value === "string")
        ? normalizeColumnOrder(parsedValue, columnIds)
        : [...columnIds];
    } catch {
      return [...columnIds];
    }
  });

  const setColumnOrder = (nextColumnIds: string[]) => {
    const nextColumnOrder = normalizeColumnOrder(nextColumnIds, columnIds);
    setColumnOrderState((currentColumnOrder) =>
      areColumnOrdersEqual(currentColumnOrder, nextColumnOrder) === true
        ? currentColumnOrder
        : nextColumnOrder,
    );
    window.localStorage.setItem(storageKey, JSON.stringify(nextColumnOrder));
  };

  return { columnOrder, setColumnOrder };
}
