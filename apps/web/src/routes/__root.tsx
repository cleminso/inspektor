import { Outlet, createRootRoute } from "@tanstack/react-router";

import { InspectorProvider } from "@/components/providers/inspectorProvider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  return (
    <InspectorProvider>
      <Outlet />
    </InspectorProvider>
  );
}
