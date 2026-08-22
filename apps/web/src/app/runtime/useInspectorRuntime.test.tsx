import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JazzClient } from "jazz-tools/react";

import { useInspectorRuntime } from "@app/runtime/useInspectorRuntime";
import {
  resetWasmSchemaCacheForTests,
  writeCachedWasmSchema,
} from "@app/runtime/wasmSchemaCache";

const jazzMocks = vi.hoisted(() => ({
  fetchSchemaHashes: vi.fn(),
  fetchStoredPermissions: vi.fn(),
  fetchStoredWasmSchema: vi.fn(),
  shutdown: vi.fn(),
}));

vi.mock("jazz-tools", () => ({
  fetchSchemaHashes: jazzMocks.fetchSchemaHashes,
  fetchStoredPermissions: jazzMocks.fetchStoredPermissions,
  fetchStoredWasmSchema: jazzMocks.fetchStoredWasmSchema,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

describe("useInspectorRuntime", () => {
  it("reruns runtime metadata when the retry generation changes", async () => {
    const schemaError = new Error("Failed once");
    jazzMocks.fetchStoredWasmSchema
      .mockRejectedValueOnce(schemaError)
      .mockResolvedValueOnce({ schema: { accounts: { columns: [] } } });
    jazzMocks.fetchStoredPermissions.mockResolvedValue(null);
    jazzMocks.fetchSchemaHashes.mockResolvedValue({ hashes: ["schema-1"] });
    const connection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    } as const;

    const { result, rerender } = renderHook(
      ({ retryGeneration }: { retryGeneration: number }) =>
        useInspectorRuntime({
          connection,
          branch: "main",
          schemaHash: "schema-1",
          retryGeneration,
        }),
      { initialProps: { retryGeneration: 0 } },
    );

    await waitFor(() =>
      expect(result.current.$error.get()).toEqual({ source: "schema", error: schemaError }),
    );

    const failedRuntime = result.current;
    rerender({ retryGeneration: 1 });

    expect(result.current).not.toBe(failedRuntime);
    expect(result.current.$client.get()).toBeNull();
    await waitFor(() =>
      expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } }),
    );
    expect(result.current.$error.get()).toBeNull();
    expect(jazzMocks.fetchStoredWasmSchema).toHaveBeenCalledTimes(2);
  });

  it("hydrates the schema projection from the saved runtime target", () => {
    const connection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    } as const;
    writeCachedWasmSchema(connection, "schema-1", { accounts: { columns: [] } });
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() =>
      useInspectorRuntime({ connection, branch: "main", schemaHash: "schema-1" }),
    );

    expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } });
  });

  it("keeps a cached schema unverified until the stored schema resolves", async () => {
    const connection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    } as const;
    writeCachedWasmSchema(connection, "schema-1", { stale: { columns: [] } });
    let resolveStoredSchema!: (value: { schema: { accounts: { columns: [] } } }) => void;
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(
      new Promise((resolve) => {
        resolveStoredSchema = resolve;
      }),
    );
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() =>
      useInspectorRuntime({ connection, branch: "main", schemaHash: "schema-1" }),
    );

    expect(result.current.$wasmSchema.get()).toEqual({ stale: { columns: [] } });
    expect(result.current.$isWasmSchemaLoading.get()).toBe(true);

    resolveStoredSchema({ schema: { accounts: { columns: [] } } });

    await waitFor(() => expect(result.current.$isWasmSchemaLoading.get()).toBe(false));
    expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } });
  });

  it("exposes a fresh client projection when the branch changes while preserving cached schema", () => {
    const connection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    } as const;
    writeCachedWasmSchema(connection, "schema-1", { accounts: { columns: [] } });
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(new Promise(() => undefined));

    const { result, rerender } = renderHook(
      ({ branch }: { branch: string }) =>
        useInspectorRuntime({ connection, branch, schemaHash: "schema-1" }),
      { initialProps: { branch: "main" } },
    );
    const mainRuntime = result.current;
    mainRuntime.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient);

    rerender({ branch: "feature" });

    expect(result.current).not.toBe(mainRuntime);
    expect(result.current.$client.get()).toBeNull();
    expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } });
  });

  it("does not let stale provider cleanup clear a replacement client", () => {
    const connection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    } as const;
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() =>
      useInspectorRuntime({ connection, branch: "main", schemaHash: "schema-1" }),
    );
    const previousClient = { manager: { client: "previous" } } as unknown as JazzClient;
    const replacementClient = { manager: { client: "replacement" } } as unknown as JazzClient;

    result.current.publishClient(previousClient);
    result.current.publishClient(replacementClient);
    result.current.clearClient(previousClient);

    expect(result.current.$client.get()).toBe(replacementClient);
  });

  it("publishes schema metadata without waiting for client or hash discovery", async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({
      schema: { accounts: { columns: [] } },
    });
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: "connection-1",
          name: "Local app",
          serverUrl: "https://example.com",
          appId: "app-1",
          adminSecret: "secret",
          env: "dev",
        },
        branch: "main",
        schemaHash: "schema-1",
      }),
    );

    await waitFor(() =>
      expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } }),
    );
    expect(result.current.$client.get()).toBeNull();
    expect(jazzMocks.fetchStoredWasmSchema).toHaveBeenCalledWith("https://example.com", {
      appId: "app-1",
      adminSecret: "secret",
      schemaHash: "schema-1",
    });
  });

  it("does not let optional permissions block the usable runtime", async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } });
    jazzMocks.fetchSchemaHashes.mockResolvedValue({ hashes: ["schema-1"] });
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: "connection-1",
          name: "Local app",
          serverUrl: "https://example.com",
          appId: "app-1",
          adminSecret: "secret",
          env: "dev",
        },
        branch: "main",
        schemaHash: "schema-1",
      }),
    );

    result.current.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient);
    await waitFor(() => expect(result.current.$wasmSchema.get()).toEqual({ tables: {} }));
    expect(result.current.$storedPermissions.get()).toBeNull();
  });

  it("tracks schema-hash discovery independently from workspace readiness", async () => {
    let resolveSchemaHashes!: (value: { hashes: string[] }) => void;
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } });
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined));
    jazzMocks.fetchSchemaHashes.mockReturnValue(
      new Promise((resolve) => {
        resolveSchemaHashes = resolve;
      }),
    );

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: "connection-1",
          name: "Local app",
          serverUrl: "https://example.com",
          appId: "app-1",
          adminSecret: "secret",
          env: "dev",
        },
        branch: "main",
        schemaHash: "schema-1",
      }),
    );

    result.current.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient);
    await waitFor(() => expect(result.current.$wasmSchema.get()).toEqual({ tables: {} }));

    expect(result.current.$isSchemaHashesLoading.get()).toBe(true);
    expect(result.current.$availableSchemaHashes.get()).toEqual([]);

    resolveSchemaHashes({ hashes: ["schema-1"] });
    await waitFor(() => expect(result.current.$isSchemaHashesLoading.get()).toBe(false));
    expect(result.current.$availableSchemaHashes.get()).toEqual(["schema-1"]);
  });

  it("reuses schema hashes resolved by the connection loader", async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } });
    jazzMocks.fetchStoredPermissions.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: "connection-1",
          name: "Local app",
          serverUrl: "https://example.com",
          appId: "app-1",
          adminSecret: "secret",
          env: "dev",
        },
        branch: "main",
        schemaHash: "schema-1",
        initialSchemaHashes: ["schema-1", "schema-2"],
      }),
    );

    expect(result.current.$availableSchemaHashes.get()).toEqual(["schema-1", "schema-2"]);
    expect(jazzMocks.fetchSchemaHashes).not.toHaveBeenCalled();
  });
});
