import { act, cleanup, render, waitFor } from "@testing-library/react";
import { atom } from "nanostores";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorProvider, useRuntimeSchema } from "@app/providers/inspectorProvider";
import type { StoredConnection } from "@app/connections/connections";

const runtimeHolder = vi.hoisted(() => ({ current: null as unknown }));
const sessionHolder = vi.hoisted(() => ({ current: null as unknown }));
const jazzReactMocks = vi.hoisted(() => ({
  client: { manager: {} },
  provider: vi.fn(),
}));

const runtime = {
  $availableSchemaHashes: atom<string[]>([]),
  $client: atom(null),
  $error: atom<string | null>(null),
  $isSchemaHashesLoading: atom(false),
  $storedPermissions: atom<unknown>(null),
  $wasmSchema: atom<Record<string, { columns: [] }> | null>({ accounts: { columns: [] } }),
  clearClient: vi.fn(),
  clearRuntime: vi.fn(),
  publishClient: vi.fn(),
  publishClientError: vi.fn(),
};
runtimeHolder.current = runtime;

const session = {
  connections: [],
  activeConnection: null as StoredConnection | null,
  currentConnectionId: "connection-1",
  currentBranch: "main",
  currentSchemaHash: "schema-1",
  currentTableName: "accounts",
  connectionLabel: "Local app",
  rememberedBranches: [],
  openConnection: vi.fn(),
  switchBranch: vi.fn(),
  switchSchema: vi.fn(),
  saveConnection: vi.fn(),
  deleteConnection: vi.fn(),
  setConnectionContext: vi.fn(),
  prefill: null,
};
sessionHolder.current = session;

vi.mock("@app/runtime/useInspectorRuntime", () => ({
  useInspectorRuntime: () => runtimeHolder.current,
}));

vi.mock("@app/providers/inspectorSessionProvider", () => ({
  useInspectorSessionContext: () => sessionHolder.current,
}));

vi.mock("jazz-tools/react", () => ({
  JazzProvider: ({ children, config }: { children: React.ReactNode; config: unknown }) => {
    jazzReactMocks.provider(config);
    return children;
  },
  useJazzClient: () => jazzReactMocks.client,
}));

afterEach(() => {
  cleanup();
  runtime.$storedPermissions.set(null);
  runtime.$wasmSchema.set({ accounts: { columns: [] } });
  runtime.clearClient.mockClear();
  runtime.publishClient.mockClear();
  runtime.publishClientError.mockClear();
  jazzReactMocks.provider.mockClear();
  session.activeConnection = null;
});

describe("InspectorProvider runtime projections", () => {
  it("does not rerender a schema consumer when permissions resolve", () => {
    let renderCount = 0;
    function SchemaConsumer() {
      useRuntimeSchema();
      renderCount += 1;
      return null;
    }

    render(
      <InspectorProvider>
        <SchemaConsumer />
      </InspectorProvider>,
    );

    act(() => {
      runtime.$storedPermissions.set({ permissions: {}, head: null });
    });
    expect(renderCount).toBe(1);

    act(() => {
      runtime.$wasmSchema.set({ users: { columns: [] } });
    });
    expect(renderCount).toBe(2);
  });

  it("publishes clients through Jazz's registry-backed React provider", async () => {
    session.activeConnection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    };

    render(
      <InspectorProvider>
        <div>Structural workspace</div>
      </InspectorProvider>,
    );

    expect(jazzReactMocks.provider).toHaveBeenCalledOnce();
    expect(jazzReactMocks.provider).toHaveBeenCalledWith({
      appId: "app-1",
      serverUrl: "https://example.com",
      env: "dev",
      userBranch: "main",
      adminSecret: "secret",
      driver: { type: "memory" },
    });
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(jazzReactMocks.client));
  });
});
