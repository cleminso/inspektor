import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorProvider } from "@/components/providers/inspectorProvider";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash")({
  component: InspectorRuntimeRoute,
});

/**
 * The first route with a complete Jazz runtime identity. Mounting the provider here keeps Jazz
 * out of connection setup while giving all nested inspection routes one shared client.
 */
function InspectorRuntimeRoute(): React.ReactElement {
  return (
    <InspectorProvider>
      <Outlet />
    </InspectorProvider>
  );
}
