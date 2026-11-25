import { Effect } from 'effect'
import { redirect } from '@tanstack/react-router'
import {
  createRuntimeTargetHandoff,
  discoverSchemaCatalogue,
  discoverSchemaCatalogueWithRetry,
  resolveRuntimeTarget as resolveTarget,
  resolveConnectionEntry,
  type ConnectionCredentials,
  type ResolvedRuntimeTarget,
  type RuntimeConnection,
  type SchemaCatalogueRecord,
  type StoredConnectionsStore,
} from '@inspektor/core/connection'
import { JazzMetadata } from '@inspektor/core/jazz/schema'
import { resolveRuntimeConnection } from '@app/connections/connectionCredentials'
import {
  getConnectionById,
  getConnectionPreferences,
  readStoredConnections,
  resolveDefaultBranch,
} from '@app/connections/connections'
import { appRoutes } from './appRoutes'

export {
  buildSchemaCatalogue,
  type ResolvedRuntimeTarget,
  type SchemaCatalogueRecord,
} from '@inspektor/core/connection'

const runtimeTargetHandoff = createRuntimeTargetHandoff()

export function fetchConnectionSchemaCatalogue(
  connection: ConnectionCredentials,
): Promise<readonly SchemaCatalogueRecord[]> {
  return Effect.runPromise(
    discoverSchemaCatalogue(connection).pipe(Effect.provide(JazzMetadata.layer)),
  )
}

export function fetchConnectionSchemaCatalogueWithRetry(
  connection: ConnectionCredentials,
  signal?: AbortSignal,
): Promise<readonly SchemaCatalogueRecord[]> {
  signal?.throwIfAborted()
  return Effect.runPromise(
    discoverSchemaCatalogueWithRetry(connection).pipe(Effect.provide(JazzMetadata.layer)),
    { signal },
  )
}

export function handoffStoredRuntimeTarget(
  connection: ConnectionCredentials,
  target: ResolvedRuntimeTarget,
): void {
  runtimeTargetHandoff.offer(connection, target)
}

/** Compatibility boundary for session callbacks. Core owns discovery and schema selection. */
export function resolveRuntimeTarget(options: {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  getConnection: (connectionId: string) => RuntimeConnection | null
  resolveBranch: (connectionId: string, branchOverride?: string | null) => string
  resolveSchemaHash: (
    catalogue: readonly SchemaCatalogueRecord[],
    schemaHashOverride?: string | null,
  ) => string | null
  knownSchemaHashes?: readonly string[]
}): Promise<ResolvedRuntimeTarget | null> {
  return Effect.runPromise(resolveTarget(options).pipe(Effect.provide(JazzMetadata.layer)))
}

/** Browser credentials and persisted state enter the headless selection boundary here. */
export async function resolveStoredRuntimeTarget(options: {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  store?: StoredConnectionsStore
  signal?: AbortSignal
}): Promise<ResolvedRuntimeTarget | null> {
  const store = options.store ?? readStoredConnections()
  const connection = resolveRuntimeConnection(getConnectionById(store, options.connectionId))
  if (connection === null) return null
  const branch = resolveDefaultBranch(store, options.connectionId, options.branchOverride)
  options.signal?.throwIfAborted()
  return Effect.runPromise(
    resolveConnectionEntry({
      connection,
      connectionId: options.connectionId,
      branch,
      schemaHashOverride: options.schemaHashOverride,
      rememberedSchemaHash: getConnectionPreferences(store, options.connectionId).lastSchemaHash,
      handoff: runtimeTargetHandoff,
    }).pipe(Effect.provide(JazzMetadata.layer)),
    { signal: options.signal },
  )
}

export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections })
}
export function redirectToEditConnection(connectionId: string): never {
  throw redirect({ to: appRoutes.editConnection, params: { connectionId } })
}
