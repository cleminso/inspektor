import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInspectorRuntime } from "@/hooks/useInspectorRuntime";

const jazzMocks = vi.hoisted(() => ({
  createJazzClient: vi.fn(),
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

vi.mock("jazz-tools/react", () => ({
  createJazzClient: jazzMocks.createJazzClient,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useInspectorRuntime", () => {
  it("reuses schema hashes resolved by the connection loader", async () => {
    jazzMocks.createJazzClient.mockResolvedValue({ shutdown: jazzMocks.shutdown });
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

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.availableSchemaHashes).toEqual(["schema-1", "schema-2"]);
    expect(jazzMocks.fetchSchemaHashes).not.toHaveBeenCalled();
  });
});
