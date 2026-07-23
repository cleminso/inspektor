import type {
  DataTableCellSelectionMode,
  DataTableCellTarget,
} from "@inspector/ds";

interface UpdateCellSelectionOptions {
  anchorCell: DataTableCellTarget | null;
  columnIds: string[];
  mode: DataTableCellSelectionMode;
  rowIds: string[];
  selectedCells: DataTableCellTarget[];
  target: DataTableCellTarget;
}

export interface CellSelectionState {
  activeCell: DataTableCellTarget | null;
  anchorCell: DataTableCellTarget | null;
  selectedCells: DataTableCellTarget[];
}

function isSameCell(left: DataTableCellTarget, right: DataTableCellTarget): boolean {
  return left.rowId === right.rowId && left.columnId === right.columnId;
}

function createRangeSelection({
  anchorCell,
  columnIds,
  rowIds,
  target,
}: Pick<UpdateCellSelectionOptions, "anchorCell" | "columnIds" | "rowIds" | "target">) {
  if (anchorCell === null) {
    return [target];
  }

  const anchorRowIndex = rowIds.indexOf(anchorCell.rowId);
  const targetRowIndex = rowIds.indexOf(target.rowId);
  const anchorColumnIndex = columnIds.indexOf(anchorCell.columnId);
  const targetColumnIndex = columnIds.indexOf(target.columnId);
  if (
    anchorRowIndex < 0 ||
    targetRowIndex < 0 ||
    anchorColumnIndex < 0 ||
    targetColumnIndex < 0
  ) {
    return [target];
  }

  const firstRowIndex = Math.min(anchorRowIndex, targetRowIndex);
  const lastRowIndex = Math.max(anchorRowIndex, targetRowIndex);
  const firstColumnIndex = Math.min(anchorColumnIndex, targetColumnIndex);
  const lastColumnIndex = Math.max(anchorColumnIndex, targetColumnIndex);
  const range: DataTableCellTarget[] = [];

  for (let rowIndex = firstRowIndex; rowIndex <= lastRowIndex; rowIndex += 1) {
    const rowId = rowIds[rowIndex];
    if (rowId === undefined) {
      continue;
    }

    for (
      let columnIndex = firstColumnIndex;
      columnIndex <= lastColumnIndex;
      columnIndex += 1
    ) {
      const columnId = columnIds[columnIndex];
      if (columnId !== undefined) {
        range.push({ columnId, rowId });
      }
    }
  }

  return range;
}

export function updateCellSelection({
  anchorCell,
  columnIds,
  mode,
  rowIds,
  selectedCells,
  target,
}: UpdateCellSelectionOptions): CellSelectionState {
  if (mode === "replace") {
    return { activeCell: target, anchorCell: target, selectedCells: [target] };
  }

  if (mode === "range") {
    return {
      activeCell: target,
      anchorCell: anchorCell ?? target,
      selectedCells: createRangeSelection({ anchorCell, columnIds, rowIds, target }),
    };
  }

  const targetIndex = selectedCells.findIndex((cell) => isSameCell(cell, target));
  if (targetIndex < 0) {
    return {
      activeCell: target,
      anchorCell: anchorCell ?? target,
      selectedCells: [...selectedCells, target],
    };
  }

  const nextSelectedCells = selectedCells.filter((_, index) => index !== targetIndex);
  return {
    activeCell: nextSelectedCells.at(-1) ?? null,
    anchorCell: anchorCell !== null && isSameCell(anchorCell, target) ? nextSelectedCells[0] ?? null : anchorCell,
    selectedCells: nextSelectedCells,
  };
}
