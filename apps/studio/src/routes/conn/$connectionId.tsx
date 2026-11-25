import { Outlet, createFileRoute, redirect, retainSearchParams } from '@tanstack/react-router'

import {
  redirectToConnections,
  redirectToEditConnection,
  resolveStoredRuntimeTarget,
} from '@app/connections/connectionEntry'
import { resolveRuntimeConnection } from '@app/connections/connectionCredentials'
import { SchemaCatalogueLoadError } from '@app/connections/connectionValidation'
import { getCredentialSafeRelativeUrl } from '@app/routing/credentialSafeUrl'
import { appRoutes } from '@app/routing/appRoutes'
import { getConnectionById } from '@app/connections/connections'
import { readConnectionProfiles } from '@app/connections/connectionProfiles'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'
import { InspectorLayout } from '@app/shell/layout'

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
    const store = readConnectionProfiles()
    const profile = getConnectionById(store, params.connectionId)
    if (profile === null) redirectToConnections()
    if (resolveRuntimeConnection(profile) === null) redirectToEditConnection(params.connectionId)
    void prepareJazzWasm()
    let target: Awaited<ReturnType<typeof resolveStoredRuntimeTarget>>
    try {
      target = await resolveStoredRuntimeTarget({
        connectionId: params.connectionId,
        schemaHashOverride: deps.schemaHash,
        signal: abortController.signal,
        store,
      })
    } catch (error) {
      if (error instanceof SchemaCatalogueLoadError) {
        throw redirect({
          to: appRoutes.editConnection,
          params: { connectionId: params.connectionId },
          search: {
            recovery: error.reason,
            returnTo: getCredentialSafeRelativeUrl({
              pathname: location.pathname,
              search: location.searchStr,
              hash: location.hash,
            }),
          },
          replace: true,
        })
      }
      throw error
    }
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
  pendingComponent: ConnectionRoutePending,
  errorComponent: ConnectionRouteError,
  notFoundComponent: ConnectionNotFoundRoute,
  component: InspectorRuntimeRoute,
})

function ConnectionNotFoundRoute(): React.ReactElement {
  const { connectionId } = Route.useParams()
  return <ConnectionNotFound connectionId={connectionId} />
}

function ConnectionRoutePending(): React.ReactElement {
  return <ConnectionRouteLoading message="Checking connection…" />
}

function InspectorRuntimeRoute(): React.ReactElement {
  const target = Route.useLoaderData()

  return (
    <InspectorRuntimeBoundary
      target={target}
      fallback={<ConnectionRouteLoading message="Loading connection…" />}
    >
      <InspectorLayout pageTitle="Tables">
        <Outlet />
      </InspectorLayout>
    </InspectorRuntimeBoundary>
  )
}
