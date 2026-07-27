import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { useInspectorSession } from "@/hooks/useInspectorSession";
import { getConnectionDisplayName, type StoredConnection } from "@/lib/config/connections";
import { appRoutes } from "@/lib/navigation/appRoutes";
import { resolveTablesNavigationTarget } from "@/lib/navigation/inspectorNavigation";

/**
 * Connection and route state that is safe to use before a Jazz client exists.
 *
 * Root-level screens use this context for onboarding and navigation. Runtime-only consumers use
 * `useInspector`, which extends this context after the connection route mounts `InspectorProvider`.
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
  openConnection: (connectionId: string, reusableSchemaHashes?: string[]) => Promise<void>;
  switchBranch: (branch: string, reusableSchemaHashes?: string[]) => Promise<void>;
  switchSchema: (schemaHash: string) => Promise<void>;
  saveConnection: ReturnType<typeof useInspectorSession>["saveConnection"];
  deleteConnection: ReturnType<typeof useInspectorSession>["deleteConnection"];
  setActiveConnection: ReturnType<typeof useInspectorSession>["setActiveConnection"];
  prefill: ReturnType<typeof useInspectorSession>["prefill"];
}

const InspectorSessionContext = createContext<InspectorSessionContextValue | null>(null);

/**
 * Provides persisted connection state and route-derived navigation without importing Jazz runtime
 * code. It stays at the root route so connection setup can render independently of a complete
 * connection, branch, and schema-hash identity.
 */
export function InspectorSessionProvider({ children }: PropsWithChildren): React.ReactElement {
  const session = useInspectorSession();
  const navigate = useNavigate();
  const routeParams = useParams({ strict: false });

  const routeConnectionId = routeParams.connectionId ?? null;
  const currentConnectionId = routeConnectionId ?? session.activeConnectionId;
  const currentBranch = routeParams.branch ?? null;
  const currentSchemaHash = routeParams.schemaHash ?? null;
  const currentTableName = routeParams.tableName ?? null;
  const activeConnection =
    routeConnectionId !== null ? session.getConnection(routeConnectionId) : session.activeConnection;

  useEffect(() => {
    if (activeConnection === null || currentBranch === null) {
      return;
    }

    session.rememberContext(activeConnection.id, currentBranch, currentSchemaHash);
  }, [activeConnection, currentBranch, currentSchemaHash, session]);

  const openConnection = async (connectionId: string, reusableSchemaHashes?: string[]) => {
    const nextTarget = await resolveTablesNavigationTarget({
      connectionId,
      getConnection: (nextConnectionId) => session.getConnection(nextConnectionId),
      resolveBranch: (nextConnectionId, branchOverride) => session.resolveBranch(nextConnectionId, branchOverride),
      resolveSchemaHash: (nextConnectionId, availableSchemaHashes, schemaHashOverride) =>
        session.resolveSchemaHash(nextConnectionId, availableSchemaHashes, schemaHashOverride),
      reusableSchemaHashes,
    });
    if (nextTarget === null) {
      return;
    }

    session.setActiveConnection(connectionId);
    session.rememberContext(connectionId, nextTarget.branch, nextTarget.schemaHash);

    await navigate({
      to: appRoutes.tables,
      params: nextTarget,
    });
  };

  const switchBranch = async (branch: string, reusableSchemaHashes?: string[]) => {
    if (activeConnection === null) {
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
      reusableSchemaHashes,
    });
    if (nextTarget === null) {
      return;
    }

    session.rememberContext(activeConnection.id, nextTarget.branch, nextTarget.schemaHash);

    await navigate({
      to: appRoutes.tables,
      params: nextTarget,
    });
  };

  const switchSchema = async (schemaHash: string) => {
    if (activeConnection === null || currentBranch === null) {
      return;
    }

    session.rememberContext(activeConnection.id, currentBranch, schemaHash);

    await navigate({
      to: appRoutes.tables,
      params: {
        connectionId: activeConnection.id,
        branch: currentBranch,
        schemaHash,
      },
    });
  };

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
      openConnection,
      switchBranch,
      switchSchema,
      saveConnection: session.saveConnection,
      deleteConnection: session.deleteConnection,
      setActiveConnection: session.setActiveConnection,
      prefill: session.prefill,
    }),
    [activeConnection, currentBranch, currentConnectionId, currentSchemaHash, currentTableName, session],
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
