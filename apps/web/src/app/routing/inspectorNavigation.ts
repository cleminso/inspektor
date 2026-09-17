/**
 * Resolves partial Inspektor navigation into concrete Inspektor runtime targets.
 *
 * Entry routes may only know the connection. These helpers combine stored Inspektor preferences
 * with Jazz schema-hash metadata so every connection-scoped route can bootstrap the same runtime
 * after a saved click, direct navigation, or refresh.
 */
import { redirect } from '@tanstack/react-router'

import {
  matchesConnectionCredentials,
  normalizeServerUrl,
} from '@app/connections/connectionIdentity'
import { resolveRuntimeConnection } from '@app/connections/connectionCredentials'
import {
  createSchemaCatalogueLoadError,
  isTransientSchemaFetchError,
} from '@app/connections/connectionValidation'
import {
  getConnectionById,
  getConnectionPreferences,
  readStoredConnections,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  type ConnectionCredentials,
  type RuntimeConnection,
  type StoredConnectionsStore,
} from '@app/connections/connections'

import { appRoutes } from './appRoutes'

/** Resolved connection entry and workspace preferences with the available schema catalogue. */
export interface ResolvedRuntimeTarget {
  connectionId: string
  branch: string
  schemaHash: string
  schemaCatalogue: readonly SchemaCatalogueRecord[]
}

export interface SchemaCatalogueRecord {
  hash: string
  publishedAt: number | null
}

interface SchemaCatalogueResponse {
  hashes: readonly string[]
  schemas: readonly SchemaCatalogueRecord[]
}

interface ResolveRuntimeTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  getConnection: (connectionId: string) => RuntimeConnection | null
  resolveBranch: (connectionId: string, branchOverride?: string | null) => string
  resolveSchemaHash: (
    schemaCatalogue: readonly SchemaCatalogueRecord[],
    schemaHashOverride?: string | null,
  ) => string | null
  knownSchemaHashes?: readonly string[]
}

interface ResolveStoredRuntimeTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  store?: StoredConnectionsStore
  signal?: AbortSignal
}

interface RuntimeTargetHandoff {
  connection: ConnectionCredentials
  target: ResolvedRuntimeTarget
}

let handedOffRuntimeTarget: RuntimeTargetHandoff | null = null
const schemaCatalogueRetryDelays = [250, 750] as const

/** Places the deployed schema first while preserving the advertised order of every other schema. */
export function buildSchemaCatalogue(
  { hashes, schemas }: SchemaCatalogueResponse,
  latestSchemaHash: string | null = null,
): SchemaCatalogueRecord[] {
  const publishedAtByHash = new Map(schemas.map(({ hash, publishedAt }) => [hash, publishedAt]))
  return hashes
    .map((hash) => ({ hash, publishedAt: publishedAtByHash.get(hash) ?? null }))
    .sort((left, right) =>
      left.hash === latestSchemaHash ? -1 : right.hash === latestSchemaHash ? 1 : 0,
    )
}

async function fetchConnectionLatestSchemaHash(
  connection: ConnectionCredentials,
): Promise<string | null> {
  const serverUrl = normalizeServerUrl(connection.serverUrl)
  const response = await fetch(
    `${serverUrl}/apps/${encodeURIComponent(connection.appId)}/admin/permissions/head`,
    {
      headers: { 'X-Jazz-Admin-Secret': connection.adminSecret },
    },
  )
  if (response.ok === false) {
    throw new Error(`Permissions head fetch failed: ${response.status} ${response.statusText}`)
  }

  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null || !('head' in body)) {
    throw new Error('Permissions head fetch returned an invalid response')
  }
  if (body.head === null) {
    return null
  }
  if (
    typeof body.head !== 'object' ||
    body.head === null ||
    !('schemaHash' in body.head) ||
    typeof body.head.schemaHash !== 'string'
  ) {
    throw new Error('Permissions head fetch returned an invalid response')
  }
  return body.head.schemaHash
}

export async function fetchConnectionSchemaCatalogue(
  connection: ConnectionCredentials,
): Promise<readonly SchemaCatalogueRecord[]> {
  const { fetchSchemaHashes } = await import('jazz-tools')
  const [response, latestSchemaHash] = await Promise.all([
    fetchSchemaHashes(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    }),
    fetchConnectionLatestSchemaHash(connection).catch(() => null),
  ])
  return buildSchemaCatalogue(response, latestSchemaHash)
}

