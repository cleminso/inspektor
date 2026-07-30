import { useEffect, useRef, type PropsWithChildren } from "react";

import { InspectorProvider } from "@app/providers/inspectorProvider";
import { useInspectorSessionContext } from "@app/providers/inspectorSessionProvider";
import type { ResolvedTablesNavigationTarget } from "@app/routing/inspectorNavigation";

interface InspectorRuntimeBoundaryProps extends PropsWithChildren {
  target: ResolvedTablesNavigationTarget;
}

export function InspectorRuntimeBoundary({
  children,
  target,
}: InspectorRuntimeBoundaryProps): React.ReactElement | null {
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

  return <InspectorProvider initialRuntimeTarget={target}>{children}</InspectorProvider>;
}
