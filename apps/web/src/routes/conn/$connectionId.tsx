import { Outlet, createFileRoute } from '@tanstack/react-router'

import {
  redirectToConnections,
  resolveStoredTablesNavigationTarget,
} from '@app/routing/inspectorNavigation'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'

import { ConnectionRouteError, ConnectionRoutePending } from './-connectionRouteStatus'

/**
 * Authoritative connection-entry boundary shared by every connection-scoped child route.
 *
 * The loader resolves the route-selected saved connection into a complete runtime target. Pending
 * and terminal resolution states stay route-owned; Jazz client creation starts only below
 * `InspectorRuntimeBoundary`.
 */
export const Route = createFileRoute('/conn/$connectionId')({
  gcTime: 0,
  shouldReload: false,
  loader: async ({ params }) => {
    const target = await resolveStoredTablesNavigationTarget({
      connectionId: params.connectionId,
    })
    if (target === null) {
      redirectToConnections()
    }

    return target
  },
  pendingComponent: ConnectionRoutePending,
  errorComponent: ConnectionRouteError,
  component: InspectorRuntimeRoute,
})

function InspectorRuntimeRoute(): React.ReactElement {
  const target = Route.useLoaderData()

  return (
    <InspectorRuntimeBoundary target={target}>
      <Outlet />
    </InspectorRuntimeBoundary>
  )
}
