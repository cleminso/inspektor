import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { JazzClientProvider } from "jazz-tools/react";

import { getConnectionDisplayName, type StoredConnection } from "@/lib/config/connections";
import { useInspectorRuntime } from "@/hooks/useInspectorRuntime";
import { useInspectorSession } from "@/hooks/useInspectorSession";
import { appRoutes } from "@/lib/navigation/appRoutes";
import { resolveTablesNavigationTarget } from "@/lib/navigation/inspectorNavigation";

interface InspectorContextValue {
  connections: StoredConnection[];
  activeConnection: StoredConnection | null;
  currentConnectionId: string | null;
  currentBranch: string | null;
  currentSchemaHash: string | null;
  currentTableName: string | null;
  connectionLabel: string | null;
  rememberedBranches: string[];
  runtime: ReturnType<typeof useInspectorRuntime>;
  openConnection: (connectionId: string) => Promise<void>;
  switchBranch: (branch: string) => Promise<void>;
  switchSchema: (schemaHash: string) => Promise<void>;
  saveConnection: ReturnType<typeof useInspectorSession>["saveConnection"];
  deleteConnection: ReturnType<typeof useInspectorSession>["deleteConnection"];
  setActiveConnection: ReturnType<typeof useInspectorSession>["setActiveConnection"];
  prefill: ReturnType<typeof useInspectorSession>["prefill"];
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function InspectorProvider({ children }: PropsWithChildren) {
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

  const runtime = useInspectorRuntime({
    connection: activeConnection,
    branch: currentBranch,
    schemaHash: currentSchemaHash,
  });

  useEffect(() => {
    if (activeConnection === null || currentBranch === null) {
      return;
    }

    session.rememberContext(activeConnection.id, currentBranch, currentSchemaHash);
  }, [activeConnection, currentBranch, currentSchemaHash, session]);

  const openConnection = async (connectionId: string) => {
    const nextTarget = await resolveTablesNavigationTarget({
      connectionId,
      getConnection: (nextConnectionId) => session.getConnection(nextConnectionId),
      resolveBranch: (nextConnectionId, branchOverride) => session.resolveBranch(nextConnectionId, branchOverride),
      resolveSchemaHash: (nextConnectionId, availableSchemaHashes, schemaHashOverride) =>
        session.resolveSchemaHash(nextConnectionId, availableSchemaHashes, schemaHashOverride),
      reusableSchemaHashes:
        activeConnection !== null && activeConnection.id === connectionId && runtime.availableSchemaHashes.length > 0
          ? runtime.availableSchemaHashes
          : undefined,
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

  const switchBranch = async (branch: string) => {
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
      reusableSchemaHashes: runtime.availableSchemaHashes.length > 0 ? runtime.availableSchemaHashes : undefined,
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

  const value = useMemo<InspectorContextValue>(
    () => ({
      connections: session.connections,
      activeConnection,
      currentConnectionId: activeConnection?.id ?? currentConnectionId,
      currentBranch,
      currentSchemaHash,
      currentTableName,
      connectionLabel: activeConnection !== null ? getConnectionDisplayName(activeConnection) : null,
      rememberedBranches: activeConnection !== null ? session.getRememberedBranches(activeConnection.id) : [],
      runtime,
      openConnection,
      switchBranch,
      switchSchema,
      saveConnection: session.saveConnection,
      deleteConnection: session.deleteConnection,
      setActiveConnection: session.setActiveConnection,
      prefill: session.prefill,
    }),
    [
      activeConnection,
      currentBranch,
      currentConnectionId,
      currentSchemaHash,
      currentTableName,
      runtime,
      session,
    ],
  );

  return (
    <InspectorContext.Provider value={value}>
      {runtime.client !== null ? <JazzClientProvider client={runtime.client}>{children}</JazzClientProvider> : children}
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (context === null) {
    throw new Error("useInspector must be used within InspectorProvider");
  }

  return context;
}
