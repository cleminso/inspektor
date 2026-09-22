import {
  Outlet,
  createFileRoute,
  redirect,
  retainSearchParams,
  useRouterState,
} from '@tanstack/react-router'

import {
  redirectToConnections,
  redirectToEditConnection,
  resolveStoredRuntimeTarget,
} from '@app/routing/inspectorNavigation'
import { resolveRuntimeConnection } from '@app/connections/connectionCredentials'
import { getCredentialSafeRelativeUrl } from '@app/routing/credentialSafeUrl'
import { getConnectionById, readStoredConnections } from '@app/connections/connections'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'
import { InspectorLayout } from '@app/shell/layout'
import { TableNavigationPreparationProvider } from '@tables/routing/tableNavigationPreparation'
import { createTableWorkspaceScope } from '@tables/workspace/scope'
import { TableCommands } from '@tables/workspace/tableCommands'

import { ConnectionRouteError, ConnectionRouteLoading } from './-connectionRouteStatus'
import { ConnectionNotFound } from './-connectionNotFound'

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
  loader: async ({ abortController, deps, location, params }) => {
    const store = readStoredConnections()
    const profile = getConnectionById(store, params.connectionId)
    if (profile === null) redirectToConnections()
    if (resolveRuntimeConnection(profile) === null) redirectToEditConnection(params.connectionId)
    void prepareJazzWasm()
    const target = await resolveStoredRuntimeTarget({
      connectionId: params.connectionId,
      schemaHashOverride: deps.schemaHash,
      signal: abortController.signal,
      store,
    })
    if (target === null) redirectToConnections()
    if (deps.schemaHash !== undefined && deps.schemaHash !== target.schemaHash) {
      const search = new URLSearchParams(location.searchStr)
      search.set('schema', target.schemaHash)
      throw redirect({
        href: getCredentialSafeRelativeUrl({
          pathname: location.pathname,
          search: `?${search.toString()}`,
          hash: location.hash,
        }),
        replace: true,
      })
    }

    return target
  },
  pendingComponent: ConnectionRouteLoading,
  errorComponent: ConnectionRouteError,
  notFoundComponent: ConnectionNotFoundRoute,
  component: InspectorRuntimeRoute,
})

function ConnectionNotFoundRoute(): React.ReactElement {
  const { connectionId } = Route.useParams()
  return <ConnectionNotFound connectionId={connectionId} />
}

function InspectorRuntimeRoute(): React.ReactElement {
  const target = Route.useLoaderData()
  const location = useRouterState({
    select: (state) => state.location,
  })
  const isLiveQueriesRoute = location.pathname.endsWith('/live-queries')
  const workspaceScope = createTableWorkspaceScope({
    branch: target.branch,
    connectionId: target.connectionId,
    schemaHash: target.schemaHash,
  })

  return (
    <InspectorRuntimeBoundary
      target={target}
      fallback={<ConnectionRouteLoading />}
    >
      <TableNavigationPreparationProvider
        identity={location.href}
        scope={workspaceScope}
      >
        <InspectorLayout pageTitle={isLiveQueriesRoute === true ? 'Live queries' : 'Tables'}>
          {isLiveQueriesRoute === true ? <TableCommands /> : null}
          <Outlet />
        </InspectorLayout>
      </TableNavigationPreparationProvider>
    </InspectorRuntimeBoundary>
  )
}