async function fetchConnectionSchemaCatalogueForRoute(
  connection: ConnectionCredentials,
  signal?: AbortSignal,
): Promise<readonly SchemaCatalogueRecord[]> {
  let attempts = 0

  while (true) {
    signal?.throwIfAborted()
    attempts += 1

    try {
      return await waitForRouteRequest(fetchConnectionSchemaCatalogue(connection), signal)
    } catch (error) {
      signal?.throwIfAborted()
      const retryDelay = schemaCatalogueRetryDelays[attempts - 1]
      if (retryDelay === undefined || isTransientSchemaFetchError(error) === false) {
        throw createSchemaCatalogueLoadError(error, {
          attempts,
          serverUrl: connection.serverUrl,
        })
      }
      await waitForRetry(retryDelay, signal)
    }
  }
}

function waitForRouteRequest<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted()
  if (signal === undefined) return request

  return new Promise((resolve, reject) => {
    const handleAbort = () => reject(signal.reason)
    const clearAbort = () => signal.removeEventListener('abort', handleAbort)

    signal.addEventListener('abort', handleAbort, { once: true })
    void request.then(
      (value) => {
        clearAbort()
        resolve(value)
      },
      (error: unknown) => {
        clearAbort()
        reject(error)
      },
    )
  })
}

function waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()
  return new Promise((resolve, reject) => {
    const handleComplete = () => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }
    const timeout = setTimeout(handleComplete, delay)
    const handleAbort = () => {
      clearTimeout(timeout)
      reject(signal?.reason)
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

/** Hands validated form discovery to the matching route entry without repeating remote requests. */
export function handoffStoredRuntimeTarget(
  connection: ConnectionCredentials,
  target: ResolvedRuntimeTarget,
): void {
  handedOffRuntimeTarget = { connection, target }
}

/**
 * Resolves a connection into a complete workspace selection without requiring a mounted Jazz
 * provider.
 *
 * Session uses this path when a mounted connection changes its local branch label. The label does
 * not configure a Jazz branch view. The Jazz metadata import stays outside the application-root
 * graph, while `knownSchemaHashes` avoids repeated schema discovery.
 */
export async function resolveRuntimeTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  getConnection,
  resolveBranch,
  resolveSchemaHash,
  knownSchemaHashes,
}: ResolveRuntimeTargetOptions): Promise<ResolvedRuntimeTarget | null> {
  const connection = getConnection(connectionId)
  if (connection === null) {
    return null
  }

  const branch = resolveBranch(connectionId, branchOverride)
  let schemaCatalogue: readonly SchemaCatalogueRecord[]
  if (knownSchemaHashes !== undefined && knownSchemaHashes.length > 0) {
    schemaCatalogue = knownSchemaHashes.map((hash) => ({ hash, publishedAt: null }))
  } else {
    try {
      schemaCatalogue = await fetchConnectionSchemaCatalogue(connection)
    } catch {
      schemaCatalogue = []
    }
  }

  const schemaHash = resolveSchemaHash(schemaCatalogue, schemaHashOverride)
  if (schemaHash === null) {
    return null
  }

  return {
    connectionId,
    branch,
    schemaHash,
    schemaCatalogue,
  }
}

/**
 * Resolves the authoritative connection-entry target from persisted Inspektor state.
 *
 * The parent connection loader uses this path for saved clicks, direct URLs, and refreshes. A
 * Schema discovery must succeed before the runtime target is committed so connection failures stay
 * owned by the route error boundary.
 */
export async function resolveStoredRuntimeTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  store,
  signal,
}: ResolveStoredRuntimeTargetOptions): Promise<ResolvedRuntimeTarget | null> {
  const resolvedStore = store ?? readStoredConnections()
  const connection = resolveRuntimeConnection(getConnectionById(resolvedStore, connectionId))
  if (connection === null) {
    return null
  }
  const branch = resolveDefaultBranch(resolvedStore, connectionId, branchOverride)
  const preferredSchemaHash =
    schemaHashOverride ?? getConnectionPreferences(resolvedStore, connectionId).lastSchemaHash
  const handoff = handedOffRuntimeTarget
  handedOffRuntimeTarget = null
  if (
    handoff !== null &&
    handoff.target.connectionId === connectionId &&
    matchesConnectionCredentials(connection, handoff.connection) === true &&
    handoff.target.branch === branch &&
    handoff.target.schemaHash === preferredSchemaHash
  ) {
    return handoff.target
  }
  const schemaCatalogue = await fetchConnectionSchemaCatalogueForRoute(connection, signal)

  const schemaHash = resolveDefaultSchemaHash(schemaCatalogue, schemaHashOverride)
  return schemaHash === null ? null : { connectionId, branch, schemaHash, schemaCatalogue }
}

/** Sends users back to connection setup when a Jazz runtime target is unavailable. */
export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections })
}

/** Sends a saved profile without a current credential to its unlock/edit form. */
export function redirectToEditConnection(connectionId: string): never {
  throw redirect({ to: appRoutes.editConnection, params: { connectionId } })
}
