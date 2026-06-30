/**
 * Reads Jazz stored schema metadata for the schema-driven explorer UI.
 *
 * Table lists, column lists, and relation labels must come from runtime metadata so the
 * Inspector can browse any app without importing generated schema code.
 */
import type { ColumnDescriptor, WasmSchema } from "jazz-tools";

const RELATION_LABEL_COLUMN_PRIORITY = [
  "name",
  "title",
  "label",
  "displayName",
  "display_name",
  "username",
  "handle",
  "slug",
  "email",
] as const;

/** Avoids IDs, nested references, and complex values when labeling relation links. */
function isDisplayFriendlyColumn(column: ColumnDescriptor): boolean {
  if (column.name === "id" || column.references !== undefined) {
    return false;
  }

  switch (column.column_type.type) {
    case "Text":
    case "Enum":
    case "Timestamp":
    case "Integer":
    case "BigInt":
    case "Double":
    case "Boolean":
      return true;
    default:
      return false;
  }
}

/** Gives the table explorer deterministic navigation from unordered schema metadata. */
export function getTableNames(schema: WasmSchema | null): string[] {
  if (schema === null) {
    return [];
  }

  return Object.keys(schema).sort((left, right) => left.localeCompare(right));
}

/** Keeps callers generic by treating unresolved schema/table state as no columns. */
export function getTableColumns(schema: WasmSchema | null, tableName: string | null): ColumnDescriptor[] {
  if (schema === null || tableName === null) {
    return [];
  }

  return schema[tableName]?.columns ?? [];
}

/**
 * Chooses a human-readable column for relation link previews.
 *
 * Generic relation cells need a label without app-specific display config, so common name
 * fields win before falling back to the first simple scalar column.
 */
export function getRelationDisplayColumn(
  schema: WasmSchema | null,
  tableName: string | null,
): ColumnDescriptor | null {
  const columns = getTableColumns(schema, tableName);

  for (const columnName of RELATION_LABEL_COLUMN_PRIORITY) {
    const match = columns.find(
      (column) => column.name === columnName && isDisplayFriendlyColumn(column) === true,
    );
    if (match !== undefined) {
      return match;
    }
  }

  const firstTextColumn = columns.find(
    (column) => column.column_type.type === "Text" && isDisplayFriendlyColumn(column) === true,
  );
  if (firstTextColumn !== undefined) {
    return firstTextColumn;
  }

  return columns.find((column) => isDisplayFriendlyColumn(column) === true) ?? null;
}
