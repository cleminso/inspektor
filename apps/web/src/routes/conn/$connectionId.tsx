import { Outlet, createFileRoute } from "@tanstack/react-router";

import {
  redirectToConnections,
  resolveStoredTablesNavigationTarget,
} from "@app/routing/inspectorNavigation";
import { InspectorRuntimeBoundary } from "@app/runtime/inspectorRuntimeBoundary";

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

function InspectorRuntimeRoute(): React.ReactElement {
  const target = Route.useLoaderData();

  return (
    <InspectorRuntimeBoundary target={target}>
      <Outlet />
    </InspectorRuntimeBoundary>
  );
}
