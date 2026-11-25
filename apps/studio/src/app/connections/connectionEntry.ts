import { Effect } from 'effect'
import { redirect } from '@tanstack/react-router'
import {
  createRuntimeTargetHandoff,
  discoverSchemaCatalogueWithRetry,
  resolveConnectionEntry,
  type ConnectionCredentials,
  type ResolvedRuntimeTarget,
  type SchemaCatalogueRecord,
  type StoredConnectionsStore,
} from '@inspektor/core/workbench/connection'
import { JazzMetadata } from '@inspektor/core/jazz/schema'
import {
  getRuntimeExecutionIdentity,
  resolveRuntimeConnection,
} from '@app/connections/connectionCredentials'
import {
  getConnectionById,
  getConnectionPreferences,
  resolveDefaultBranch,
} from '@app/connections/connections'
import { readConnectionProfiles } from '@app/connections/connectionProfiles'
import { appRoutes } from '@app/routing/appRoutes'

export type {
  ResolvedRuntimeTarget,
  SchemaCatalogueRecord,
} from '@inspektor/core/workbench/connection'

const runtimeTargetHandoff = createRuntimeTargetHandoff()

/** Secret-free entry evidence. Runtime must use the execution settings that discovery validated. */
export interface ResolvedConnectionEntry extends ResolvedRuntimeTarget {
  executionIdentity: string
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

/** Browser credentials and persisted state enter the headless selection boundary here. */
export async function resolveStoredRuntimeTarget(options: {
  connectionId: string
  branchOverride?: string | null
  schemaHashOverride?: string | null
  store?: StoredConnectionsStore
  signal?: AbortSignal
}): Promise<ResolvedConnectionEntry | null> {
  const store = options.store ?? readConnectionProfiles()
  const connection = resolveRuntimeConnection(getConnectionById(store, options.connectionId))
  if (connection === null) return null
  const executionIdentity = getRuntimeExecutionIdentity(connection)
  const branch = resolveDefaultBranch(store, options.connectionId, options.branchOverride)
  options.signal?.throwIfAborted()
  const target = await Effect.runPromise(
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
  return target === null ? null : { ...target, executionIdentity }
}

export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections })
}
export function redirectToEditConnection(connectionId: string): never {
  throw redirect({ to: appRoutes.editConnection, params: { connectionId } })
}
