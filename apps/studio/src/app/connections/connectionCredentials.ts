import type { RuntimeConnection, StoredConnection } from './connections'
import { normalizeServerUrl } from './connectionIdentity'

const CONNECTION_CREDENTIALS_STORAGE_KEY = 'inspektor-connection-credentials'

interface StoredCredential {
  serverUrl: string
  appId: string
  adminSecret: string
}

interface StoredCredentials {
  version: 1
  credentialsByConnectionId: Record<string, StoredCredential>
}

interface CredentialVault {
  get(connectionId: string): StoredCredential | undefined
  set(connectionId: string, credential: StoredCredential): void
  delete(connectionId: string): void
}

/**
 * Keeps credentials available while the application is mounted without exposing
 * them to browser persistence. A module-level vault survives React remounts but
 * is intentionally empty after a full page reload.
 */
const memoryCredentialVault = createMemoryCredentialVault()

/**
 * Uses the browser's tab-scoped session storage only for profiles that opted in.
 * The storage object is resolved lazily because accessing it can throw when the
 * browser blocks site storage, including in private browsing environments.
 */
const sessionCredentialVault = createSessionCredentialVault()

/**
 * Stores a credential according to the profile's retention policy and returns
 * the runtime connection used by the privileged client.
 */
export function saveConnectionCredential(
  connection: StoredConnection,
  adminSecret: string,
): RuntimeConnection {
  const credential = createStoredCredential(connection, adminSecret)

  if (connection.credentialRetention === 'session') {
    sessionCredentialVault.set(connection.id, credential)
  } else {
    sessionCredentialVault.delete(connection.id)
  }

  // Hydrate memory immediately so runtime consumers do not need to read storage.
  memoryCredentialVault.set(connection.id, credential)
  return { ...connection, adminSecret: credential.adminSecret }
}

/**
 * Rehydrates a secret-free profile from memory or its opted-in tab storage.
 * Returning null keeps routes and runtime providers from starting without a
 * credential after a reload or when browser storage is unavailable.
 */
export function resolveRuntimeConnection(
  connection: StoredConnection | null | undefined,
): RuntimeConnection | null {
  if (connection === null || connection === undefined) return null

  const memoryCredential = memoryCredentialVault.get(connection.id)
  if (matchesProfile(memoryCredential, connection) === true) {
    return { ...connection, adminSecret: memoryCredential.adminSecret }
  }

  if (connection.credentialRetention === 'memory') return null

  const sessionCredential = sessionCredentialVault.get(connection.id)
  if (matchesProfile(sessionCredential, connection) === false) return null

  // Promote a restored tab credential to the fast in-memory vault for this mount.
  memoryCredentialVault.set(connection.id, sessionCredential)
  return { ...connection, adminSecret: sessionCredential.adminSecret }
}

/** Removes a connection's credential from both volatile and tab-scoped storage. */
export function clearConnectionCredential(connectionId: string): void {
  memoryCredentialVault.delete(connectionId)
  sessionCredentialVault.delete(connectionId)
}

function createMemoryCredentialVault(): CredentialVault {
  const credentials = new Map<string, StoredCredential>()

  return {
    get: (connectionId) => credentials.get(connectionId),
    set: (connectionId, credential) => credentials.set(connectionId, credential),
    delete: (connectionId) => credentials.delete(connectionId),
  }
}

function createSessionCredentialVault(): CredentialVault {
  return {
    get: (connectionId) => readSessionCredentials().credentialsByConnectionId[connectionId],
    set: (connectionId, credential) => {
      const credentials = readSessionCredentials()
      writeSessionCredentials({
        version: 1,
        credentialsByConnectionId: {
          ...credentials.credentialsByConnectionId,
          [connectionId]: credential,
        },
      })
    },
    delete: removeSessionCredential,
  }
}

function createStoredCredential(
  connection: StoredConnection,
  adminSecret: string,
): StoredCredential {
  return {
    serverUrl: normalizeServerUrl(connection.serverUrl),
    appId: connection.appId.trim(),
    adminSecret: adminSecret.trim(),
  }
}

function matchesProfile(
  credential: StoredCredential | null | undefined,
  connection: StoredConnection,
): credential is StoredCredential {
  return (
    credential !== null &&
    credential !== undefined &&
    credential.serverUrl === normalizeServerUrl(connection.serverUrl) &&
    credential.appId === connection.appId.trim() &&
    credential.adminSecret.length > 0
  )
}

function readSessionCredentials(): StoredCredentials {
  const storage = getSessionStorage()
  if (storage === null) return createEmptyCredentials()

  try {
    const raw = storage.getItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
    if (raw === null) return createEmptyCredentials()
    const parsed = JSON.parse(raw) as unknown
    if (isStoredCredentials(parsed) === true) return parsed
    storage.removeItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
  } catch {
    return createEmptyCredentials()
  }

  return createEmptyCredentials()
}

function writeSessionCredentials(credentials: StoredCredentials): void {
  const storage = getSessionStorage()
  if (storage === null) {
    throw new Error('Session storage is unavailable')
  }
  storage.setItem(CONNECTION_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
}

function removeSessionCredential(connectionId: string): void {
  const storage = getSessionStorageForDeletion()
  if (storage === null) return

  const raw = storage.getItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
  if (raw === null) return

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    // Invalid data cannot be inspected safely, so remove the whole envelope.
    storage.removeItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
    return
  }
  if (isStoredCredentials(parsed) === false) {
    // Invalid data cannot be inspected safely, so remove the whole envelope.
    storage.removeItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
    return
  }

  const credentials = parsed
  if (connectionId in credentials.credentialsByConnectionId === false) return
  const credentialsByConnectionId = { ...credentials.credentialsByConnectionId }
  delete credentialsByConnectionId[connectionId]
  if (Object.keys(credentialsByConnectionId).length === 0) {
    storage.removeItem(CONNECTION_CREDENTIALS_STORAGE_KEY)
    return
  }
  writeSessionCredentials({ version: 1, credentialsByConnectionId })
}

/** Returns the tab-scoped browser storage without letting access failures escape. */
function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Gets session storage for destructive cleanup. Unlike ordinary reads, cleanup
 * must report access failures so callers do not persist a memory-only policy
 * while leaving an old secret in browser storage.
 */
function getSessionStorageForDeletion(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    throw new Error('Session storage is unavailable')
  }
}

function createEmptyCredentials(): StoredCredentials {
  return { version: 1, credentialsByConnectionId: {} }
}

function isStoredCredentials(value: unknown): value is StoredCredentials {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as StoredCredentials
  return (
    candidate.version === 1 &&
    typeof candidate.credentialsByConnectionId === 'object' &&
    candidate.credentialsByConnectionId !== null &&
    Object.values(candidate.credentialsByConnectionId).every(isStoredCredential) === true
  )
}

function isStoredCredential(value: unknown): value is StoredCredential {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as StoredCredential
  return (
    typeof candidate.serverUrl === 'string' &&
    typeof candidate.appId === 'string' &&
    typeof candidate.adminSecret === 'string'
  )
}
