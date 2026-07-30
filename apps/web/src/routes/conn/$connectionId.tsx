import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { InspectorProvider } from "@/components/providers/inspectorProvider";
import { useInspectorSessionContext } from "@/components/providers/inspectorSessionProvider";
import {
  redirectToConnections,
  resolveStoredTablesNavigationTarget,
} from "@/lib/navigation/inspectorNavigation";

export const Route = createFileRoute("/conn/$connectionId")({
  gcTime: 0,
  shouldReload: false,
  loader: async ({ params }) => {
    const target = await resolveStoredTablesNavigationTarget({
      connectionId: params.connectionId,
    });
    if (target === null) {
      redirectToConnections();
    }

    return target;
  },
  component: InspectorRuntimeRoute,
});

function InspectorRuntimeRoute(): React.ReactElement | null {
  const target = Route.useLoaderData();
  const session = useInspectorSessionContext();
  const isContextReady =
    session.currentConnectionId === target.connectionId &&
    session.currentBranch === target.branch &&
    session.currentSchemaHash === target.schemaHash;
  const targetKey = `${target.connectionId}:${target.branch}:${target.schemaHash}`;
  const appliedTargetKeyRef = useRef<string | null>(isContextReady === true ? targetKey : null);

  useEffect(() => {
    if (appliedTargetKeyRef.current !== targetKey) {
      appliedTargetKeyRef.current = targetKey;
      session.setConnectionContext(target.connectionId, target.branch, target.schemaHash);
    }
  }, [session, target.branch, target.connectionId, target.schemaHash, targetKey]);

  if (isContextReady === false && appliedTargetKeyRef.current !== targetKey) {
    return null;
  }

  return (
    <InspectorProvider initialRuntimeTarget={target}>
      <Outlet />
    </InspectorProvider>
  );
}
