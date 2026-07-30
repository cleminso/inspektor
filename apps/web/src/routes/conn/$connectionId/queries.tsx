import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorLayout } from "@app/shell/layout";

export const Route = createFileRoute("/conn/$connectionId/queries")({
  component: QuerySubscriptionsLayoutRoute,
});

function QuerySubscriptionsLayoutRoute(): React.ReactElement {
  return (
    <InspectorLayout>
      <Outlet />
    </InspectorLayout>
  );
}
