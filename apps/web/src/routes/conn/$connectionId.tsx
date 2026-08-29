import { Outlet, createFileRoute, redirect, retainSearchParams } from '@tanstack/react-router'

import {
  redirectToConnections,
  resolveStoredTablesNavigationTarget,
} from '@app/routing/inspectorNavigation'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'

import { ConnectionRouteError, ConnectionRoutePending } from './-connectionRouteStatus'

interface ConnectionRouteSearch {
  schema?: string
}

function validateConnectionRouteSearch(search: Record<string, unknown>): ConnectionRouteSearch {
  if (typeof search.schema !== 'string' || search.schema.trim().length === 0) {
    return { schema: undefined }
  }
  return { schema: search.schema.trim() }
}

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
  validateSearch: validateConnectionRouteSearch,
  search: {
    middlewares: [retainSearchParams(['schema'])],
  },
  loaderDeps: ({ search }) => ({ schemaHash: search.schema }),
  loader: async ({ deps, location, params }) => {
    const target = await resolveStoredTablesNavigationTarget({
      connectionId: params.connectionId,
      schemaHashOverride: deps.schemaHash,
    })
    if (target === null) {
      redirectToConnections()
    }
    if (deps.schemaHash !== undefined && deps.schemaHash !== target.schemaHash) {
      const search = new URLSearchParams(location.searchStr)
      search.set('schema', target.schemaHash)
      throw redirect({
        href: `${location.pathname}?${search.toString()}${location.hash.length > 0 ? `#${location.hash}` : ''}`,
        replace: true,
      })
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
