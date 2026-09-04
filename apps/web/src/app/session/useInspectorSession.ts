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
  type StoredConnection,
  type StoredConnectionsStore,
} from '@app/connections/connections'
import { readPrefillConfig, type PrefillConfig } from '@app/connections/prefill'
import { removeConnectionScopedStorage } from '@app/storage/connectionScopedStorage'

/**
 * React-facing API for the Inspektor connection session.
 *
 * Components use this instead of reading localStorage directly so connection CRUD,
 * URL-provided dev links, active connection selection, and Jazz runtime preferences stay
 * synchronized through one state boundary.
 */
export interface UseInspectorSessionResult {
  connections: StoredConnection[]
  activeConnection: StoredConnection | null
  activeConnectionId: string | null
  prefill: PrefillConfig | null
  getConnection: (connectionId: string | null | undefined) => StoredConnection | null
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
  ) => StoredConnection
  deleteConnection: (connectionId: string) => void
  setConnectionContext: (connectionId: string, branch: string, schemaHash: string) => void
}

interface SessionState {
  store: StoredConnectionsStore
  prefill: PrefillConfig | null
}

/**
 * Owns the Inspektor's saved connection session.
 *
 * From the Jazz perspective, it selects the connection details and runtime context that
 * `useInspectorRuntime` needs to create an in-memory Jazz admin client.
 *
 * From the Inspektor perspective, it provides a stable UI API for saved connections,
 * remembered branches, selected schema hashes, and URL-provided prefill data.
 */
export function useInspectorSession(): UseInspectorSessionResult {
  const [state, setState] = useState<SessionState>(() => ({
    store: readStoredConnections(),
    prefill: readPrefillConfig(),
  }))
  const storeRef = useRef(state.store)

  const updateStore = useCallback(
    (update: (store: StoredConnectionsStore) => StoredConnectionsStore) => {
      const store = update(storeRef.current)
      writeStoredConnections(store)
      storeRef.current = store
      setState((currentState) => ({ ...currentState, store }))
    },
    [],
  )

  const getConnection = useCallback(
    (connectionId: string | null | undefined) => getConnectionById(state.store, connectionId),
    [state.store],
  )

  const deleteConnection = useCallback(
    (connectionId: string) => {
      updateStore((store) => removeConnection(store, connectionId))
      removeConnectionScopedStorage(connectionId)
    },
    [updateStore],
  )

  const saveConnectionWithContext = useCallback(
    (draft: ConnectionDraft, connectionId: string, branch: string, schemaHash: string) => {
      const existingConnection = getConnectionById(storeRef.current, connectionId)
      const connection = createConnectionFromDraft(draft, connectionId)
      updateStore((store) =>
        setActiveConnectionContext(
          upsertConnection(store, connection),
          connectionId,
          branch,
          schemaHash,
        ),
      )
      if (
        existingConnection !== null &&
        (existingConnection.appId !== connection.appId ||
          existingConnection.env !== connection.env ||
          existingConnection.serverUrl !== connection.serverUrl)
      ) {
        removeConnectionScopedStorage(connection.id)
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
      connections: state.store.connections,
      activeConnection: getActiveConnection(state.store),
      activeConnectionId: state.store.activeConnectionId,
      prefill: state.prefill,
      getConnection,
      getConnectionPreferences: (connectionId: string) =>
        getStoredConnectionPreferences(state.store, connectionId),
      getRememberedBranches: (connectionId: string) =>
        getStoredConnectionPreferences(state.store, connectionId).rememberedBranches,
      resolveBranch: (connectionId: string, branch?: string | null) =>
        resolveDefaultBranch(state.store, connectionId, branch),
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
      getConnection,
      saveConnectionWithContext,
      setConnectionContext,
      state.prefill,
      state.store,
    ],
  )
}
