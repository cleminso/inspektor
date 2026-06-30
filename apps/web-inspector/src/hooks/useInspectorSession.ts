import { useCallback, useMemo, useState } from "react";

import {
  createConnectionFromDraft,
  getActiveConnection,
  getConnectionById,
  getConnectionDisplayName,
  getConnectionPreferences,
  readStoredConnections,
  rememberBranch,
  removeConnection,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  setActiveConnectionId,
  updateConnectionPreferences,
  upsertConnection,
  writeStoredConnections,
  type ConnectionDraft,
  type StoredConnection,
  type StoredConnectionsStore,
} from "@/lib/config/connections";
import { readPrefillConfig, type PrefillConfig } from "@/lib/config/prefill";

/**
 * React-facing API for the Inspector connection session.
 *
 * Components use this instead of reading localStorage directly so connection CRUD,
 * URL-provided dev links, active connection selection, and Jazz runtime preferences stay
 * synchronized through one state boundary.
 */
export interface UseInspectorSessionResult {
  store: StoredConnectionsStore;
  connections: StoredConnection[];
  activeConnection: StoredConnection | null;
  activeConnectionId: string | null;
  prefill: PrefillConfig | null;
  getConnection: (connectionId: string | null | undefined) => StoredConnection | null;
  getConnectionLabel: (connectionId: string) => string | null;
  getRememberedBranches: (connectionId: string) => string[];
  resolveBranch: (connectionId: string, branch?: string | null) => string;
  resolveSchemaHash: (
    connectionId: string,
    availableSchemaHashes: string[],
    schemaHash?: string | null,
  ) => string | null;
  saveConnection: (draft: ConnectionDraft, connectionId?: string) => StoredConnection;
  deleteConnection: (connectionId: string) => void;
  setActiveConnection: (connectionId: string | null) => void;
  rememberContext: (connectionId: string, branch: string, schemaHash?: string | null) => void;
}

interface SessionState {
  store: StoredConnectionsStore;
  prefill: PrefillConfig | null;
}

/**
 * Owns the Inspector's saved connection session.
 *
 * From the Jazz perspective, it selects the connection details and runtime context that
 * `useInspectorRuntime` needs to create an in-memory Jazz admin client.
 *
 * From the Inspector perspective, it provides a stable UI API for saved connections,
 * remembered branches, selected schema hashes, and URL-provided prefill data.
 */
export function useInspectorSession(): UseInspectorSessionResult {
  const [state, setState] = useState<SessionState>(() => ({
    store: readStoredConnections(),
    prefill: readPrefillConfig(),
  }));

  // Keep saved connection storage and React state in sync through one write path.
  const persistStore = useCallback((store: StoredConnectionsStore) => {
    writeStoredConnections(store);
    setState((currentState) => ({
      ...currentState,
      store,
    }));
  }, []);

  const getConnection = useCallback(
    (connectionId: string | null | undefined) => getConnectionById(state.store, connectionId),
    [state.store],
  );

  const saveConnection = useCallback(
    (draft: ConnectionDraft, connectionId?: string) => {
      const connection = createConnectionFromDraft(draft, connectionId);
      persistStore(upsertConnection(state.store, connection));
      return connection;
    },
    [persistStore, state.store],
  );

  const deleteConnection = useCallback(
    (connectionId: string) => {
      persistStore(removeConnection(state.store, connectionId));
    },
    [persistStore, state.store],
  );

  const setActiveConnection = useCallback(
    (connectionId: string | null) => {
      persistStore(setActiveConnectionId(state.store, connectionId));
    },
    [persistStore, state.store],
  );

  const rememberContext = useCallback(
    (connectionId: string, branch: string, schemaHash?: string | null) => {
      const currentPreferences = getConnectionPreferences(state.store, connectionId);
      const nextBranch = branch.trim() || currentPreferences.lastBranch;
      const nextSchemaHash = schemaHash ?? null;
      const hasRememberedBranch = currentPreferences.rememberedBranches.includes(nextBranch);

      // Avoid rewriting storage when navigation did not change the remembered runtime context.
      if (
        currentPreferences.lastBranch === nextBranch &&
        currentPreferences.lastSchemaHash === nextSchemaHash &&
        hasRememberedBranch
      ) {
        return;
      }

      const nextStore = updateConnectionPreferences(
        rememberBranch(state.store, connectionId, nextBranch),
        connectionId,
        { lastSchemaHash: nextSchemaHash },
      );
      persistStore(nextStore);
    },
    [persistStore, state.store],
  );

  // Keep the returned session object stable for consumers that depend on it as one value.
  return useMemo(
    () => ({
      store: state.store,
      connections: state.store.connections,
      activeConnection: getActiveConnection(state.store),
      activeConnectionId: state.store.activeConnectionId,
      prefill: state.prefill,
      getConnection,
      getConnectionLabel: (connectionId: string) => {
        const connection = getConnection(connectionId);
        return connection ? getConnectionDisplayName(connection) : null;
      },
      getRememberedBranches: (connectionId: string) =>
        getConnectionPreferences(state.store, connectionId).rememberedBranches,
      resolveBranch: (connectionId: string, branch?: string | null) =>
        resolveDefaultBranch(state.store, connectionId, branch),
      resolveSchemaHash: (connectionId: string, availableSchemaHashes: string[], schemaHash?: string | null) =>
        resolveDefaultSchemaHash(state.store, connectionId, availableSchemaHashes, schemaHash),
      saveConnection,
      deleteConnection,
      setActiveConnection,
      rememberContext,
    }),
    [deleteConnection, getConnection, rememberContext, saveConnection, setActiveConnection, state.prefill, state.store],
  );
}
