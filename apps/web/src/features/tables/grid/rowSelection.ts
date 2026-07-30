import type { TableRowId } from "@tables/tableTypes";

interface UpdateRowSelectionOptions {
  anchorRowId: TableRowId | null;
  checked: boolean;
  rowIds: TableRowId[];
  selectedRowIds: TableRowId[];
  shiftKey: boolean;
  targetRowId: TableRowId;
}

interface RowSelectionUpdate {
  anchorRowId: TableRowId;
  selectedRowIds: TableRowId[];
}

export function getNearestSelectedRowId(
  rowIds: TableRowId[],
  selectedRowIds: TableRowId[],
  removedRowId: TableRowId,
): TableRowId | null {
  const removedIndex = rowIds.indexOf(removedRowId);
  if (removedIndex < 0 || selectedRowIds.length === 0) {
    return selectedRowIds[0] ?? null;
  }

  const selectedRows = new Set(selectedRowIds);
  for (let distance = 1; distance < rowIds.length; distance += 1) {
    const previousRowId = rowIds[removedIndex - distance];
    if (previousRowId !== undefined && selectedRows.has(previousRowId) === true) {
      return previousRowId;
    }

    const nextRowId = rowIds[removedIndex + distance];
    if (nextRowId !== undefined && selectedRows.has(nextRowId) === true) {
      return nextRowId;
    }
  }

  return null;
}

export function updateRowSelection({
  anchorRowId,
  checked,
  rowIds,
  selectedRowIds,
  shiftKey,
  targetRowId,
}: UpdateRowSelectionOptions): RowSelectionUpdate {
  const nextSelectedRowIds = new Set(selectedRowIds);
  const anchorIndex = anchorRowId === null ? -1 : rowIds.indexOf(anchorRowId);
  const targetIndex = rowIds.indexOf(targetRowId);

  if (shiftKey === true && anchorIndex >= 0 && targetIndex >= 0) {
    const rangeStart = Math.min(anchorIndex, targetIndex);
    const rangeEnd = Math.max(anchorIndex, targetIndex);

    for (const rowId of rowIds.slice(rangeStart, rangeEnd + 1)) {
      if (checked === true) {
        nextSelectedRowIds.add(rowId);
      } else {
        nextSelectedRowIds.delete(rowId);
      }
    }
  } else if (checked === true) {
    nextSelectedRowIds.add(targetRowId);
  } else {
    nextSelectedRowIds.delete(targetRowId);
  }

  return {
    anchorRowId:
      shiftKey === true && anchorIndex >= 0 && anchorRowId !== null
        ? anchorRowId
        : targetRowId,
    selectedRowIds: rowIds.filter((rowId) => nextSelectedRowIds.has(rowId) === true),
  };
}
