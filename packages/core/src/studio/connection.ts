import { Effect, Option, Ref, Schema, Semaphore } from 'effect'
import { JazzMetadata, type SchemaHashesResponse } from '../jazz/schema.ts'

export const DEFAULT_SERVER_URL = 'https://v2.sync.jazz.tools/'
export const DEFAULT_BRANCH_NAME = 'main'
const DEFAULT_CONNECTION_NAME = 'my Jazz app'

export interface ConnectionCredentials {
  serverUrl: string
  appId: string
  adminSecret: string
}
export type CredentialRetention = StoredConnection['credentialRetention']
export type ConnectionDraft = Omit<StoredConnection, 'id'> &
  Pick<ConnectionCredentials, 'adminSecret'>
export type StoredConnection = typeof profileSchema.Type
export interface RuntimeConnection extends StoredConnection {
  adminSecret: string
}
export type ConnectionPreferences = typeof preferencesSchema.Type
export type StoredConnectionsStore = typeof storeSchema.Type

const profileSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  serverUrl: Schema.String,
  appId: Schema.String,
  env: Schema.String,
  credentialRetention: Schema.Literals(['memory', 'session']),
})
const preferencesSchema = Schema.Struct({
  lastBranch: Schema.String,
  lastSchemaHash: Schema.NullOr(Schema.String),
  rememberedBranches: Schema.mutable(Schema.Array(Schema.String)),
})
const storeSchema = Schema.Struct({
  version: Schema.Literal(1),
  activeConnectionId: Schema.NullOr(Schema.String),
  connections: Schema.mutable(Schema.Array(profileSchema)),
  preferencesByConnectionId: Schema.Record(Schema.String, preferencesSchema),
})

export function createEmptyConnectionStore(): StoredConnectionsStore {
  return { version: 1, activeConnectionId: null, connections: [], preferencesByConnectionId: {} }
}

/** Explicit projection prevents runtime credentials or extra properties from entering storage. */
// @lat: [[inspectionContext#Connection identity]], [[jazzAccess#Credential boundary]]
export function projectStoredConnections(store: StoredConnectionsStore): StoredConnectionsStore {
  return {
    version: 1,
    activeConnectionId: store.activeConnectionId,
    connections: store.connections.map(
      ({ id, name, serverUrl, appId, env, credentialRetention }) => ({
        id,
        name,
        serverUrl,
        appId,
        env,
        credentialRetention,
      }),
    ),
    preferencesByConnectionId: Object.fromEntries(
      Object.entries(store.preferencesByConnectionId).map(([id, preferences]) => [
        id,
        {
          lastBranch: preferences.lastBranch,
          lastSchemaHash: preferences.lastSchemaHash,
          rememberedBranches: [...preferences.rememberedBranches],
        },
      ]),
    ),
  }
}

export function parseStoredConnections(input: unknown): StoredConnectionsStore | null {
  if (containsAdminSecret(input) === true) return null
  const decoded = Schema.decodeUnknownOption(storeSchema)(input)
  if (Option.isNone(decoded)) return null
  const store = decoded.value
  return {
    version: 1,
    activeConnectionId: store.activeConnectionId,
    connections: store.connections.map((connection) => ({
      ...connection,
      env: normalizeEnvName(connection.env),
    })),
    preferencesByConnectionId: Object.fromEntries(
      Object.entries(store.preferencesByConnectionId).map(([id, preferences]) => [
        id,
        {
          lastBranch: normalizeBranchName(preferences.lastBranch),
          lastSchemaHash: preferences.lastSchemaHash,
          rememberedBranches: dedupeBranches(preferences.rememberedBranches),
        },
      ]),
    ),
  }
}

function containsAdminSecret(value: unknown): boolean {
  if (Array.isArray(value) === true) return value.some(containsAdminSecret)
  if (typeof value !== 'object' || value === null) return false
  return Object.entries(value).some(
    ([key, child]) => key.toLowerCase() === 'adminsecret' || containsAdminSecret(child),
  )
}

export function getActiveConnection(store: StoredConnectionsStore): StoredConnection | null {
  return getConnectionById(store, store.activeConnectionId) ?? store.connections[0] ?? null
}

