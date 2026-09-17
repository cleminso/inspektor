import { useCallback, useMemo, useRef, useState } from 'react'

import {
  createConnectionFromDraft,
  getActiveConnection,
  getConnectionById,
  getConnectionPreferences as getStoredConnectionPreferences,
  readStoredConnections,
  removeConnection,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  setActiveConnectionContext,
  upsertConnection,
  writeStoredConnections,
  type ConnectionDraft,
  type RuntimeConnection,
  type StoredConnection,
  type StoredConnectionsStore,
} from '@app/connections/connections'
import {
  clearConnectionCredential,
  resolveRuntimeConnection,
  saveConnectionCredential,
} from '@app/connections/connectionCredentials'
import { findConnectionByCredentials as findRuntimeConnectionByCredentials } from '@app/connections/connectionIdentity'
import { removeConnectionScopedStorage } from '@app/storage/connectionScopedStorage'

/**
 * React-facing API for the Inspektor connection session.
 *
 * Components use this instead of reading localStorage directly so connection CRUD,
 * active connection selection, and workspace preferences stay synchronized through one state
 * boundary.
 */
export interface UseStoredConnectionsResult {
  connections: StoredConnection[]
  activeConnection: RuntimeConnection | null
  activeConnectionId: string | null
  getConnection: (connectionId: string | null | undefined) => RuntimeConnection | null
  findConnectionByCredentials: (draft: ConnectionDraft) => RuntimeConnection | null
  getConnectionPreferences: (
    connectionId: string,
  ) => ReturnType<typeof getStoredConnectionPreferences>
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

/**
 * Owns the Inspektor's saved connection session.
 *
 * It selects the connection details and schema hash that `useInspectorRuntime` needs to create an
 * in-memory Jazz admin client. The stored branch label scopes Inspektor state only; Jazz branch
 * views must be passed to each query or mutation.
 *
 * From the Inspektor perspective, it provides a stable UI API for saved connections,
 * remembered branches, and selected schema hashes.
 */
export function useStoredConnections(): UseStoredConnectionsResult {
  const [store, setStore] = useState(readStoredConnections)
  const storeRef = useRef(store)

  const updateStore = useCallback(
    (update: (store: StoredConnectionsStore) => StoredConnectionsStore) => {
      const store = update(storeRef.current)
      writeStoredConnections(store)
      storeRef.current = store
      setStore(store)
    },
    [],
  )

  const getConnection = useCallback(
    (connectionId: string | null | undefined) =>
      resolveRuntimeConnection(getConnectionById(store, connectionId)),
    [store],
  )

  const findConnectionByCredentials = useCallback(
    (draft: ConnectionDraft) =>
      findRuntimeConnectionByCredentials(
        store.connections
          .map((connection) => resolveRuntimeConnection(connection))
          .filter((connection): connection is RuntimeConnection => connection !== null),
        draft,
      ),
    [store.connections],
  )

  const deleteConnection = useCallback(
    (connectionId: string) => {
      // Remove secrets first so a blocked browser storage operation cannot leave
      // a persisted credential behind after the profile has been deleted.
      clearConnectionCredential(connectionId)
      updateStore((store) => removeConnection(store, connectionId))
      removeConnectionScopedStorage(connectionId)
    },
    [updateStore],
  )

  const saveConnectionWithContext = useCallback(
    (draft: ConnectionDraft, connectionId: string, branch: string, schemaHash: string) => {
      const existingConnection = getConnectionById(storeRef.current, connectionId)
      const existingRuntimeConnection = resolveRuntimeConnection(existingConnection)
      const profile = createConnectionFromDraft(draft, connectionId)
      const connection = saveConnectionCredential(profile, draft.adminSecret)
      try {
        updateStore((store) =>
          setActiveConnectionContext(
            upsertConnection(store, profile),
            connectionId,
            branch,
            schemaHash,
          ),
        )
      } catch (error) {
        clearConnectionCredential(connectionId)
        if (existingConnection !== null && existingRuntimeConnection !== null) {
          saveConnectionCredential(existingConnection, existingRuntimeConnection.adminSecret)
        }
        throw error
      }
      if (
        existingConnection !== null &&
        (existingConnection.appId !== profile.appId ||
          existingConnection.env !== profile.env ||
          existingConnection.serverUrl !== profile.serverUrl)
      ) {
        removeConnectionScopedStorage(profile.id)
      }
      return connection
    },
    [updateStore],
  )

  const setConnectionContext = useCallback(
    (connectionId: string, branch: string, schemaHash: string) => {
      updateStore((store) => setActiveConnectionContext(store, connectionId, branch, schemaHash))
    },
    [updateStore],
  )

  // Keep the returned session object stable for consumers that depend on it as one value.
  return useMemo(
    () => ({
      connections: store.connections,
      activeConnection: resolveRuntimeConnection(getActiveConnection(store)),
      activeConnectionId: store.activeConnectionId,
      getConnection,
      findConnectionByCredentials,
      getConnectionPreferences: (connectionId: string) =>
        getStoredConnectionPreferences(store, connectionId),
      getRememberedBranches: (connectionId: string) =>
        getStoredConnectionPreferences(store, connectionId).rememberedBranches,
      resolveBranch: (connectionId: string, branch?: string | null) =>
        resolveDefaultBranch(store, connectionId, branch),
      resolveSchemaHash: (
        schemaCatalogue: readonly { hash: string }[],
        schemaHash?: string | null,
      ) => resolveDefaultSchemaHash(schemaCatalogue, schemaHash),
      saveConnectionWithContext,
      deleteConnection,
      setConnectionContext,
    }),
    [
      deleteConnection,
      findConnectionByCredentials,
      getConnection,
      saveConnectionWithContext,
      setConnectionContext,
      store,
    ],
  )
}
