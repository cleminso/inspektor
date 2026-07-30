import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@inspector/ds";

import { InspectorSessionProvider } from "@app/providers/inspectorSessionProvider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  return (
    <InspectorSessionProvider>
      <Outlet />
      <Toaster />
    </InspectorSessionProvider>
  );
}
