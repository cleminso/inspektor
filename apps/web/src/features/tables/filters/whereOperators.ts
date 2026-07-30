/**
 * Maps Jazz schema column types to supported Inspector filter operators.
 *
 * The explorer only exposes operators it can parse, serialize into URLs, and translate
 * into generic Jazz `where` input for the selected column type.
 */
import type { ColumnType } from "jazz-tools";

import type { TableFilterOperator } from "@tables/filters/tableFilters";

/** Minimal schema metadata needed to decide the operator support matrix. */
export interface WhereOperatorColumn {
  name: string;
  columnType: ColumnType;
  nullable: boolean;
  references?: string;
  implicitId?: boolean;
}

/** Keeps unsupported Jazz/operator combinations out of schema-driven filter controls. */
export function getSupportedWhereOperatorsForColumn(
  column: WhereOperatorColumn,
): TableFilterOperator[] {
  if (column.implicitId === true || column.name === "id") {
    return ["eq", "ne", "in"];
  }

  switch (column.columnType.type) {
    case "Text":
      return ["eq", "ne", "contains"];
    case "Boolean":
      return ["eq"];
    case "Integer":
    case "BigInt":
    case "Double":
      return ["eq", "ne", "gt", "gte", "lt", "lte"];
    case "Timestamp":
      return ["eq", "gt", "gte", "lt", "lte"];
    case "Uuid":
      if (column.references !== undefined) {
        return column.nullable === true ? ["eq", "ne", "isNull"] : ["eq", "ne"];
      }

      return ["eq", "ne", "in"];
    case "Bytea":
      return ["eq", "ne"];
    case "Json":
      return ["eq", "ne", "in"];
    case "Enum":
      return ["eq", "ne", "in"];
    case "Array":
      return ["eq", "contains"];
    default:
      return [];
  }
}
