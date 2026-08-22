import { afterEach, describe, expect, it, vi } from "vitest";

import { createEmptyConnectionStore, type StoredConnectionsStore } from "@app/connections/connections";
import { resolveStoredTablesNavigationTarget } from "@app/routing/inspectorNavigation";

const fetchSchemaHashes = vi.fn();

vi.mock("jazz-tools", () => ({ fetchSchemaHashes }));

afterEach(() => {
  fetchSchemaHashes.mockReset();
});

function createStore(lastSchemaHash: string | null = "schema-1"): StoredConnectionsStore {
  const store = createEmptyConnectionStore();

  return {
    ...store,
    activeConnectionId: "connection-1",
    connections: [
      {
        id: "connection-1",
        name: "Local app",
        serverUrl: "https://example.com",
        appId: "app-1",
        adminSecret: "secret",
        env: "dev",
      },
    ],
    preferencesByConnectionId: {
      "connection-1": {
        lastBranch: "main",
        lastSchemaHash,
        rememberedBranches: ["main"],
      },
    },
  };
}

describe("resolveStoredTablesNavigationTarget", () => {
  it("validates the persisted runtime target against available schemas", async () => {
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: ["schema-2", "schema-1"] });

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-1",
      availableSchemaHashes: ["schema-2", "schema-1"],
    });
    expect(fetchSchemaHashes).toHaveBeenCalledOnce();
    expect(fetchSchemaHashes).toHaveBeenCalledWith("https://example.com", {
      appId: "app-1",
      adminSecret: "secret",
    });
  });

  it("falls back when a direct link restores a stale schema preference", async () => {
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: ["schema-2", "schema-3"] });

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore("schema-1"),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-2",
      availableSchemaHashes: ["schema-2", "schema-3"],
    });
  });

  it("retains an unverified persisted target when direct-link validation is unavailable", async () => {
    fetchSchemaHashes.mockRejectedValueOnce(new Error("Network unavailable"));

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore("schema-1"),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-1",
      availableSchemaHashes: [],
    });
    expect(fetchSchemaHashes).toHaveBeenCalledOnce();
  });

  it("discovers schema hashes when no schema preference exists", async () => {
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: ["schema-1", "schema-2"] });

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(null),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-1",
      availableSchemaHashes: ["schema-1", "schema-2"],
    });
  });

  it("preserves discovery failures when no schema preference exists", async () => {
    const error = new Error("Network unavailable");
    fetchSchemaHashes.mockRejectedValueOnce(error);

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(null),
      }),
    ).rejects.toBe(error);
  });
});
