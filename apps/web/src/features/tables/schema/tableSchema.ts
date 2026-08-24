/**
 * Reads Jazz stored schema metadata for the schema-driven explorer UI.
 *
 * Table lists, column lists, and relation labels must come from runtime metadata so the
 * Inspector can browse any app without importing generated schema code.
 */
import type { ColumnDescriptor, WasmSchema } from 'jazz-tools'

/** Gives the table explorer deterministic navigation from unordered schema metadata. */
export function getTableNames(schema: WasmSchema | null): string[] {
  if (schema === null) {
    return []
  }

  return Object.keys(schema).sort((left, right) => left.localeCompare(right))
}

/** Keeps callers generic by treating unresolved schema/table state as no columns. */
export function getTableColumns(
  schema: WasmSchema | null,
  tableName: string | null,
): ColumnDescriptor[] {
  if (schema === null || tableName === null) {
    return []
  }

  return schema[tableName]?.columns ?? []
}
