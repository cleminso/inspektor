import type { ColumnDescriptor } from "jazz-tools";

import { formatColumnTypeName } from "@/components/table-explorer/data/columnTypePresentation";
import type { TableColumnMeta } from "@/types/tableExplorer";

export type ColumnTypeMarkerIcon = "key" | "relation";

export interface ColumnTypeMarker {
  icon: ColumnTypeMarkerIcon | null;
  label: string;
  suffix: string;
}

interface BaseMarker {
  label: string;
  symbol: string;
}

function getBaseMarker(columnType: ColumnDescriptor["column_type"]): BaseMarker {
  const label = formatColumnTypeName(columnType);

  switch (columnType.type) {
    case "Text":
      return { label, symbol: "T" };
    case "Integer":
      return { label, symbol: "#" };
    case "BigInt":
      return { label, symbol: "#" };
    case "Double":
      return { label, symbol: "F" };
    case "Boolean":
      return { label, symbol: "B" };
    case "Timestamp":
      return { label, symbol: "TS" };
    case "Bytea":
      return { label, symbol: "BIN" };
    case "Uuid":
      return { label, symbol: "ID" };
    case "Enum":
      return { label, symbol: "E" };
    case "Json":
      return { label, symbol: columnType.schema === undefined ? "{ }" : "{T}" };
    case "Row":
      return { label, symbol: "{…}" };
    case "Array":
      return { label, symbol: "[ ]" };
  }
}

export function getColumnTypeMarker(column: TableColumnMeta): ColumnTypeMarker {
  if (column.id === "id" && column.column === null) {
    return { icon: "key", label: "Row ID", suffix: "" };
  }

  if (column.column === null) {
    return { icon: null, label: "Inspector column", suffix: "" };
  }

  const type = column.column.column_type;
  const isScalarReference = type.type === "Uuid" && column.column.references !== undefined;
  const isReferenceArray =
    type.type === "Array" &&
    type.element.type === "Uuid" &&
    column.column.references !== undefined;

  if (isScalarReference === true || isReferenceArray === true) {
    return {
      icon: "relation",
      label: "Reference",
      suffix: "",
    };
  }

  const baseMarker = getBaseMarker(type);
  return {
    icon: null,
    label: baseMarker.label,
    suffix: baseMarker.symbol,
  };
}
