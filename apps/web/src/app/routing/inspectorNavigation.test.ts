import { describe, expect, it, vi } from "vitest";

import { createEmptyConnectionStore, type StoredConnectionsStore } from "@app/connections/connections";
import { resolveStoredTablesNavigationTarget } from "@app/routing/inspectorNavigation";

const fetchSchemaHashes = vi.fn();

vi.mock("jazz-tools", () => ({ fetchSchemaHashes }));

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
  it("uses the persisted runtime target without blocking route entry on schema discovery", async () => {
    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-1",
      availableSchemaHashes: [],
    });
    expect(fetchSchemaHashes).not.toHaveBeenCalled();
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
});
