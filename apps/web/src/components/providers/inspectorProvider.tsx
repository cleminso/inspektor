import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { JazzClientProvider } from "jazz-tools/react";

import { useInspectorRuntime } from "@/hooks/useInspectorRuntime";
import {
  useInspectorSessionContext,
  type InspectorSessionContextValue,
} from "@/components/providers/inspectorSessionProvider";

interface InspectorContextValue extends InspectorSessionContextValue {
  runtime: ReturnType<typeof useInspectorRuntime>;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

/**
 * Adds the Jazz runtime to the session context once the active route has a complete runtime
 * identity. This provider must remain below `InspectorSessionProvider` and at the shared route
 * boundary for runtime-dependent descendants.
 */
export function InspectorProvider({ children }: PropsWithChildren) {
  const session = useInspectorSessionContext();

  const runtime = useInspectorRuntime({
    connection: session.activeConnection,
    branch: session.currentBranch,
    schemaHash: session.currentSchemaHash,
  });
  const openConnection = useCallback(
    (connectionId: string) =>
      session.openConnection(
        connectionId,
        session.activeConnection?.id === connectionId ? runtime.availableSchemaHashes : undefined,
      ),
    [runtime.availableSchemaHashes, session],
  );
  const switchBranch = useCallback(
    (branch: string) => session.switchBranch(branch, runtime.availableSchemaHashes),
    [runtime.availableSchemaHashes, session],
  );

  const value = useMemo<InspectorContextValue>(
    () => ({
      ...session,
      runtime,
      openConnection,
      switchBranch,
    }),
    [openConnection, runtime, session, switchBranch],
  );

  return (
    <InspectorContext.Provider value={value}>
      {runtime.client !== null ? <JazzClientProvider client={runtime.client}>{children}</JazzClientProvider> : children}
    </InspectorContext.Provider>
  );
}

/** Returns session state together with the Jazz runtime for connection-bound Inspector features. */
export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (context === null) {
    throw new Error("useInspector must be used within InspectorProvider");
  }

  return context;
}
