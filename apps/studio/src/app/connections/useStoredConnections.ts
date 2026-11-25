import { useCallback, useMemo, useState } from 'react'
import { Effect } from 'effect'
import {
  getActiveConnection,
  getConnectionPreferences,
  type ConnectionDraft,
  type RuntimeConnection,
  type StoredConnection,
} from '@inspektor/core/connection'
import { getConnectionProfiles } from './connectionProfiles'

export interface UseStoredConnectionsResult {
  connections: StoredConnection[]
  activeConnection: RuntimeConnection | null
  activeConnectionId: string | null
  getConnection: (connectionId: string | null | undefined) => RuntimeConnection | null
  findConnectionByCredentials: (draft: ConnectionDraft) => RuntimeConnection | null
  getConnectionPreferences: (connectionId: string) => ReturnType<typeof getConnectionPreferences>
  getRememberedBranches: (connectionId: string) => string[]
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
  const [profiles] = useState(getConnectionProfiles)
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
