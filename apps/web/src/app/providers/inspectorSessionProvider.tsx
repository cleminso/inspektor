import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { getConnectionDisplayName, type StoredConnection } from "@app/connections/connections";
import {
  ConnectionNavigationError,
  NoStoredSchemasError,
} from "@app/connections/connectionValidation";
import {
  useConnectionOpenCoordinator,
  type ConnectionOpenResult,
} from "@app/connections/useConnectionOpenCoordinator";
import { appRoutes } from "@app/routing/appRoutes";
import { resolveTablesNavigationTarget } from "@app/routing/inspectorNavigation";
import { useInspectorSession } from "@app/session/useInspectorSession";
import {
  RuntimeScopeExitGuardProvider,
  useRuntimeScopeExitGuard,
} from "@app/providers/runtimeScopeExitGuard";

/**
 * Connection and route state that is safe to use before a Jazz client exists.
 *
 * Root-level screens use this context for onboarding and navigation. Connection-scoped consumers
 * use the session and runtime projections exposed by `InspectorProvider`.
 */
export interface InspectorSessionContextValue {
  connections: StoredConnection[];
  activeConnection: StoredConnection | null;
  currentConnectionId: string | null;
  currentBranch: string | null;
  currentSchemaHash: string | null;
  currentTableName: string | null;
  connectionLabel: string | null;
  rememberedBranches: string[];
  openingConnectionId: string | null;
  openConnection: (
    connectionId: string,
    knownSchemaHashes?: readonly string[],
  ) => Promise<ConnectionOpenResult>;
  switchBranch: (branch: string, knownSchemaHashes?: readonly string[]) => Promise<void>;
  switchSchema: (schemaHash: string) => Promise<void>;
  saveConnection: ReturnType<typeof useInspectorSession>["saveConnection"];
  deleteConnection: ReturnType<typeof useInspectorSession>["deleteConnection"];
  setConnectionContext: ReturnType<typeof useInspectorSession>["setConnectionContext"];
  prefill: ReturnType<typeof useInspectorSession>["prefill"];
}

const InspectorSessionContext = createContext<InspectorSessionContextValue | null>(null);

/**
 * Provides persisted connection state and route-derived navigation without importing Jazz runtime
 * code. It stays at the root route so connection setup can render independently of a complete
 * connection, branch, and schema-hash identity.
 */
export function InspectorSessionProvider({ children }: PropsWithChildren): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <InspectorSessionProviderValue>{children}</InspectorSessionProviderValue>
    </RuntimeScopeExitGuardProvider>
  );
}