export function getConnectionById(
  store: StoredConnectionsStore,
  connectionId: string | null | undefined,
): StoredConnection | null {
  if (connectionId === null || connectionId === undefined || connectionId.length === 0) return null
  return store.connections.find((connection) => connection.id === connectionId) ?? null
}

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
  const lastBranch = normalizeBranchName(branch)
  return {
    ...store,
    activeConnectionId: connectionId,
    preferencesByConnectionId: {
      ...store.preferencesByConnectionId,
      [connectionId]: {
        lastBranch,
        lastSchemaHash: schemaHash,
        rememberedBranches: dedupeBranches([
          lastBranch,
          ...getConnectionPreferences(store, connectionId).rememberedBranches,
        ]),
      },
    },
  }
}

export function upsertConnection(
  store: StoredConnectionsStore,
  connection: StoredConnection,
): StoredConnectionsStore {
  return {
    ...store,
    activeConnectionId: connection.id,
    connections:
      getConnectionById(store, connection.id) !== null
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
    connections,
    preferencesByConnectionId,
    activeConnectionId:
      store.activeConnectionId === connectionId
        ? (connections[0]?.id ?? null)
        : store.activeConnectionId,
  }
}

/** The platform supplies profile identity; core never reads platform randomness. */
export function createConnectionFromDraft(
  draft: ConnectionDraft,
  connectionId: string,
): StoredConnection {
  return {
    id: connectionId,
    name: draft.name.trim() || DEFAULT_CONNECTION_NAME,
    serverUrl: draft.serverUrl.trim(),
    appId: draft.appId.trim(),
    env: normalizeEnvName(draft.env),
    credentialRetention: draft.credentialRetention,
  }
}

export function getConnectionDisplayName(connection: StoredConnection): string {
  return connection.name.trim() || DEFAULT_CONNECTION_NAME
}
export function normalizeBranchName(branch: string | null | undefined): string {
  return branch?.trim() || DEFAULT_BRANCH_NAME
}
export function normalizeEnvName(env: string | null | undefined): string {
  return env?.trim() || 'dev'
}
export function resolveDefaultBranch(
  store: StoredConnectionsStore,
  connectionId: string,
  branch?: string | null,
): string {
  return normalizeBranchName(branch ?? getConnectionPreferences(store, connectionId).lastBranch)
}
export function resolveDefaultSchemaHash(
  catalogue: readonly { hash: string }[],
  schemaHash?: string | null,
): string | null {
  return schemaHash !== null &&
    schemaHash !== undefined &&
    catalogue.some(({ hash }) => hash === schemaHash) === true
    ? schemaHash
    : (catalogue[0]?.hash ?? null)
}
function dedupeBranches(branches: readonly string[]): string[] {
  const normalized = [...new Set(branches.map(normalizeBranchName))]
  return normalized.length > 0 ? normalized : [DEFAULT_BRANCH_NAME]
}

export function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.trim().replace(/\/+$/u, '')
}
export function matchesConnectionCredentials(
  connection: ConnectionCredentials,
  draft: ConnectionCredentials,
): boolean {
  return (
    normalizeServerUrl(connection.serverUrl) === normalizeServerUrl(draft.serverUrl) &&
    connection.appId.trim() === draft.appId.trim() &&
    connection.adminSecret.trim() === draft.adminSecret.trim()
  )
}
export function findConnectionByCredentials(
  connections: readonly RuntimeConnection[],
  draft: ConnectionCredentials,
): RuntimeConnection | null {
  return connections.find((connection) => matchesConnectionCredentials(connection, draft)) ?? null
}

export type InvalidConnectionReason =
  | 'invalid-url'
  | 'missing-app-id'
  | 'invalid-app-id'
  | 'missing-secret'
export type ConnectionInputResult =
  | { valid: true; value: ConnectionCredentials }
  | { valid: false; reason: InvalidConnectionReason }

