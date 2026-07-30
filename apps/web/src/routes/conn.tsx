import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

import { appRoutes } from "@app/routing/appRoutes";
import { ConnectionsLayout } from "@onboarding/connectionsLayout";
import { ConnectionsView } from "@onboarding/view";

export const Route = createFileRoute("/conn")({
  component: ConnRoute,
});

function ConnRoute(): React.ReactElement {
  const location = useLocation();
  const isConnectionsRoute = location.pathname === appRoutes.connections;
  const isNewConnectionRoute = location.pathname === appRoutes.newConnection;
  const isOnboardingRoute = isConnectionsRoute === true || isNewConnectionRoute === true;

  if (isOnboardingRoute === false) {
    return <Outlet />;
  }

  return (
    <ConnectionsLayout>
      {isNewConnectionRoute === true ? <Outlet /> : <ConnectionsView />}
    </ConnectionsLayout>
  );
}
