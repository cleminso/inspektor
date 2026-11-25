import { useCallback, useMemo, useState } from 'react'
import { Effect } from 'effect'
import {
  createConnectionProfiles,
  getActiveConnection,
  getConnectionPreferences,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  type ConnectionDraft,
  type ConnectionProfileAccess,
  type RuntimeConnection,
  type StoredConnection,
} from '@inspektor/core/connection'
import { readStoredConnections, writeStoredConnections } from '@app/connections/connections'
import {
  clearConnectionCredential,
  resolveRuntimeConnection,
  saveConnectionCredential,
} from '@app/connections/connectionCredentials'
import { removeConnectionScopedStorage } from '@app/storage/connectionScopedStorage'

/** Each port is synchronous so React commands preserve their existing synchronous API. */
const profileAccess: ConnectionProfileAccess = {
  persistProfiles: (store) =>
    Effect.try({
      try: () => writeStoredConnections(store),
      catch: (error) => error,
    }),
  resolveCredential: (profile) =>
    Effect.try({
      try: () => resolveRuntimeConnection(profile),
      catch: (error) => error,
    }),
  saveCredential: (profile, adminSecret) =>
    Effect.try({
      try: () => saveConnectionCredential(profile, adminSecret),
      catch: (error) => error,
    }),
  clearCredential: (connectionId) =>
    Effect.try({
      try: () => clearConnectionCredential(connectionId),
      catch: (error) => error,
    }),
  removeScopedPreferences: (connectionId) =>
    Effect.try({
      try: () => removeConnectionScopedStorage(connectionId),
      catch: (error) => error,
    }),
}

export interface UseStoredConnectionsResult {
  connections: StoredConnection[]
  activeConnection: RuntimeConnection | null
  activeConnectionId: string | null
  getConnection: (connectionId: string | null | undefined) => RuntimeConnection | null
  findConnectionByCredentials: (draft: ConnectionDraft) => RuntimeConnection | null
  getConnectionPreferences: (connectionId: string) => ReturnType<typeof getConnectionPreferences>
  getRememberedBranches: (connectionId: string) => string[]
  resolveBranch: (connectionId: string, branch?: string | null) => string
  resolveSchemaHash: (
    schemaCatalogue: readonly { hash: string }[],
    schemaHash?: string | null,
  ) => string | null
  saveConnectionWithContext: (
    draft: ConnectionDraft,
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) => RuntimeConnection
  deleteConnection: (connectionId: string) => void
  setConnectionContext: (connectionId: string, branch: string, schemaHash: string) => void
}

/** React publishes the core controller's committed snapshot. Browser state stays tab-local. */
export function useStoredConnections(): UseStoredConnectionsResult {
  const [profiles] = useState(() =>
    Effect.runSync(createConnectionProfiles(readStoredConnections(), profileAccess)),
  )
  const [store, setStore] = useState(() => Effect.runSync(profiles.snapshot))
  const runCommand = useCallback(
    <A>(command: Effect.Effect<A, unknown>): A => {
      try {
        return Effect.runSync(command)
      } finally {
        // Cleanup can fail after a successful profile commit. Publish that commit even on failure.
        setStore(Effect.runSync(profiles.snapshot))
      }
    },
    [profiles],
  )
  const getConnection = useCallback(
    (connectionId: string | null | undefined) =>
      Effect.runSync(profiles.getConnection(connectionId)),
    [profiles],
  )
  const findConnectionByCredentials = useCallback(
    (draft: ConnectionDraft) => Effect.runSync(profiles.findByCredentials(draft)),
    [profiles],
  )
  const deleteConnection = useCallback(
    (connectionId: string) => runCommand(profiles.deleteProfile(connectionId)),
    [profiles, runCommand],
  )
  const saveConnectionWithContext = useCallback(
    (draft: ConnectionDraft, connectionId: string, branch: string, schemaHash: string) =>
      runCommand(profiles.saveWithContext(draft, connectionId, branch, schemaHash)),
    [profiles, runCommand],
  )
  const setConnectionContext = useCallback(
    (connectionId: string, branch: string, schemaHash: string) =>
      runCommand(profiles.setContext(connectionId, branch, schemaHash)),
    [profiles, runCommand],
  )
  return useMemo(
    () => ({
      connections: store.connections,
      activeConnection: getConnection(getActiveConnection(store)?.id),
      activeConnectionId: store.activeConnectionId,
      getConnection,
      findConnectionByCredentials,
      getConnectionPreferences: (connectionId: string) =>
        getConnectionPreferences(store, connectionId),
      getRememberedBranches: (connectionId: string) =>
        getConnectionPreferences(store, connectionId).rememberedBranches,
      resolveBranch: (connectionId: string, branch?: string | null) =>
        resolveDefaultBranch(store, connectionId, branch),
      resolveSchemaHash: resolveDefaultSchemaHash,
      saveConnectionWithContext,
      deleteConnection,
      setConnectionContext,
    }),
    [
      store,
      getConnection,
      findConnectionByCredentials,
      saveConnectionWithContext,
      deleteConnection,
      setConnectionContext,
    ],
  )
}
