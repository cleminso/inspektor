import type { ColumnDescriptor, ColumnType } from "jazz-tools";

export type InspectorJsonPrimitive = null | boolean | number | string;
export type InspectorJsonObject = { readonly [key: string]: InspectorJsonValue };
export type InspectorJsonValue =
  | InspectorJsonPrimitive
  | InspectorJsonValue[]
  | InspectorJsonObject;

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeBase64(bytes: Uint8Array): string {
  let encoded = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    encoded += base64Alphabet[(chunk >> 18) & 63];
    encoded += base64Alphabet[(chunk >> 12) & 63];
    encoded += index + 1 < bytes.length ? base64Alphabet[(chunk >> 6) & 63] : "=";
    encoded += index + 2 < bytes.length ? base64Alphabet[chunk & 63] : "=";
  }

  return encoded;
}

function setJsonProperty(target: Record<string, InspectorJsonValue>, key: string, value: InspectorJsonValue): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function normalizeObject(
  value: object,
  activePath: WeakSet<object>,
  normalize: () => InspectorJsonValue,
): InspectorJsonValue {
  if (activePath.has(value) === true) {
    return { $type: "circular-reference" };
  }

  activePath.add(value);

  try {
    return normalize();
  } finally {
    activePath.delete(value);
  }
}

function normalizeRowTuple(
  tuple: readonly unknown[],
  columns: readonly ColumnDescriptor[],
  activePath: WeakSet<object>,
): InspectorJsonValue {
  return normalizeObject(tuple, activePath, () => {
    const result: Record<string, InspectorJsonValue> = {};

    for (const [index, column] of columns.entries()) {
      setJsonProperty(result, column.name, normalizeValue(tuple[index], column.column_type, activePath));
    }

    return result;
  });
}

function normalizeArray(
  values: readonly unknown[],
  elementType: ColumnType | undefined,
  activePath: WeakSet<object>,
): InspectorJsonValue {
  return normalizeObject(values, activePath, () =>
    values.map((value) => normalizeValue(value, elementType, activePath)),
  );
}

function normalizeRecord(value: object, activePath: WeakSet<object>): InspectorJsonValue {
  return normalizeObject(value, activePath, () => {
    const result: Record<string, InspectorJsonValue> = {};

    for (const [key, child] of Object.entries(value)) {
      setJsonProperty(result, key, normalizeValue(child, undefined, activePath));
    }

    return result;
  });
}

function isPlainRecord(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(
  value: unknown,
  columnType: ColumnType | undefined,
  activePath: WeakSet<object>,
): InspectorJsonValue {
  if (value === undefined) {
    return { $type: "unavailable" };
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value) === true) {
      return value;
    }

    return {
      $type: "non-finite-number",
      value: Number.isNaN(value) === true ? "NaN" : value > 0 ? "Infinity" : "-Infinity",
    };
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) === true
      ? { $type: "unsupported", valueType: "object" }
      : value.toISOString();
  }

  if (value instanceof Uint8Array) {
    return { $type: "bytes", encoding: "base64", value: encodeBase64(value) };
  }

  if (Array.isArray(value) === true) {
    if (columnType?.type === "Row") {
      return normalizeRowTuple(value, columnType.columns, activePath);
    }

    const elementType = columnType?.type === "Array" ? columnType.element : undefined;
    return normalizeArray(value, elementType, activePath);
  }

  if (typeof value === "object") {
    if (isPlainRecord(value) === false) {
      return { $type: "unsupported", valueType: "object" };
    }

    return normalizeRecord(value, activePath);
  }

  return { $type: "unsupported", valueType: typeof value };
}

export function createRowJsonViewValue(
  row: Readonly<Record<string, unknown>>,
  columns: readonly ColumnDescriptor[],
): InspectorJsonObject {
  const result: Record<string, InspectorJsonValue> = {};
  const activePath = new WeakSet<object>();

  setJsonProperty(result, "id", normalizeValue(row.id, undefined, activePath));

  for (const column of columns) {
    if (column.name === "id") {
      continue;
    }

    setJsonProperty(result, column.name, normalizeValue(row[column.name], column.column_type, activePath));
  }

  return result;
}

export function createColumnJsonViewValue(
  value: unknown,
  columnType: ColumnType,
): InspectorJsonValue {
  return normalizeValue(value, columnType, new WeakSet<object>());
}

export function isJsonViewContainer(
  value: InspectorJsonValue,
): value is InspectorJsonObject | InspectorJsonValue[] {
  return value !== null && typeof value === "object";
}
