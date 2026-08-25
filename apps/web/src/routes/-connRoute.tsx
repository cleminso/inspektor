// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { Outlet, useRouterState } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'
import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { ConnectionsView } from '@onboarding/view'

export function ConnRoute(): React.ReactElement {
  const pathname = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).pathname,
  })
  const isConnectionsRoute = pathname === appRoutes.connections
  const isNewConnectionRoute = pathname === appRoutes.newConnection
  const isEditConnectionRoute = pathname.startsWith('/conn/edit/')
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