function InspectorSessionProviderValue({ children }: PropsWithChildren): React.ReactElement {
  const session = useInspectorSession();
  const runtimeScopeExitGuard = useRuntimeScopeExitGuard();
  const navigate = useNavigate();
  const routeParams = useParams({ strict: false });

  const routeConnectionId = routeParams.connectionId ?? null;
  const currentConnectionId = routeConnectionId ?? session.activeConnectionId;
  const currentTableName = routeParams.tableName ?? null;
  const activeConnection =
    routeConnectionId !== null ? session.getConnection(routeConnectionId) : session.activeConnection;
  const connectionPreferences =
    activeConnection === null ? null : session.getConnectionPreferences(activeConnection.id);
  const currentBranch = connectionPreferences?.lastBranch ?? null;
  const currentSchemaHash = connectionPreferences?.lastSchemaHash ?? null;

  const performConnectionOpen = useCallback(
    async (connectionId: string, knownSchemaHashes?: readonly string[]) => {
      const nextTarget = await resolveTablesNavigationTarget({
        connectionId,
        getConnection: (nextConnectionId) => session.getConnection(nextConnectionId),
        resolveBranch: (nextConnectionId, branchOverride) =>
          session.resolveBranch(nextConnectionId, branchOverride),
        resolveSchemaHash: (nextConnectionId, availableSchemaHashes, schemaHashOverride) =>
          session.resolveSchemaHash(nextConnectionId, availableSchemaHashes, schemaHashOverride),
        knownSchemaHashes,
        schemaFetchError: "throw",
      });
      if (nextTarget === null) {
        throw new NoStoredSchemasError();
      }

      session.setConnectionContext(connectionId, nextTarget.branch, nextTarget.schemaHash);

      try {
        await navigate({
          to: appRoutes.tables,
          params: { connectionId },
        });
      } catch {
        throw new ConnectionNavigationError();
      }
    },
    [navigate, session],
  );
  const { openingConnectionId, openConnection: openCoordinatedConnection } =
    useConnectionOpenCoordinator(performConnectionOpen);
  const openConnection = useCallback(
    (connectionId: string, knownSchemaHashes?: readonly string[]) => {
      if (
        connectionId !== currentConnectionId &&
        runtimeScopeExitGuard.isBlocked() === true
      ) {
        return Promise.resolve("ignored" as const);
      }
      return openCoordinatedConnection(connectionId, knownSchemaHashes);
    },
    [currentConnectionId, openCoordinatedConnection, runtimeScopeExitGuard],
  );

  const switchBranch = useCallback(async (branch: string, knownSchemaHashes?: readonly string[]) => {
    if (
      activeConnection === null ||
      branch === currentBranch ||
      runtimeScopeExitGuard.isBlocked() === true
    ) {
      return;
    }

    const nextTarget = await resolveTablesNavigationTarget({
      connectionId: activeConnection.id,
      branchOverride: branch,
      schemaHashOverride: currentSchemaHash,
      getConnection: (nextConnectionId) => session.getConnection(nextConnectionId),
      resolveBranch: (nextConnectionId, branchOverride) => session.resolveBranch(nextConnectionId, branchOverride),
      resolveSchemaHash: (nextConnectionId, availableSchemaHashes, schemaHashOverride) =>
        session.resolveSchemaHash(nextConnectionId, availableSchemaHashes, schemaHashOverride),
      knownSchemaHashes,
    });
    if (nextTarget === null) {
      return;
    }

    session.setConnectionContext(
      activeConnection.id,
      nextTarget.branch,
      nextTarget.schemaHash,
    );
  }, [activeConnection, currentBranch, currentSchemaHash, runtimeScopeExitGuard, session]);

  const switchSchema = useCallback(async (schemaHash: string) => {
    if (
      activeConnection === null ||
      currentBranch === null ||
      schemaHash === currentSchemaHash ||
      runtimeScopeExitGuard.isBlocked() === true
    ) {
      return;
    }

    session.setConnectionContext(activeConnection.id, currentBranch, schemaHash);
  }, [activeConnection, currentBranch, currentSchemaHash, runtimeScopeExitGuard, session]);
  const setConnectionContext = useCallback(
    (connectionId: string, branch: string, schemaHash: string) => {
      const changesRuntimeScope =
        connectionId !== currentConnectionId ||
        branch !== currentBranch ||
        schemaHash !== currentSchemaHash;
      if (changesRuntimeScope === true && runtimeScopeExitGuard.isBlocked() === true) {
        return;
      }
      session.setConnectionContext(connectionId, branch, schemaHash);
    },
    [currentBranch, currentConnectionId, currentSchemaHash, runtimeScopeExitGuard, session],
  );

  const value = useMemo<InspectorSessionContextValue>(
    () => ({
      connections: session.connections,
      activeConnection,
      currentConnectionId: activeConnection?.id ?? currentConnectionId,
      currentBranch,
      currentSchemaHash,
      currentTableName,
      connectionLabel: activeConnection !== null ? getConnectionDisplayName(activeConnection) : null,
      rememberedBranches: activeConnection !== null ? session.getRememberedBranches(activeConnection.id) : [],
      openingConnectionId,
      openConnection,
      switchBranch,
      switchSchema,
      saveConnection: session.saveConnection,
      deleteConnection: session.deleteConnection,
      setConnectionContext,
      prefill: session.prefill,
    }),
    [
      activeConnection,
      currentBranch,
      currentConnectionId,
      currentSchemaHash,
      currentTableName,
      openConnection,
      openingConnectionId,
      session,
      setConnectionContext,
      switchBranch,
      switchSchema,
    ],
  );

  return <InspectorSessionContext.Provider value={value}>{children}</InspectorSessionContext.Provider>;
}

/** Returns session-level state for screens that do not require a Jazz client. */
export function useInspectorSessionContext(): InspectorSessionContextValue {
  const context = useContext(InspectorSessionContext);
  if (context === null) {
    throw new Error("useInspectorSessionContext must be used within InspectorSessionProvider");
  }

  return context;
}
