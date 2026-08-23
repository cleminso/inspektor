/**
 * Resolves partial Inspector navigation into concrete Jazz runtime targets.
 *
 * Entry routes may only know the connection. These helpers combine stored Inspector
 * preferences with Jazz schema-hash metadata so table and query-subscriptions routes can bootstrap
 * the same runtime context after direct navigation, refresh, or redirect.
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

/** Internal values that identify one inspectable Jazz runtime context. */
export interface ResolvedTablesNavigationTarget {
  connectionId: string
  branch: string
  schemaHash: string
  availableSchemaHashes: readonly string[]
}

interface ResolveTablesNavigationTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  getConnection: (connectionId: string) => StoredConnection | null
  resolveBranch: (connectionId: string, branchOverride?: string | null) => string
  resolveSchemaHash: (
    connectionId: string,
    availableSchemaHashes: readonly string[],
    schemaHashOverride?: string | null,
  ) => string | null
  knownSchemaHashes?: readonly string[]
  schemaFetchError?: 'ignore' | 'throw'
}

interface ResolveStoredTablesNavigationTargetOptions {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  store?: StoredConnectionsStore
}

interface PreparedTablesNavigationTarget {
  connection: StoredConnection
  target: ResolvedTablesNavigationTarget
}

const preparedTablesNavigationTargets = new Map<string, PreparedTablesNavigationTarget>()

function hasSameRuntimeProfile(left: StoredConnection, right: StoredConnection): boolean {
  return (
    left.id === right.id &&
    left.serverUrl === right.serverUrl &&
    left.appId === right.appId &&
    left.adminSecret === right.adminSecret &&
    left.env === right.env
  )
}

export function prepareStoredTablesNavigationTarget(
  connection: StoredConnection,
  target: ResolvedTablesNavigationTarget,
): () => void {
  const preparedTarget = { connection, target }
  preparedTablesNavigationTargets.set(connection.id, preparedTarget)

  return () => {
    if (preparedTablesNavigationTargets.get(connection.id) === preparedTarget) {
      preparedTablesNavigationTargets.delete(connection.id)
    }
  }
}

function consumePreparedTablesNavigationTarget(
  connection: StoredConnection,
  store: StoredConnectionsStore,
  branchOverride?: string | null,
  schemaHashOverride?: string | null,
): ResolvedTablesNavigationTarget | null {
  const preparedTarget = preparedTablesNavigationTargets.get(connection.id)
  if (preparedTarget === undefined) {
    return null
  }
  preparedTablesNavigationTargets.delete(connection.id)

  if (hasSameRuntimeProfile(preparedTarget.connection, connection) === false) {
    return null
  }

  const expectedBranch = resolveDefaultBranch(store, connection.id, branchOverride)
  const expectedSchemaHash = resolveDefaultSchemaHash(
    store,
    connection.id,
    preparedTarget.target.availableSchemaHashes,
    schemaHashOverride,
  )
  return preparedTarget.target.branch === expectedBranch &&
    preparedTarget.target.schemaHash === expectedSchemaHash
    ? preparedTarget.target
    : null
}

async function fetchConnectionSchemaHashes(
  connection: StoredConnection,
): Promise<readonly string[]> {
  const { fetchSchemaHashes } = await import('jazz-tools')
  return (
    await fetchSchemaHashes(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    })
  ).hashes
}

/**
 * Resolves a connection into branch and schema-hash route params without requiring a mounted Jazz
 * provider.
 *
 * The Jazz metadata import stays inside this user-triggered navigation path so onboarding does not
 * make it part of the application-root graph. `knownSchemaHashes` prevents refetching when the
 * mounted runtime already has the hash list.
 */
export async function resolveTablesNavigationTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  getConnection,
  resolveBranch,
  resolveSchemaHash,
  knownSchemaHashes,
  schemaFetchError = 'ignore',
}: ResolveTablesNavigationTargetOptions): Promise<ResolvedTablesNavigationTarget | null> {
  const connection = getConnection(connectionId)
  if (connection === null) {
    return null
  }

  const branch = resolveBranch(connectionId, branchOverride)
  let availableSchemaHashes: readonly string[]
  if (knownSchemaHashes !== undefined && knownSchemaHashes.length > 0) {
    availableSchemaHashes = knownSchemaHashes
  } else {
    try {
      availableSchemaHashes = await fetchConnectionSchemaHashes(connection)
    } catch (error) {
      if (schemaFetchError === 'throw') {
        throw error
      }
      availableSchemaHashes = []
    }
  }

  const schemaHash = resolveSchemaHash(connectionId, availableSchemaHashes, schemaHashOverride)
  if (schemaHash === null) {
    return null
  }

  return {
    connectionId,
    branch,
    schemaHash,
    availableSchemaHashes,
  }
}

/** Uses persisted Inspector connections when loaders need a complete runtime route. */
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
  const preparedTarget = consumePreparedTablesNavigationTarget(
    connection,
    resolvedStore,
    branchOverride,
    schemaHashOverride,
  )
  if (preparedTarget !== null) {
    return preparedTarget
  }

  let availableSchemaHashes: readonly string[]
  try {
    availableSchemaHashes = await fetchConnectionSchemaHashes(connection)
  } catch (error) {
    if (preferredSchemaHash === null) {
      throw error
    }

    return {
      connectionId,
      branch,
      schemaHash: preferredSchemaHash,
      availableSchemaHashes: [],
    }
  }

  const schemaHash = resolveDefaultSchemaHash(
    resolvedStore,
    connectionId,
    availableSchemaHashes,
    schemaHashOverride,
  )
  return schemaHash === null ? null : { connectionId, branch, schemaHash, availableSchemaHashes }
}

/** Sends users back to connection setup when a Jazz runtime target is unavailable. */
export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections })
}
