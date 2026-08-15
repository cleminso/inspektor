import type { DataGridCellTarget } from "@inspector/ds";

import { getFieldReadOnlyReason } from "@tables/rowEditor/mutation/parsing";
import type { TableColumnMeta } from "@tables/tableTypes";

export type InlineFieldRoute = "readOnly" | "rowPane" | "scalar" | "structured";
export type SpreadsheetCompletionDirection = "enter" | "tabBackward" | "tabForward";

export function getInlineFieldRoute(columnMeta: TableColumnMeta): InlineFieldRoute {
  const column = columnMeta.column;
  if (column === null) {
    return "readOnly";
  }
  if (column.references !== undefined || getFieldReadOnlyReason(column) === "binary") {
    return "rowPane";
  }
  if (
    column.column_type.type === "Array" ||
    column.column_type.type === "Json" ||
    column.column_type.type === "Row"
  ) {
    return "structured";
  }
  return "scalar";
}

export function resolveSpreadsheetCompletionTarget(
  rows: readonly (readonly DataGridCellTarget[])[],
  origin: DataGridCellTarget,
  direction: SpreadsheetCompletionDirection,
): DataGridCellTarget {
  const rowIndex = rows.findIndex((row) => row.some((target) => sameTarget(target, origin)));
  if (rowIndex < 0) {
    return origin;
  }

  if (direction === "enter") {
    return (
      rows[rowIndex + 1]?.find((target) => target.columnId === origin.columnId) ?? origin
    );
  }

  const targets = rows.flatMap((row) => row);
  const targetIndex = targets.findIndex((target) => sameTarget(target, origin));
  const offset = direction === "tabForward" ? 1 : -1;
  return targets[targetIndex + offset] ?? origin;
}

function sameTarget(left: DataGridCellTarget, right: DataGridCellTarget): boolean {
  return left.rowId === right.rowId && left.columnId === right.columnId;
}
