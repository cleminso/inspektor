import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorLayout } from "@/components/layout/inspectorLayout";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/tables")({
  component: TablesLayoutRoute,
});

function TablesLayoutRoute(): React.ReactElement {
  return (
    <InspectorLayout>
      <Outlet />
    </InspectorLayout>
  );
}
