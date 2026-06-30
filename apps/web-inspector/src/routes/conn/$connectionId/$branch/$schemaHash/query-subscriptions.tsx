import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorLayout } from "@/components/layout/inspectorLayout";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/query-subscriptions")({
  component: QuerySubscriptionsLayoutRoute,
});

function QuerySubscriptionsLayoutRoute(): React.ReactElement {
  return (
    <InspectorLayout>
      <Outlet />
    </InspectorLayout>
  );
}
