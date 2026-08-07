import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { useStore } from "@nanostores/react";

import type { StoredPermissionsResponse, WasmSchema } from "jazz-tools";
import { JazzProvider, useJazzClient, type JazzClient } from "jazz-tools/react";

import {
  useInspectorRuntime,
  type InspectorRuntimeStore,
} from "@app/runtime/useInspectorRuntime";
import type { ResolvedTablesNavigationTarget } from "@app/routing/inspectorNavigation";
import {
  useInspectorSessionContext,
  type InspectorSessionContextValue,
} from "@app/providers/inspectorSessionProvider";

type InspectorContextValue = InspectorSessionContextValue;

const InspectorContext = createContext<InspectorContextValue | null>(null);
const InspectorRuntimeContext = createContext<InspectorRuntimeStore | null>(null);

interface InspectorProviderProps extends PropsWithChildren {
  initialRuntimeTarget?: ResolvedTablesNavigationTarget;
}

function RuntimeClientProjection({ runtime }: { runtime: InspectorRuntimeStore }) {
  const client = useJazzClient();

  useEffect(() => {
    runtime.publishClient(client);
    return () => {
      runtime.clearClient(client);
    };
  }, [client, runtime]);

  return null;
}

interface RuntimeClientErrorBoundaryProps {
  children: ReactNode;
  onError: (error: unknown) => void;
  /** Memoized client configuration used to recover without serializing credentials into a key. */
  resetToken: object;
}

interface RuntimeClientErrorBoundaryState {
  failed: boolean;
  resetToken: object;
}

class RuntimeClientErrorBoundary extends Component<
  RuntimeClientErrorBoundaryProps,
  RuntimeClientErrorBoundaryState
> {
  state: RuntimeClientErrorBoundaryState = {
    failed: false,
    resetToken: this.props.resetToken,
  };

  static getDerivedStateFromProps(
    props: RuntimeClientErrorBoundaryProps,
    state: RuntimeClientErrorBoundaryState,
  ): Partial<RuntimeClientErrorBoundaryState> | null {
    return props.resetToken === state.resetToken
      ? null
      : { failed: false, resetToken: props.resetToken };
  }

  static getDerivedStateFromError(): Partial<RuntimeClientErrorBoundaryState> {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed === true ? null : this.props.children;
  }
}

/**
 * Composes the route session with its Jazz client and independently subscribable runtime stores.
 *
 * This provider remains below `InspectorSessionProvider`: session actions come from that outer
 * boundary, while schema, permissions, errors, and the active Jazz client are projected through a
 * separate runtime context so unrelated updates do not rerender every consumer.
 */
export function InspectorProvider({ children, initialRuntimeTarget }: InspectorProviderProps) {
  const session = useInspectorSessionContext();
  const initialSchemaHashes =
    initialRuntimeTarget?.connectionId === session.currentConnectionId &&
    initialRuntimeTarget.branch === session.currentBranch &&
    initialRuntimeTarget.schemaHash === session.currentSchemaHash
      ? initialRuntimeTarget.availableSchemaHashes
      : undefined;

  const runtime = useInspectorRuntime({
    connection: session.activeConnection,
    branch: session.currentBranch,
    schemaHash: session.currentSchemaHash,
    initialSchemaHashes,
  });
  const clientConfig = useMemo(
    () =>
      session.activeConnection !== null && session.currentBranch !== null
        ? {
            appId: session.activeConnection.appId,
            serverUrl: session.activeConnection.serverUrl,
            env: session.activeConnection.env,
            userBranch: session.currentBranch,
            adminSecret: session.activeConnection.adminSecret,
            driver: { type: "memory" as const },
          }
        : null,
    [session.activeConnection, session.currentBranch],
  );
  const openConnection = useCallback(
    (connectionId: string) =>
      session.openConnection(
        connectionId,
        session.activeConnection?.id === connectionId
          ? runtime.$availableSchemaHashes.get()
          : undefined,
      ),
    [runtime, session],
  );
  const switchBranch = useCallback(
    (branch: string) => session.switchBranch(branch, runtime.$availableSchemaHashes.get()),
    [runtime, session],
  );

  const value = useMemo<InspectorContextValue>(
    () => ({
      ...session,
      openConnection,
      switchBranch,
    }),
    [openConnection, session, switchBranch],
  );

  return (
    <InspectorRuntimeContext.Provider value={runtime}>
      {clientConfig === null ? null : (
        <RuntimeClientErrorBoundary
          onError={runtime.publishClientError}
          resetToken={clientConfig}
        >
          <JazzProvider config={clientConfig} fallback={null}>
            <RuntimeClientProjection runtime={runtime} />
          </JazzProvider>
        </RuntimeClientErrorBoundary>
      )}
      <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>
    </InspectorRuntimeContext.Provider>
  );
}

export function useInspectorSessionState(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (context === null) {
    throw new Error("useInspectorSessionState must be used within InspectorProvider");
  }

  return context;
}

function useInspectorRuntimeContext(): InspectorRuntimeStore {
  const context = useContext(InspectorRuntimeContext);
  if (context === null) {
    throw new Error("Runtime projections must be used within InspectorProvider");
  }
  return context;
}

export function useRuntimeClient(): JazzClient | null {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$client);
}

export function useRuntimeSchema(): WasmSchema | null {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$wasmSchema);
}

export function useRuntimeSchemaHashes(): readonly string[] {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$availableSchemaHashes);
}

export function useRuntimeSchemaHashesLoading(): boolean {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$isSchemaHashesLoading);
}

export function useRuntimePermissions(): StoredPermissionsResponse | null {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$storedPermissions);
}

export function useRuntimeError(): string | null {
  const runtime = useInspectorRuntimeContext();
  return useStore(runtime.$error);
}
