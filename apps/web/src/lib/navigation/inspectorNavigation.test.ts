import { describe, expect, it, vi } from "vitest";

import { createEmptyConnectionStore, type StoredConnectionsStore } from "@/lib/config/connections";
import { resolveStoredTablesNavigationTarget } from "@/lib/navigation/inspectorNavigation";

const fetchSchemaHashes = vi.fn();

vi.mock("jazz-tools", () => ({ fetchSchemaHashes }));

function createStore(): StoredConnectionsStore {
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
        lastSchemaHash: "schema-1",
        rememberedBranches: ["main"],
      },
    },
  };
}

describe("resolveStoredTablesNavigationTarget", () => {
  it("preserves schema discovery failures for the connection route", async () => {
    fetchSchemaHashes.mockRejectedValueOnce(new Error("Schema service unavailable"));

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(),
      }),
    ).rejects.toThrow("Schema service unavailable");
  });

  it("returns fetched schema hashes for runtime reuse", async () => {
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: ["schema-1", "schema-2"] });

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: "connection-1",
        store: createStore(),
      }),
    ).resolves.toEqual({
      connectionId: "connection-1",
      branch: "main",
      schemaHash: "schema-1",
      availableSchemaHashes: ["schema-1", "schema-2"],
    });
  });
});
