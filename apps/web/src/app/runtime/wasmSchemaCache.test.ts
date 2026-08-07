import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WasmSchema } from "jazz-tools";

import type { StoredConnection } from "@app/connections/connections";
import {
  readCachedWasmSchema,
  resetWasmSchemaCacheForTests,
  writeCachedWasmSchema,
} from "@app/runtime/wasmSchemaCache";

const connection: StoredConnection = {
  id: "connection-1",
  name: "Local app",
  serverUrl: "https://example.com",
  appId: "app-1",
  adminSecret: "secret",
  env: "dev",
};

const schema = {
  files: {
    columns: [
      {
        name: "content",
        column_type: { type: "Text" },
        nullable: false,
        default: { type: "Text", value: "example" },
      },
    ],
  },
} satisfies WasmSchema;

const taggedJsonValue = { __regardeInspectorUint8Array: [1, 2, 3] };
const schemaWithTaggedExtension = {
  settings: {
    columns: [
      {
        name: "value",
        column_type: { type: "Text" },
        nullable: false,
      },
    ],
    metadata: taggedJsonValue,
  },
} as unknown as WasmSchema;

describe("WASM schema cache", () => {
  beforeEach(() => {
    resetWasmSchemaCacheForTests();
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        get length() {
          return values.size;
        },
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    });
  });

  it("restores a schema for the same connection target", () => {
    writeCachedWasmSchema(connection, "schema-1", schema);

    const restoredSchema = readCachedWasmSchema(connection, "schema-1");

    expect(restoredSchema).toEqual(schema);
  });

  it("preserves unknown JSON-compatible schema fields without reinterpretation", () => {
    writeCachedWasmSchema(connection, "schema-1", schemaWithTaggedExtension);
    resetWasmSchemaCacheForTests();

    expect(readCachedWasmSchema(connection, "schema-1")).toEqual(schemaWithTaggedExtension);
  });

  it("does not reuse a schema after the connection endpoint changes", () => {
    writeCachedWasmSchema(connection, "schema-1", schema);

    expect(
      readCachedWasmSchema(
        { ...connection, serverUrl: "https://other.example.com" },
        "schema-1",
      ),
    ).toBeNull();
  });

  it("ignores malformed cached schema data", () => {
    writeCachedWasmSchema(connection, "schema-1", schema);
    const persistedCache = JSON.parse(
      window.localStorage.getItem("regarde-inspector-wasm-schemas") ?? "null",
    ) as { entries: Record<string, { schema: unknown }> };
    const cacheKey = Object.keys(persistedCache.entries)[0];
    if (cacheKey === undefined) {
      throw new Error("Expected the test schema to be persisted");
    }
    persistedCache.entries[cacheKey] = { schema: "invalid" };
    window.localStorage.setItem(
      "regarde-inspector-wasm-schemas",
      JSON.stringify({ version: 1, entries: persistedCache.entries }),
    );
    resetWasmSchemaCacheForTests();

    expect(readCachedWasmSchema(connection, "schema-1")).toBeNull();
  });

  it("decodes storage only once across repeated reads", () => {
    window.localStorage.setItem(
      "regarde-inspector-wasm-schemas",
      JSON.stringify({ version: 1, entries: {} }),
    );
    const getItem = vi.spyOn(window.localStorage, "getItem");

    readCachedWasmSchema(connection, "schema-1");
    readCachedWasmSchema(connection, "schema-1");

    expect(getItem).toHaveBeenCalledOnce();
  });

  it("keeps runtime loading usable when storage is unavailable", () => {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: () => {
        throw new DOMException("Storage is unavailable", "SecurityError");
      },
    });

    expect(() => writeCachedWasmSchema(connection, "schema-1", schema)).not.toThrow();
    expect(readCachedWasmSchema(connection, "schema-1")).toEqual(schema);
  });
});
