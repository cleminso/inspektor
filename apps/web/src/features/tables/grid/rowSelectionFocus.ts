import type { TableRowId } from "@tables/tableTypes";

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
