import type { ColumnDescriptor } from "jazz-tools";

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
  switch (columnType.type) {
    case "Text":
      return { label: "Text", symbol: "T" };
    case "Integer":
      return { label: "Integer", symbol: "#" };
    case "BigInt":
      return { label: "BigInt", symbol: "#" };
    case "Double":
      return { label: "Float", symbol: "F" };
    case "Boolean":
      return { label: "Boolean", symbol: "B" };
    case "Timestamp":
      return { label: "Timestamp", symbol: "TS" };
    case "Bytea":
      return { label: "Binary", symbol: "BIN" };
    case "Uuid":
      return { label: "UUID", symbol: "ID" };
    case "Enum":
      return { label: "Enum", symbol: "E" };
    case "Json":
      return columnType.schema === undefined
        ? { label: "JSON", symbol: "{ }" }
        : { label: "Typed JSON", symbol: "{T}" };
    case "Row":
      return { label: "Row", symbol: "{…}" };
    case "Array":
      return { label: "Array", symbol: "[ ]" };
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
