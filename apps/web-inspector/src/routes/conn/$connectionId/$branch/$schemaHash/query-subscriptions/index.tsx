import { createFileRoute } from "@tanstack/react-router";

import { QuerySubscriptionsScreen } from "@/components/query-subscriptions/view";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/query-subscriptions/")({
  component: QuerySubscriptionsRoute,
});

function QuerySubscriptionsRoute(): React.ReactElement {
  return <QuerySubscriptionsScreen />;
}
