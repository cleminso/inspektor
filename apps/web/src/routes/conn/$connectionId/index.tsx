import { createFileRoute } from "@tanstack/react-router";

import {
  redirectToConnections,
  redirectToTablesTarget,
  resolveStoredTablesNavigationTarget,
} from "@/lib/navigation/inspectorNavigation";

export const Route = createFileRoute("/conn/$connectionId/")({
  loader: async ({ params }) => {
    const target = await resolveStoredTablesNavigationTarget({
      connectionId: params.connectionId,
    });
    if (target === null) {
      redirectToConnections();
    }

    redirectToTablesTarget(target);
  },
});
