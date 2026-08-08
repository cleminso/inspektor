import { act, cleanup, render, waitFor } from "@testing-library/react";
import { atom } from "nanostores";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorProvider, useRuntimeSchema } from "@app/providers/inspectorProvider";
import type { StoredConnection } from "@app/connections/connections";

const runtimeHolder = vi.hoisted(() => ({ current: null as unknown }));
const sessionHolder = vi.hoisted(() => ({ current: null as unknown }));
const jazzReactMocks = vi.hoisted(() => ({
  clients: new Map<string, { manager: object }>(),
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

vi.mock("jazz-tools/react", async () => {
  const React = await import("react");
  const ClientContext = React.createContext<{ manager: object } | null>(null);
  function JazzProvider({
    autoAttachDevTools,
    children,
    config,
  }: {
    autoAttachDevTools?: boolean;
    children: React.ReactNode;
    config: { appId: string; userBranch: string };
  }) {
    jazzReactMocks.provider({ autoAttachDevTools, config });
    const clientKey = `${config.appId}:${config.userBranch}`;
    const [client, setClient] = React.useState(() => jazzReactMocks.clients.get(clientKey)!);
    React.useEffect(() => {
      setClient(jazzReactMocks.clients.get(clientKey)!);
    }, [clientKey]);
    return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
  }

  return {
    JazzProvider,
    useJazzClient: () => React.useContext(ClientContext)!,
  };
});

afterEach(() => {
  cleanup();
  runtime.$storedPermissions.set(null);
  runtime.$wasmSchema.set({ accounts: { columns: [] } });
  runtime.clearClient.mockClear();
  runtime.publishClient.mockClear();
  runtime.publishClientError.mockClear();
  jazzReactMocks.provider.mockClear();
  jazzReactMocks.clients.clear();
  session.activeConnection = null;
  session.currentConnectionId = "connection-1";
  session.currentBranch = "main";
  runtimeHolder.current = runtime;
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
    const client = { manager: {} };
    jazzReactMocks.clients.set("app-1:main", client);

    render(
      <InspectorProvider>
        <div>Structural workspace</div>
      </InspectorProvider>,
    );

    expect(jazzReactMocks.provider).toHaveBeenCalledOnce();
    expect(jazzReactMocks.provider).toHaveBeenCalledWith({
      autoAttachDevTools: false,
      config: {
        appId: "app-1",
        serverUrl: "https://example.com",
        env: "dev",
        userBranch: "main",
        adminSecret: "secret",
        driver: { type: "memory" },
      },
    });
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(client));
  });

  it("never publishes a retained client into a replacement runtime", async () => {
    const clientA = { manager: { connection: "a" } };
    const clientB = { manager: { connection: "b" } };
    jazzReactMocks.clients.set("app-a:main", clientA);
    jazzReactMocks.clients.set("app-b:main", clientB);
    session.activeConnection = {
      id: "connection-a",
      name: "App A",
      serverUrl: "https://a.example.com",
      appId: "app-a",
      adminSecret: "secret-a",
      env: "dev",
    };
    const runtimeB = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() };
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>);
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(clientA));

    session.activeConnection = {
      id: "connection-b",
      name: "App B",
      serverUrl: "https://b.example.com",
      appId: "app-b",
      adminSecret: "secret-b",
      env: "dev",
    };
    session.currentConnectionId = "connection-b";
    runtimeHolder.current = runtimeB;
    rerender(<InspectorProvider>Workspace</InspectorProvider>);

    await waitFor(() => expect(runtimeB.publishClient).toHaveBeenCalledWith(clientB));
    expect(runtimeB.publishClient).not.toHaveBeenCalledWith(clientA);
  });

  it("never publishes a retained branch client into a replacement runtime", async () => {
    const mainClient = { manager: { branch: "main" } };
    const featureClient = { manager: { branch: "feature" } };
    jazzReactMocks.clients.set("app-1:main", mainClient);
    jazzReactMocks.clients.set("app-1:feature", featureClient);
    session.activeConnection = {
      id: "connection-1",
      name: "Local app",
      serverUrl: "https://example.com",
      appId: "app-1",
      adminSecret: "secret",
      env: "dev",
    };
    const featureRuntime = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() };
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>);
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(mainClient));

    session.currentBranch = "feature";
    runtimeHolder.current = featureRuntime;
    rerender(<InspectorProvider>Workspace</InspectorProvider>);

    await waitFor(() => expect(featureRuntime.publishClient).toHaveBeenCalledWith(featureClient));
    expect(featureRuntime.publishClient).not.toHaveBeenCalledWith(mainClient);
  });
});
