/**
 * Local persistence model for Inspector connection profiles.
 *
 * From the Jazz side, each connection stores the credentials needed to create an admin
 * runtime against a Jazz app: server URL, app ID, admin secret, and env.
 *
 * From the Inspector side, the same store keeps UI session preferences separate from
 * credentials so branch/schema selection can change without rewriting connection data.
 */
const CONNECTIONS_STORAGE_KEY = 'inspektor-connections'
export const DEFAULT_SERVER_URL = 'https://v2.sync.jazz.tools/'
export const DEFAULT_BRANCH_NAME = 'main'
const DEFAULT_CONNECTION_NAME = 'my Jazz app'

/** Jazz admin credentials shared by validation, persistence, and runtime clients. */
export interface ConnectionCredentials {
  serverUrl: string
  appId: string
  adminSecret: string
}

/** Connection values before the Inspector assigns its local profile ID. */
export interface ConnectionDraft extends ConnectionCredentials {
  name: string
  env: string
}

/** Saved Jazz admin connection used to start the Inspector runtime. */
export interface StoredConnection extends ConnectionDraft {
  id: string
}

/** Inspector view state stored separately from Jazz connection credentials. */
export interface ConnectionPreferences {
  lastBranch: string
  lastSchemaHash: string | null
  rememberedBranches: string[]
}

/** Version 1 localStorage schema for Jazz credentials and Inspector preferences. */
export interface StoredConnectionsStore {
  version: 1
  activeConnectionId: string | null
  connections: StoredConnection[]
  preferencesByConnectionId: Record<string, ConnectionPreferences>
}

/** Creates the empty Inspector connection store used when persisted data is unavailable. */
export function createEmptyConnectionStore(): StoredConnectionsStore {
  return {
    version: 1,
    activeConnectionId: null,
    connections: [],
    preferencesByConnectionId: {},
  }
}

/**
 * Reads and validates the persisted Inspector connection store.
 *
 * Stored JSON is treated as untrusted input because localStorage can be edited
 * manually and legacy Inspector stores used different shapes.
 */
export function readStoredConnections(): StoredConnectionsStore {
  if (typeof localStorage === 'undefined') {
    return createEmptyConnectionStore()
  }

  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY)
    if (raw === null) {
      return createEmptyConnectionStore()
    }

    const parsed = JSON.parse(raw) as unknown
    return parseStoredConnections(parsed) ?? createEmptyConnectionStore()
  } catch {
    return createEmptyConnectionStore()
  }
}

/** Persists the complete Inspector connection store. */
export function writeStoredConnections(store: StoredConnectionsStore): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(store))
}

/** Resolves the active Inspector profile, falling back when the saved ID is stale. */
export function getActiveConnection(store: StoredConnectionsStore): StoredConnection | null {
  return getConnectionById(store, store.activeConnectionId) ?? store.connections[0] ?? null
}

export function getConnectionById(
  store: StoredConnectionsStore,
  connectionId: string | null | undefined,
): StoredConnection | null {
  if (connectionId === null || connectionId === undefined || connectionId.length === 0) {
    return null
  }

  return store.connections.find((connection) => connection.id === connectionId) ?? null
}

/** Returns Inspector preferences with defaults so callers never handle a missing record. */
export function getConnectionPreferences(
  store: StoredConnectionsStore,
  connectionId: string,
): ConnectionPreferences {
  return (
    store.preferencesByConnectionId[connectionId] ?? {
      lastBranch: DEFAULT_BRANCH_NAME,
      lastSchemaHash: null,
      rememberedBranches: [DEFAULT_BRANCH_NAME],
    }
  )
}

export function setActiveConnectionContext(
  store: StoredConnectionsStore,
  connectionId: string,
  branch: string,
  schemaHash: string,
): StoredConnectionsStore {
  const currentPreferences = getConnectionPreferences(store, connectionId)
  return {
    ...updateConnectionPreferences(store, connectionId, {
      lastBranch: branch,
      lastSchemaHash: schemaHash,
      rememberedBranches: [branch, ...currentPreferences.rememberedBranches],
    }),
    activeConnectionId: connectionId,
  }
}

/** Saves a Jazz connection profile, marks it active, and ensures it has preferences. */
export function upsertConnection(
  store: StoredConnectionsStore,
  connection: StoredConnection,
): StoredConnectionsStore {
  const existingConnection = getConnectionById(store, connection.id)

  return {
    ...store,
    activeConnectionId: connection.id,
    connections:
      existingConnection !== null
        ? store.connections.map((item) => (item.id === connection.id ? connection : item))
        : [...store.connections, connection],
    preferencesByConnectionId: {
      ...store.preferencesByConnectionId,
      [connection.id]: getConnectionPreferences(store, connection.id),
    },
  }
}

export function removeConnection(
  store: StoredConnectionsStore,
  connectionId: string,
): StoredConnectionsStore {
  const connections = store.connections.filter((connection) => connection.id !== connectionId)
  const preferencesByConnectionId = { ...store.preferencesByConnectionId }
  delete preferencesByConnectionId[connectionId]

  return {
    ...store,
    activeConnectionId:
      store.activeConnectionId === connectionId
        ? (connections[0]?.id ?? null)
        : store.activeConnectionId,
    connections,
    preferencesByConnectionId,
  }
}

/**
 * Updates Inspector runtime preferences while keeping branch values normalized and deduped.
 *
 * Branch and schema hash are Jazz runtime context, but the Inspector stores them as
 * preferences because they describe the selected view of a saved connection.
 */
