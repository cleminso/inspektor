import type { ColumnDescriptor } from "jazz-tools";

const columnTypeLabels = {
  Array: "Array",
  BigInt: "BigInt",
  Boolean: "Boolean",
  Bytea: "Binary",
  Double: "Float",
  Enum: "Enum",
  Integer: "Integer",
  Json: "JSON",
  Row: "Row",
  Text: "Text",
  Timestamp: "Timestamp",
  Uuid: "UUID",
} satisfies Record<ColumnDescriptor["column_type"]["type"], string>;

export function formatColumnTypeName(columnType: ColumnDescriptor["column_type"]): string {
  return columnType.type === "Json" && columnType.schema !== undefined
    ? "Typed JSON"
    : columnTypeLabels[columnType.type];
}
