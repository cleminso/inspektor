import { createFileRoute } from "@tanstack/react-router";

import {
  redirectToConnections,
  redirectToTablesTarget,
  resolveStoredTablesNavigationTarget,
} from "@/lib/navigation/inspectorNavigation";

export const Route = createFileRoute("/conn/$connectionId/$branch/")({
  loader: async ({ params }) => {
    const target = await resolveStoredTablesNavigationTarget({
      connectionId: params.connectionId,
      branchOverride: params.branch,
    });
    if (target === null) {
      redirectToConnections();
    }

    redirectToTablesTarget(target);
  },
});
