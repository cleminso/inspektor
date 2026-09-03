/**
 * Resolves partial Inspector navigation into concrete Jazz runtime targets.
 *
 * Entry routes may only know the connection. These helpers combine stored Inspector preferences
 * with Jazz schema-hash metadata so every connection-scoped route can bootstrap the same runtime
 * after a saved click, direct navigation, or refresh.
 */
import { redirect } from '@tanstack/react-router'

import {
  getConnectionById,
  getConnectionPreferences,
  readStoredConnections,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  type StoredConnection,
  type StoredConnectionsStore,
} from '@app/connections/connections'

import { appRoutes } from './appRoutes'

/** Resolved connection-entry or branch-selection result, including its available schema catalogue. */
export interface ResolvedTablesNavigationTarget {
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

interface ResolveTablesNavigationTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  getConnection: (connectionId: string) => StoredConnection | null
  resolveBranch: (connectionId: string, branchOverride?: string | null) => string
  resolveSchemaHash: (
    schemaCatalogue: readonly SchemaCatalogueRecord[],
    schemaHashOverride?: string | null,
  ) => string | null
  knownSchemaHashes?: readonly string[]
}

interface ResolveStoredTablesNavigationTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  store?: StoredConnectionsStore
}

/** Places the deployed schema first while preserving the advertised order of every other schema. */
export function createSchemaCatalogue(
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
  connection: StoredConnection,
): Promise<string | null> {
  const serverUrl = connection.serverUrl.trim().replace(/\/+$/, '')
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

async function fetchConnectionSchemaCatalogue(
  connection: StoredConnection,
): Promise<readonly SchemaCatalogueRecord[]> {
  const { fetchSchemaHashes } = await import('jazz-tools')
  const [response, latestSchemaHash] = await Promise.all([
    fetchSchemaHashes(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    }),
    fetchConnectionLatestSchemaHash(connection).catch(() => null),
  ])
  return createSchemaCatalogue(response, latestSchemaHash)
}

/**
 * Resolves a connection into a complete runtime selection without requiring a mounted Jazz
 * provider.
 *
 * Session uses this path for branch switching inside a mounted connection. The Jazz metadata import
 * stays outside the application-root graph, while `knownSchemaHashes` lets the mounted runtime avoid
 * repeating schema discovery.
 */
export async function resolveTablesNavigationTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  getConnection,
  resolveBranch,
  resolveSchemaHash,
  knownSchemaHashes,
}: ResolveTablesNavigationTargetOptions): Promise<ResolvedTablesNavigationTarget | null> {
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
 * Resolves the authoritative connection-entry target from persisted Inspector state.
 *
 * The parent connection loader uses this path for saved clicks, direct URLs, and refreshes. A
 * remembered schema remains usable when discovery fails; without one, the loader preserves the
 * discovery error for route-owned error presentation.
 */
export async function resolveStoredTablesNavigationTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  store,
}: ResolveStoredTablesNavigationTargetOptions): Promise<ResolvedTablesNavigationTarget | null> {
  const resolvedStore = store ?? readStoredConnections()
  const connection = getConnectionById(resolvedStore, connectionId)
  if (connection === null) {
    return null
  }
  const branch = resolveDefaultBranch(resolvedStore, connectionId, branchOverride)
  const preferredSchemaHash =
    schemaHashOverride ?? getConnectionPreferences(resolvedStore, connectionId).lastSchemaHash
  let schemaCatalogue: readonly SchemaCatalogueRecord[]
  try {
    schemaCatalogue = await fetchConnectionSchemaCatalogue(connection)
  } catch (error) {
    if (preferredSchemaHash === null) {
      throw error
    }

    return {
      connectionId,
      branch,
      schemaHash: preferredSchemaHash,
      schemaCatalogue: [],
    }
  }

  const schemaHash = resolveDefaultSchemaHash(schemaCatalogue, schemaHashOverride)
  return schemaHash === null ? null : { connectionId, branch, schemaHash, schemaCatalogue }
}

/** Sends users back to connection setup when a Jazz runtime target is unavailable. */
export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections })
}
