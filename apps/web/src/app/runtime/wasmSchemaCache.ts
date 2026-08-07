import type { WasmSchema } from "jazz-tools";

import type { StoredConnection } from "@app/connections/connections";

const WASM_SCHEMA_CACHE_STORAGE_KEY = "regarde-inspector-wasm-schemas";
// Stores the schema exactly as returned by Jazz's JSON endpoint without reviving tagged values.
const WASM_SCHEMA_CACHE_VERSION = 1;

let schemaCache: WasmSchemaCache | undefined;

interface CachedSchemaEntry {
  schema: WasmSchema;
}

interface WasmSchemaCache {
  version: typeof WASM_SCHEMA_CACHE_VERSION;
  entries: Record<string, CachedSchemaEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Array.isArray(value) === false;
}

function isWasmSchema(value: unknown): value is WasmSchema {
  if (isRecord(value) === false) {
    return false;
  }

  return Object.values(value).every(
    (table) =>
      isRecord(table) === true &&
      Array.isArray(table.columns) === true &&
      table.columns.every(
        (column) =>
          isRecord(column) === true &&
          typeof column.name === "string" &&
          isRecord(column.column_type) === true &&
          typeof column.column_type.type === "string" &&
          typeof column.nullable === "boolean",
      ),
  );
}

function getSchemaCacheKey(
  connection: Pick<StoredConnection, "appId" | "id" | "serverUrl">,
  schemaHash: string,
): string {
  return JSON.stringify([connection.id, connection.serverUrl, connection.appId, schemaHash]);
}

function readCache(): WasmSchemaCache {
  if (schemaCache !== undefined) {
    return schemaCache;
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(WASM_SCHEMA_CACHE_STORAGE_KEY) ?? "null",
    ) as unknown;
    if (
      isRecord(parsed) === false ||
      parsed.version !== WASM_SCHEMA_CACHE_VERSION ||
      isRecord(parsed.entries) === false
    ) {
      schemaCache = { version: WASM_SCHEMA_CACHE_VERSION, entries: {} };
      return schemaCache;
    }

    schemaCache = {
      version: WASM_SCHEMA_CACHE_VERSION,
      entries: Object.fromEntries(
        Object.entries(parsed.entries).filter(
          (entry): entry is [string, CachedSchemaEntry] =>
            isRecord(entry[1]) === true && isWasmSchema(entry[1].schema),
        ),
      ),
    };
    return schemaCache;
  } catch {
    schemaCache = { version: WASM_SCHEMA_CACHE_VERSION, entries: {} };
    return schemaCache;
  }
}

export function resetWasmSchemaCacheForTests(): void {
  schemaCache = undefined;
}

export function readCachedWasmSchema(
  connection: Pick<StoredConnection, "appId" | "id" | "serverUrl">,
  schemaHash: string,
): WasmSchema | null {
  return readCache().entries[getSchemaCacheKey(connection, schemaHash)]?.schema ?? null;
}

export function writeCachedWasmSchema(
  connection: Pick<StoredConnection, "appId" | "id" | "serverUrl">,
  schemaHash: string,
  schema: WasmSchema,
): void {
  const cache = readCache();
  cache.entries[getSchemaCacheKey(connection, schemaHash)] = { schema };
  try {
    window.localStorage.setItem(
      WASM_SCHEMA_CACHE_STORAGE_KEY,
      JSON.stringify(cache),
    );
  } catch {
    // Schema persistence is an optimization; runtime loading remains the fallback.
  }
}