export function validateConnectionCredentials(input: ConnectionCredentials): ConnectionInputResult {
  const serverUrl = input.serverUrl.trim()
  const appId = input.appId.trim()
  const adminSecret = input.adminSecret.trim()
  let url: URL
  try {
    url = new URL(serverUrl)
  } catch {
    return { valid: false, reason: 'invalid-url' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return { valid: false, reason: 'invalid-url' }
  if (appId.length === 0) return { valid: false, reason: 'missing-app-id' }
  if (
    url.hostname.toLowerCase().replace(/\.$/u, '') === 'v2.sync.jazz.tools' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(appId) === false
  ) {
    return { valid: false, reason: 'invalid-app-id' }
  }
  if (adminSecret.length === 0) return { valid: false, reason: 'missing-secret' }
  return { valid: true, value: { serverUrl, appId, adminSecret } }
}

export type SchemaCatalogueFailureReason =
  | 'authorization'
  | 'invalid-url'
  | 'network'
  | 'not-found'
  | 'server'
  | 'unknown'
export class SchemaCatalogueLoadError extends Error {
  readonly reason: SchemaCatalogueFailureReason
  constructor(reason: SchemaCatalogueFailureReason) {
    super('Schema catalogue request failed')
    this.name = 'SchemaCatalogueLoadError'
    this.reason = reason
  }
}
export function getHttpErrorStatus(error: unknown): number | null {
  if (error instanceof Error) {
    const match = /(?:fetch failed:|status(?: code)?)\s*(\d{3})\b/iu.exec(error.message)
    if (match?.[1] !== undefined) return Number(match[1])
  }
  if (typeof error !== 'object' || error === null) return null
  if ('status' in error && typeof error.status === 'number') return error.status
  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  )
    return error.response.status
  return null
}
function isNetworkFetchError(error: unknown): boolean {
  if (error instanceof TypeError === false) return false
  const message = error.message.toLowerCase()
  return [
    'failed to fetch',
    'fetch failed',
    'load failed',
    'network request failed',
    'networkerror',
  ].some((signature) => message.includes(signature))
}
export function isTransientSchemaFetchError(error: unknown): boolean {
  const status = getHttpErrorStatus(error)
  return status !== null
    ? status === 502 || status === 503 || status === 504
    : isNetworkFetchError(error)
}
export function createSchemaCatalogueLoadError(error: unknown): SchemaCatalogueLoadError {
  if (error instanceof SchemaCatalogueLoadError) return error
  const status = getHttpErrorStatus(error)
  const reason =
    status === 401 || status === 403
      ? 'authorization'
      : status === 404
        ? 'not-found'
        : status !== null && status >= 500
          ? 'server'
          : error instanceof TypeError && error.message.toLowerCase().includes('invalid url')
            ? 'invalid-url'
            : isNetworkFetchError(error) === true
              ? 'network'
              : 'unknown'
  return new SchemaCatalogueLoadError(reason)
}

export type SchemaCatalogueRecord = SchemaHashesResponse['schemas'][number]
export interface ResolvedRuntimeTarget {
  connectionId: string
  branch: string
  schemaHash: string
  schemaCatalogue: readonly SchemaCatalogueRecord[]
}
export function buildSchemaCatalogue(
  response: {
    readonly hashes: readonly string[]
    readonly schemas: readonly SchemaCatalogueRecord[]
  },
  latestSchemaHash: string | null = null,
): SchemaCatalogueRecord[] {
  const publishedAt = new Map(response.schemas.map((schema) => [schema.hash, schema.publishedAt]))
  return response.hashes
    .map((hash) => ({ hash, publishedAt: publishedAt.get(hash) ?? null }))
    .sort((left, right) =>
      left.hash === latestSchemaHash ? -1 : right.hash === latestSchemaHash ? 1 : 0,
    )
}

// @lat: [[jazzAccess#Metadata access]]
export const discoverSchemaCatalogue = Effect.fnUntraced(function* (
  connection: ConnectionCredentials,
) {
  const metadata = yield* JazzMetadata
  const [response, bundles] = yield* Effect.all(
    [
      metadata.fetchSchemaHashes(connection),
      metadata.fetchPublishedBundles(connection).pipe(Effect.catch(() => Effect.succeed([]))),
    ],
    { concurrency: 'unbounded' },
  )
  return buildSchemaCatalogue(response, bundles.at(-1)?.schemaHash ?? null)
})

/** Preserve the evidenced two retries. Cancellation interrupts waits, not Jazz's public request. */
// @lat: [[openConnection#Resolve entry]]
export const discoverSchemaCatalogueWithRetry = Effect.fnUntraced(function* (
  connection: ConnectionCredentials,
) {
  const delays = [250, 750] as const
  for (let attempt = 0; ; attempt += 1) {
    const result = yield* discoverSchemaCatalogue(connection).pipe(Effect.result)
    if (result._tag === 'Success') return result.success
    const delay = delays[attempt]
    if (delay === undefined || isTransientSchemaFetchError(result.failure) === false) {
      return yield* Effect.fail(createSchemaCatalogueLoadError(result.failure))
    }
    yield* Effect.sleep(delay)
  }
})

export function selectRuntimeTarget(options: {
  readonly connectionId: string
  readonly branch: string
  readonly schemaCatalogue: readonly SchemaCatalogueRecord[]
  readonly schemaHash?: string | null | undefined
}): ResolvedRuntimeTarget | null {
  const schemaHash = resolveDefaultSchemaHash(options.schemaCatalogue, options.schemaHash)
  return schemaHash === null
    ? null
    : {
        connectionId: options.connectionId,
        branch: normalizeBranchName(options.branch),
        schemaHash,
        schemaCatalogue: options.schemaCatalogue,
      }
}

/** Mounted context changes can reuse known hashes and tolerate failed rediscovery. */
export const resolveRuntimeTarget = Effect.fnUntraced(function* (options: {
  readonly connectionId: string
  readonly branchOverride?: string | null | undefined
  readonly schemaHashOverride?: string | null | undefined
  readonly getConnection: (connectionId: string) => RuntimeConnection | null
  readonly resolveBranch: (connectionId: string, branchOverride?: string | null) => string
  readonly resolveSchemaHash: (
    catalogue: readonly SchemaCatalogueRecord[],
    schemaHashOverride?: string | null,
  ) => string | null
  readonly knownSchemaHashes?: readonly string[] | undefined
}) {
  const connection = options.getConnection(options.connectionId)
  if (connection === null) return null
  const branch = options.resolveBranch(options.connectionId, options.branchOverride)
  const schemaCatalogue =
    options.knownSchemaHashes !== undefined && options.knownSchemaHashes.length > 0
      ? options.knownSchemaHashes.map((hash) => ({ hash, publishedAt: null }))
      : yield* discoverSchemaCatalogue(connection).pipe(Effect.catch(() => Effect.succeed([])))
  const schemaHash = options.resolveSchemaHash(schemaCatalogue, options.schemaHashOverride)
  return schemaHash === null
    ? null
    : {
        connectionId: options.connectionId,
        branch,
        schemaHash,
        schemaCatalogue,
      }
})

/** Entry must establish a catalogue unless an exact validated handoff satisfies the request. */
// @lat: [[openConnection#Resolve entry]], [[inspectionContext#Schema and branch]]
export const resolveConnectionEntry = Effect.fnUntraced(function* (options: {
  readonly connection: ConnectionCredentials
  readonly connectionId: string
  readonly branch: string
  readonly schemaHashOverride?: string | null | undefined
  readonly rememberedSchemaHash: string | null
  readonly handoff: ReturnType<typeof createRuntimeTargetHandoff>
}) {
  const target = options.handoff.take({
    connection: options.connection,
    connectionId: options.connectionId,
    branch: options.branch,
    schemaHash: options.schemaHashOverride ?? options.rememberedSchemaHash,
  })
  if (target !== null) return target
  const schemaCatalogue = yield* discoverSchemaCatalogueWithRetry(options.connection)
  return selectRuntimeTarget({
    connectionId: options.connectionId,
    branch: options.branch,
    schemaCatalogue,
    schemaHash: options.schemaHashOverride,
  })
})

export class ConnectionInputError extends Schema.TaggedError<ConnectionInputError>()(
  'ConnectionInputError',
  {
    reason: Schema.Literals(['invalid-url', 'missing-app-id', 'invalid-app-id', 'missing-secret']),
  },
) {}
export class EmptySchemaCatalogueError extends Schema.TaggedError<EmptySchemaCatalogueError>()(
  'EmptySchemaCatalogueError',
  {},
) {}

/** Discovery after local validation. An empty catalogue cannot produce an opening plan. */
export const discoverConnection = Effect.fnUntraced(function* (connection: ConnectionCredentials) {
  const schemaCatalogue = yield* discoverSchemaCatalogue(connection).pipe(
    Effect.mapError(createSchemaCatalogueLoadError),
  )
  const schemaHash = schemaCatalogue[0]?.hash
  if (schemaHash === undefined) return yield* new EmptySchemaCatalogueError()
  return { credentials: connection, schemaCatalogue, schemaHash }
})

/** Headless callers can validate and discover as one typed operation. */
export const discoverConnectionInput = Effect.fnUntraced(function* (input: ConnectionCredentials) {
  const validation = validateConnectionCredentials(input)
  if (validation.valid === false)
    return yield* new ConnectionInputError({ reason: validation.reason })
  return yield* discoverConnection(validation.value)
})

/** Existing credential identity wins over labels, except when editing that same profile. */
export function planConnectionOpening(options: {
  readonly draft: ConnectionDraft
  readonly branch: string
  readonly schemaHash: string
  readonly schemaCatalogue: readonly SchemaCatalogueRecord[]
  readonly existingConnection: RuntimeConnection | null
  readonly editingConnectionId?: string | undefined
  readonly createConnectionId: () => string
}): {
  action: 'activate-existing' | 'save'
  draft: ConnectionDraft
  target: ResolvedRuntimeTarget
} {
  const existing = options.existingConnection
  const opensExisting =
    existing !== null &&
    matchesConnectionCredentials(existing, options.draft) === true &&
    existing.id !== options.editingConnectionId
  const connectionId = opensExisting
    ? existing.id
    : (options.editingConnectionId ?? options.createConnectionId())
  return {
    action: opensExisting ? 'activate-existing' : 'save',
    draft: {
      ...options.draft,
      serverUrl: options.draft.serverUrl.trim(),
      appId: options.draft.appId.trim(),
      adminSecret: options.draft.adminSecret.trim(),
      env: normalizeEnvName(options.draft.env),
    },
    target: {
      connectionId,
      branch: normalizeBranchName(options.branch),
      schemaHash: options.schemaHash,
      schemaCatalogue: options.schemaCatalogue,
    },
  }
}

/** One-shot, credential-bound handoff. Even an unmatched take consumes the stale entry. */
export function createRuntimeTargetHandoff() {
  let offered: { connection: ConnectionCredentials; target: ResolvedRuntimeTarget } | null = null
  return {
    offer(connection: ConnectionCredentials, target: ResolvedRuntimeTarget): void {
      offered = { connection: { ...connection }, target }
    },
    take(options: {
      readonly connection: ConnectionCredentials
      readonly connectionId: string
      readonly branch: string
      readonly schemaHash: string | null
    }): ResolvedRuntimeTarget | null {
      const handoff = offered
      offered = null
      return handoff !== null &&
        handoff.target.connectionId === options.connectionId &&
        matchesConnectionCredentials(options.connection, handoff.connection) === true &&
        handoff.target.branch === options.branch &&
        handoff.target.schemaHash === options.schemaHash
        ? handoff.target
        : null
    },
  }
}

/** Platform operations stay injected. Studio supplies synchronous browser implementations. */
export interface ConnectionProfileAccess {
  readonly persistProfiles: (store: StoredConnectionsStore) => Effect.Effect<void, unknown>
  readonly resolveCredential: (
    profile: StoredConnection | null,
  ) => Effect.Effect<RuntimeConnection | null, unknown>
  readonly saveCredential: (
    profile: StoredConnection,
    adminSecret: string,
  ) => Effect.Effect<RuntimeConnection, unknown>
  readonly clearCredential: (connectionId: string) => Effect.Effect<void, unknown>
  readonly removeScopedPreferences: (connectionId: string) => Effect.Effect<void, unknown>
}

/**
 * Saved-profile coordination, not a Jazz runtime session. The snapshot changes only after profile
 * persistence succeeds. Credential compensation preserves the previous local profile identity.
 */
// @lat: [[inspectionContext#Connection identity]], [[jazzAccess#Credential boundary]]
export const createConnectionProfiles = Effect.fnUntraced(function* (
  initialStore: StoredConnectionsStore,
  access: ConnectionProfileAccess,
) {
  const store = yield* Ref.make(initialStore)
  // Async ports must not let another mutation use a snapshot from before this command's commit.
  // Hold one permit through credential compensation and scoped cleanup; reads stay independent.
  const mutations = yield* Semaphore.make(1)
  const snapshot = Ref.get(store)
  const commit = Effect.fnUntraced(function* (next: StoredConnectionsStore) {
    yield* access.persistProfiles(next)
    yield* Ref.set(store, next)
  })
  const getConnection = Effect.fnUntraced(function* (connectionId: string | null | undefined) {
    return yield* access.resolveCredential(getConnectionById(yield* snapshot, connectionId))
  })
  const findByCredentials = Effect.fnUntraced(function* (draft: ConnectionCredentials) {
    const current = yield* snapshot
    for (const profile of current.connections) {
      const connection = yield* access.resolveCredential(profile)
      if (connection !== null && matchesConnectionCredentials(connection, draft) === true)
        return connection
    }
    return null
  })
  const deleteProfile = Effect.fnUntraced(function* (connectionId: string) {
    // Secret removal must succeed before the profile disappears from persistence or UI state.
    yield* access.clearCredential(connectionId)
    yield* commit(removeConnection(yield* snapshot, connectionId))
    yield* access.removeScopedPreferences(connectionId)
  })
  const saveWithContext = Effect.fnUntraced(function* (
    draft: ConnectionDraft,
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) {
    const current = yield* snapshot
    const existing = getConnectionById(current, connectionId)
    const existingRuntime = yield* access.resolveCredential(existing)
    const profile = createConnectionFromDraft(draft, connectionId)
    const connection = yield* access.saveCredential(profile, draft.adminSecret)
    yield* commit(
      setActiveConnectionContext(
        upsertConnection(current, profile),
        connectionId,
        branch,
        schemaHash,
      ),
    ).pipe(
      Effect.catch((error) =>
        Effect.gen(function* () {
          // A failed clear or restore remains observable. Never claim that a blocked secret was removed.
          yield* access.clearCredential(connectionId)
          if (existing !== null && existingRuntime !== null) {
            yield* access.saveCredential(existing, existingRuntime.adminSecret)
          }
          return yield* Effect.fail(error)
        }),
      ),
    )
    if (
      existing !== null &&
      (existing.appId !== profile.appId ||
        existing.env !== profile.env ||
        existing.serverUrl !== profile.serverUrl)
    ) {
      yield* access.removeScopedPreferences(profile.id)
    }
    return connection
  })
  const setContext = Effect.fnUntraced(function* (
    connectionId: string,
    branch: string,
    schemaHash: string,
  ) {
    yield* commit(setActiveConnectionContext(yield* snapshot, connectionId, branch, schemaHash))
  })
  return {
    snapshot,
    getConnection,
    findByCredentials,
    deleteProfile: (connectionId: string) =>
      deleteProfile(connectionId).pipe(Effect.uninterruptible, mutations.withPermit),
    saveWithContext: (
      draft: ConnectionDraft,
      connectionId: string,
      branch: string,
      schemaHash: string,
    ) =>
      saveWithContext(draft, connectionId, branch, schemaHash).pipe(
        Effect.uninterruptible,
        mutations.withPermit,
      ),
    setContext: (connectionId: string, branch: string, schemaHash: string) =>
      setContext(connectionId, branch, schemaHash).pipe(
        Effect.uninterruptible,
        mutations.withPermit,
      ),
  }
})