function updateConnectionPreferences(
  store: StoredConnectionsStore,
  connectionId: string,
  updates: Partial<ConnectionPreferences>,
): StoredConnectionsStore {
  const currentPreferences = getConnectionPreferences(store, connectionId)
  const nextPreferences: ConnectionPreferences = {
    lastBranch: normalizeBranchName(updates.lastBranch ?? currentPreferences.lastBranch),
    lastSchemaHash:
      updates.lastSchemaHash === undefined
        ? currentPreferences.lastSchemaHash
        : updates.lastSchemaHash,
    rememberedBranches: dedupeBranches(
      updates.rememberedBranches ?? currentPreferences.rememberedBranches,
    ),
  }

  if (nextPreferences.rememberedBranches.includes(nextPreferences.lastBranch) === false) {
    nextPreferences.rememberedBranches = [
      nextPreferences.lastBranch,
      ...nextPreferences.rememberedBranches,
    ]
  }

  return {
    ...store,
    preferencesByConnectionId: {
      ...store.preferencesByConnectionId,
      [connectionId]: nextPreferences,
    },
  }
}

/** Converts editable values into the saved Jazz connection shape used by runtime hooks. */
export function createConnectionFromDraft(
  draft: ConnectionDraft,
  connectionId = createConnectionId(),
): StoredConnection {
  return {
    id: connectionId,
    name: draft.name.trim() || DEFAULT_CONNECTION_NAME,
    serverUrl: draft.serverUrl.trim(),
    appId: draft.appId.trim(),
    adminSecret: draft.adminSecret.trim(),
    env: normalizeEnvName(draft.env),
  }
}

function createConnectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `connection-${Math.random().toString(36).slice(2, 10)}`
}

export function getConnectionDisplayName(connection: StoredConnection): string {
  const name = connection.name.trim()
  return name.length > 0 ? name : DEFAULT_CONNECTION_NAME
}

export function normalizeBranchName(branch: string | null | undefined): string {
  const normalizedBranch = branch?.trim() ?? ''
  return normalizedBranch.length > 0 ? normalizedBranch : DEFAULT_BRANCH_NAME
}

export function normalizeEnvName(env: string | null | undefined): string {
  const normalizedEnv = env?.trim() ?? ''
  return normalizedEnv.length > 0 ? normalizedEnv : 'dev'
}

export function resolveDefaultBranch(
  store: StoredConnectionsStore,
  connectionId: string,
  branch?: string | null,
): string {
  return normalizeBranchName(branch ?? getConnectionPreferences(store, connectionId).lastBranch)
}

/**
 * Chooses the schema hash the Inspector should use for a connection.
 *
 * Jazz can expose multiple stored schema hashes for the same app. The Inspector only
 * reuses a requested or remembered hash when Jazz reports it as available.
 */
export function resolveDefaultSchemaHash(
  schemaCatalogue: readonly { hash: string }[],
  schemaHash?: string | null,
): string | null {
  if (
    schemaHash !== null &&
    schemaHash !== undefined &&
    schemaCatalogue.some(({ hash }) => hash === schemaHash) === true
  ) {
    return schemaHash
  }

  return schemaCatalogue[0]?.hash ?? null
}

function parseStoredConnections(parsed: unknown): StoredConnectionsStore | null {
  if (isStoredConnectionsStore(parsed) === true) {
    return {
      version: 1,
      activeConnectionId: parsed.activeConnectionId,
      connections: parsed.connections.map((connection) => ({
        ...connection,
        env: normalizeEnvName(connection.env),
      })),
      preferencesByConnectionId: Object.fromEntries(
        Object.entries(parsed.preferencesByConnectionId).map(([connectionId, preferences]) => [
          connectionId,
          {
            lastBranch: normalizeBranchName(preferences.lastBranch),
            lastSchemaHash: preferences.lastSchemaHash,
            rememberedBranches: dedupeBranches(preferences.rememberedBranches),
          },
        ]),
      ),
    }
  }

  return null
}

function isStoredConnectionsStore(value: unknown): value is StoredConnectionsStore {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as StoredConnectionsStore
  return (
    candidate.version === 1 &&
    (candidate.activeConnectionId === null || typeof candidate.activeConnectionId === 'string') &&
    Array.isArray(candidate.connections) === true &&
    candidate.connections.every(isStoredConnection) === true &&
    typeof candidate.preferencesByConnectionId === 'object' &&
    candidate.preferencesByConnectionId !== null &&
    Object.values(candidate.preferencesByConnectionId).every(isConnectionPreferences) === true
  )
}

function isStoredConnection(value: unknown): value is StoredConnection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as StoredConnection
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.serverUrl === 'string' &&
    typeof candidate.appId === 'string' &&
    typeof candidate.adminSecret === 'string' &&
    typeof candidate.env === 'string'
  )
}

function isConnectionPreferences(value: unknown): value is ConnectionPreferences {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as ConnectionPreferences
  return (
    typeof candidate.lastBranch === 'string' &&
    (candidate.lastSchemaHash === null || typeof candidate.lastSchemaHash === 'string') &&
    Array.isArray(candidate.rememberedBranches) === true &&
    candidate.rememberedBranches.every((branch) => typeof branch === 'string') === true
  )
}

/** Normalizes branch history while preserving input order for the branch picker. */
function dedupeBranches(branches: string[]): string[] {
  const normalizedBranches: string[] = []
  const seen = new Set<string>()

  for (const branch of branches) {
    const normalizedBranch = normalizeBranchName(branch)
    if (seen.has(normalizedBranch) === true) {
      continue
    }

    seen.add(normalizedBranch)
    normalizedBranches.push(normalizedBranch)
  }

  return normalizedBranches.length > 0 ? normalizedBranches : [DEFAULT_BRANCH_NAME]
}
