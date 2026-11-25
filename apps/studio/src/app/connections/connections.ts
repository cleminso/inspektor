import {
  createConnectionFromDraft as createProfile,
  createEmptyConnectionStore,
  parseStoredConnections,
  projectStoredConnections,
  type ConnectionDraft,
  type StoredConnection,
  type StoredConnectionsStore,
} from '@inspektor/core/connection'

export {
  DEFAULT_SERVER_URL,
  DEFAULT_BRANCH_NAME,
  createEmptyConnectionStore,
  getActiveConnection,
  getConnectionById,
  getConnectionPreferences,
  setActiveConnectionContext,
  upsertConnection,
  removeConnection,
  getConnectionDisplayName,
  normalizeBranchName,
  normalizeEnvName,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  type ConnectionCredentials,
  type CredentialRetention,
  type ConnectionDraft,
  type StoredConnection,
  type RuntimeConnection,
  type ConnectionPreferences,
  type StoredConnectionsStore,
} from '@inspektor/core/connection'

const CONNECTIONS_STORAGE_KEY = 'inspektor-connections'

/** Browser storage is an adapter. Core owns parsing and the secret-free projection. */
export function readStoredConnections(): StoredConnectionsStore {
  if (typeof localStorage === 'undefined') return createEmptyConnectionStore()
  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY)
    if (raw === null) return createEmptyConnectionStore()
    const parsed: unknown = JSON.parse(raw)
    const store = parseStoredConnections(parsed)
    if (store !== null) return store
    localStorage.removeItem(CONNECTIONS_STORAGE_KEY)
  } catch {
    try {
      localStorage.removeItem(CONNECTIONS_STORAGE_KEY)
    } catch {
      // Storage failure must not restore an unvalidated profile.
    }
  }
  return createEmptyConnectionStore()
}

export function writeStoredConnections(store: StoredConnectionsStore): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(projectStoredConnections(store)))
}

export function createConnectionFromDraft(
  draft: ConnectionDraft,
  connectionId = createConnectionId(),
): StoredConnection {
  return createProfile(draft, connectionId)
}

function createConnectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `connection-${Math.random().toString(36).slice(2, 10)}`
}
