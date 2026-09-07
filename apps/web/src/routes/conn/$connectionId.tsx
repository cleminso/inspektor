import {
  Outlet,
  createFileRoute,
  redirect,
  retainSearchParams,
  useRouterState,
} from '@tanstack/react-router'

import { redirectToConnections, resolveStoredRuntimeTarget } from '@app/routing/inspectorNavigation'
import { getConnectionById, readStoredConnections } from '@app/connections/connections'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'
import { InspectorLayout } from '@app/shell/layout'
import { TableCommands } from '@tables/workspace/tableCommands'

import { ConnectionRouteError, ConnectionRouteLoading } from './-connectionRouteStatus'

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
  shouldReload: false,
  pendingMs: 0,
  pendingMinMs: 0,
  validateSearch: validateConnectionRouteSearch,
  search: {
    middlewares: [retainSearchParams(['schema'])],
  },
  loaderDeps: ({ search }) => ({ schemaHash: search.schema }),
  loader: async ({ deps, location, params }) => {
    const store = readStoredConnections()
    if (getConnectionById(store, params.connectionId) !== null) void prepareJazzWasm()
    const target = await resolveStoredRuntimeTarget({
      connectionId: params.connectionId,
      schemaHashOverride: deps.schemaHash,
      store,
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
  pendingComponent: ConnectionRouteLoading,
  errorComponent: ConnectionRouteError,
  component: InspectorRuntimeRoute,
})

function InspectorRuntimeRoute(): React.ReactElement {
  const target = Route.useLoaderData()
  const isLiveQueriesRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith('/live-queries'),
  })

  return (
    <InspectorRuntimeBoundary
      target={target}
      fallback={<ConnectionRouteLoading />}
    >
      <InspectorLayout pageTitle={isLiveQueriesRoute === true ? 'Live queries' : 'Tables'}>
        {isLiveQueriesRoute === true ? <TableCommands /> : null}
        <Outlet />
      </InspectorLayout>
    </InspectorRuntimeBoundary>
  )
}
