import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

import { ConnectionsLayout } from "@/components/layout/connectionsLayout";
import { appRoutes } from "@/lib/navigation/appRoutes";

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

  return <ConnectionsLayout pane={isNewConnectionRoute === true ? <Outlet /> : null} />;
}
