import type { ColumnDescriptor } from "jazz-tools";

import { formatColumnTypeName } from "@/components/table-explorer/data/columnTypePresentation";
import {
  createColumnJsonViewValue,
  isJsonViewContainer,
  type InspectorJsonObject,
  type InspectorJsonValue,
} from "@/components/table-explorer/data/jsonViewValue";

export type BooleanFieldValue = "true" | "false" | "null";

export function formatColumnTypeLabel(column: ColumnDescriptor | null): string | null {
  return column === null ? null : formatColumnTypeName(column.column_type);
}

export function formatTimestampInputValue(valueText: string): string | null {
  const trimmedValue = valueText.trim();
  if (trimmedValue.length === 0) {
    return "";
  }

  const epochMilliseconds = Number(trimmedValue);
  if (Number.isFinite(epochMilliseconds) === false) {
    return valueText;
  }
  const date = new Date(epochMilliseconds);
  if (Number.isNaN(date.getTime()) === true) {
    return null;
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${datePart}T${timePart}`;
}

export function formatColumnNameLabel(columnName: string): string {
  if (columnName.length === 0) {
    return columnName;
  }

  return `${columnName.slice(0, 1).toUpperCase()}${columnName.slice(1)}`;
}

export function isStructuredColumn(column: ColumnDescriptor | null): boolean {
  return (
    column?.column_type.type === "Json" ||
    column?.column_type.type === "Array" ||
    column?.column_type.type === "Row"
  );
}

export function getBooleanFieldValue(fieldState: {
  isNull: boolean;
  text: string;
}): BooleanFieldValue {
  if (fieldState.isNull === true) {
    return "null";
  }

  return fieldState.text === "true" ? "true" : "false";
}

export function safelySerializeStructuredValue(
  value: unknown,
  column: ColumnDescriptor,
):
  | { source: string; fallback: null }
  | { source: null; fallback: InspectorJsonObject | InspectorJsonValue[] | null } {
  const createFallback = (): InspectorJsonObject | InspectorJsonValue[] | null => {
    const fallback = createColumnJsonViewValue(value, column.column_type);
    return isJsonViewContainer(fallback) === true ? fallback : null;
  };

  try {
    const source = JSON.stringify(
      value,
      (_key, candidate: unknown) => {
        if (candidate instanceof Uint8Array) {
          return { $type: "bytes", byteLength: candidate.byteLength };
        }
        if (
          candidate !== null &&
          typeof candidate === "object" &&
          Array.isArray(candidate) === false
        ) {
          const prototype = Object.getPrototypeOf(candidate);
          if (prototype !== Object.prototype && prototype !== null) {
            throw new TypeError("Unsupported structured runtime value");
          }
        }
        return candidate;
      },
      2,
    );

    if (source === undefined) {
      return { source: null, fallback: createFallback() };
    }

    return { source, fallback: null };
  } catch {
    try {
      return { source: null, fallback: createFallback() };
    } catch {
      return { source: null, fallback: null };
    }
  }
}
