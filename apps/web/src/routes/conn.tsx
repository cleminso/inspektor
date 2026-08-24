import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'
import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { ConnectionsView } from '@onboarding/view'

export const Route = createFileRoute('/conn')({
  head: () => ({
    meta: [{ title: 'Connections | Inspector' }],
  }),
  component: ConnRoute,
})

function ConnRoute(): React.ReactElement {
  const location = useLocation()
  const isConnectionsRoute = location.pathname === appRoutes.connections
  const isNewConnectionRoute = location.pathname === appRoutes.newConnection
  const isEditConnectionRoute = location.pathname.startsWith('/conn/edit/')
  const isOnboardingRoute =
    isConnectionsRoute === true || isNewConnectionRoute === true || isEditConnectionRoute === true

  if (isOnboardingRoute === false) {
    return <Outlet />
  }

  return (
    <ConnectionsLayout
      pageTitle={
        isNewConnectionRoute === true
          ? 'Add connection'
          : isEditConnectionRoute === true
            ? 'Edit connection'
            : 'Connections'
      }
    >
      {isConnectionsRoute === true ? <ConnectionsView /> : <Outlet />}
    </ConnectionsLayout>
  )
}
