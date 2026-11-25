import assert from 'node:assert/strict'
import { Deferred, Effect } from 'effect'
import {
  buildSchemaCatalogue,
  createConnectionFromDraft,
  createEmptyConnectionStore,
  createRuntimeTargetHandoff,
  createConnectionProfiles,
  createSchemaCatalogueLoadError,
  discoverConnectionInput,
  discoverSchemaCatalogue,
  discoverSchemaCatalogueWithRetry,
  isTransientSchemaFetchError,
  matchesConnectionCredentials,
  parseStoredConnections,
  planConnectionOpening,
  projectStoredConnections,
  resolveDefaultSchemaHash,
  resolveConnectionEntry,
  setActiveConnectionContext,
  upsertConnection,
  validateConnectionCredentials,
  type ConnectionProfileAccess,
  type RuntimeConnection,
  type StoredConnectionsStore,
} from '../src/studio/connection.ts'
import { JazzMetadata, loadLatestPermissions, loadStoredSchema } from '../src/jazz/schema.ts'

const credentials = { serverUrl: 'https://example.test', appId: 'app', adminSecret: 'probe-secret' }
const profile = createConnectionFromDraft(
  {
    ...credentials,
    name: ' App ',
    env: ' ',
    credentialRetention: 'memory',
  },
  'local',
)
const store = upsertConnection(createEmptyConnectionStore(), profile)

// @lat: [[inspectionContext#Connection identity]]
assert.equal(profile.name, 'App')
assert.equal(profile.env, 'dev')
assert.equal('adminSecret' in profile, false)
assert.equal(
  JSON.stringify(
    projectStoredConnections({
      ...store,
      connections: [{ ...profile, ...credentials }],
    }),
  ).includes(credentials.adminSecret),
  false,
)
assert.equal(parseStoredConnections({ ...store, nested: { adminSecret: 'rejected' } }), null)
assert.equal(parseStoredConnections({ ...store, version: 2 }), null)
assert.deepEqual(parseStoredConnections(projectStoredConnections(store)), store)
assert.equal(
  matchesConnectionCredentials(credentials, {
    ...credentials,
    serverUrl: ' https://example.test/ ',
    appId: ' app ',
    adminSecret: ' probe-secret ',
  }),
  true,
)
assert.deepEqual(
  setActiveConnectionContext(store, 'local', ' ', 'schema').preferencesByConnectionId.local,
  {
    lastBranch: 'main',
    lastSchemaHash: 'schema',
    rememberedBranches: ['main'],
  },
)

// @lat: [[inspectionContext#Schema and branch]], [[jazzAccess#Metadata access]]
const response = {
  hashes: ['older', 'latest', 'other'],
  schemas: [
    { hash: 'older', publishedAt: 1 },
    { hash: 'latest', publishedAt: 2 },
  ],
}
const catalogue = buildSchemaCatalogue(response, 'latest')
assert.deepEqual(
  catalogue.map(({ hash }) => hash),
  ['latest', 'older', 'other'],
)
assert.equal(resolveDefaultSchemaHash(catalogue, 'older'), 'older')
assert.equal(resolveDefaultSchemaHash(catalogue, 'absent'), 'latest')
assert.equal(resolveDefaultSchemaHash([], 'absent'), null)
const metadata = JazzMetadata.of({
  fetchSchemaHashes: () => Effect.succeed(response),
  fetchPublishedBundles: () => Effect.fail(new Error('bundle unavailable')),
  fetchStoredWasmSchema: () => Effect.die('not used'),
})
assert.deepEqual(
  await Effect.runPromise(
    discoverSchemaCatalogue(credentials).pipe(Effect.provideService(JazzMetadata, metadata)),
  ),
  buildSchemaCatalogue(response),
)
const bundles = [
  { bundle: 'older-bundle', schemaHash: 'selected', publishedAt: 1, permissions: {} },
  { bundle: 'latest-bundle', schemaHash: 'different', publishedAt: 2, permissions: {} },
]
const independentMetadata = JazzMetadata.of({
  ...metadata,
  fetchPublishedBundles: () => Effect.succeed(bundles),
  fetchStoredWasmSchema: (_connection, hash) => {
    assert.equal(hash, 'selected')
    return Effect.succeed({ schema: {}, publishedAt: 1 })
  },
})
assert.equal(
  await Effect.runPromise(
    loadLatestPermissions(credentials).pipe(
      Effect.provideService(JazzMetadata, independentMetadata),
    ),
  ),
  bundles[1],
)
assert.deepEqual(
  await Effect.runPromise(
    loadStoredSchema(credentials, 'selected').pipe(
      Effect.provideService(JazzMetadata, independentMetadata),
    ),
  ),
  { schema: {}, publishedAt: 1 },
)

assert.deepEqual(validateConnectionCredentials({ ...credentials, serverUrl: 'file:///app' }), {
  valid: false,
  reason: 'invalid-url',
})
assert.deepEqual(
  validateConnectionCredentials({ ...credentials, serverUrl: 'https://v2.sync.jazz.tools.' }),
  {
    valid: false,
    reason: 'invalid-app-id',
  },
)
assert.equal(validateConnectionCredentials(credentials).valid, true)
const noRequests = JazzMetadata.of({
  fetchSchemaHashes: () => Effect.die('Invalid input must not reach Jazz'),
  fetchPublishedBundles: () => Effect.die('Invalid input must not reach Jazz'),
  fetchStoredWasmSchema: () => Effect.die('not used'),
})
const invalid = await Effect.runPromise(
  discoverConnectionInput({ ...credentials, appId: '' }).pipe(
    Effect.provideService(JazzMetadata, noRequests),
    Effect.result,
  ),
)
assert.equal(invalid._tag, 'Failure')
if (invalid._tag === 'Failure') assert.equal(invalid.failure.name, 'ConnectionInputError')
const empty = await Effect.runPromise(
  discoverConnectionInput(credentials).pipe(
    Effect.provideService(JazzMetadata, {
      ...metadata,
      fetchSchemaHashes: () => Effect.succeed({ hashes: [], schemas: [] }),
    }),
    Effect.result,
  ),
)
assert.equal(empty._tag, 'Failure')
if (empty._tag === 'Failure') assert.equal(empty.failure.name, 'EmptySchemaCatalogueError')

// @lat: [[openConnection#Resolve entry]]
for (const status of [401, 403, 404, 429, 500]) {
  assert.equal(isTransientSchemaFetchError({ status }), false)
}
for (const status of [502, 503, 504]) {
  assert.equal(isTransientSchemaFetchError({ status }), true)
}
let attempts = 0
const retryMetadata = JazzMetadata.of({
  ...metadata,
  fetchSchemaHashes: () =>
    Effect.suspend(() => {
      attempts += 1
      return Effect.fail({ status: 503 })
    }),
})
const result = await Effect.runPromise(
  discoverSchemaCatalogueWithRetry(credentials).pipe(
    Effect.provideService(JazzMetadata, retryMetadata),
    Effect.result,
  ),
)
assert.equal(result._tag, 'Failure')
assert.equal(attempts, 3)
for (const [error, reason] of [
  [{ status: 401 }, 'authorization'],
  [{ status: 404 }, 'not-found'],
  [new Error('Schema hashes fetch failed: 503'), 'server'],
  [new TypeError('Failed to fetch'), 'network'],
  [new TypeError('Invalid URL'), 'invalid-url'],
  [new Error('unclassified probe error'), 'unknown'],
] as const) {
  assert.equal(createSchemaCatalogueLoadError(error).reason, reason)
}
let authorizationAttempts = 0
await Effect.runPromise(
  discoverSchemaCatalogueWithRetry(credentials).pipe(
    Effect.provideService(JazzMetadata, {
      ...metadata,
      fetchSchemaHashes: () =>
        Effect.suspend(() => {
          authorizationAttempts += 1
          return Effect.fail({ status: 401 })
        }),
    }),
    Effect.result,
  ),
)
assert.equal(authorizationAttempts, 1)

const controller = new AbortController()
let startRequest: () => void = () => {
  throw new Error('Start callback not installed')
}
const started = new Promise<void>((resolve) => {
  startRequest = resolve
})
let cancelledAttempts = 0
const cancelled = Effect.runPromise(
  discoverSchemaCatalogueWithRetry(credentials).pipe(
    Effect.provideService(JazzMetadata, {
      ...metadata,
      fetchSchemaHashes: () =>
        Effect.suspend(() => {
          cancelledAttempts += 1
          startRequest()
          return Effect.never
        }),
    }),
  ),
  { signal: controller.signal },
)
await started
controller.abort()
await assert.rejects(cancelled)
assert.equal(cancelledAttempts, 1)

const handoff = createRuntimeTargetHandoff()
const target = {
  connectionId: 'local',
  branch: 'main',
  schemaHash: 'latest',
  schemaCatalogue: catalogue,
}
handoff.offer(credentials, target)
assert.equal(
  handoff.take({
    connection: credentials,
    connectionId: 'local',
    branch: 'main',
    schemaHash: 'latest',
  }),
  target,
)
assert.equal(
  handoff.take({
    connection: credentials,
    connectionId: 'local',
    branch: 'main',
    schemaHash: 'latest',
  }),
  null,
)

// Entry ignores remembered schemas unless a matching one-shot handoff proves validation.
const entry = (schemaHashOverride?: string) =>
  resolveConnectionEntry({
    connection: credentials,
    connectionId: 'local',
    branch: 'main',
    schemaHashOverride,
    rememberedSchemaHash: 'older',
    handoff,
  }).pipe(
    Effect.provideService(JazzMetadata, {
      ...independentMetadata,
      fetchPublishedBundles: () => Effect.succeed([{ ...bundles[1], schemaHash: 'latest' }]),
    }),
  )
assert.equal((await Effect.runPromise(entry()))?.schemaHash, 'latest')
assert.equal((await Effect.runPromise(entry('older')))?.schemaHash, 'older')
assert.equal((await Effect.runPromise(entry('absent')))?.schemaHash, 'latest')
handoff.offer(credentials, target)
assert.equal(
  await Effect.runPromise(
    resolveConnectionEntry({
      connection: credentials,
      connectionId: 'local',
      branch: 'main',
      rememberedSchemaHash: 'latest',
      handoff,
    }).pipe(Effect.provideService(JazzMetadata, noRequests)),
  ),
  target,
)

const draft = { ...credentials, name: 'New name', env: ' ', credentialRetention: 'memory' as const }
const opening = {
  draft,
  branch: ' ',
  schemaHash: 'latest',
  schemaCatalogue: catalogue,
  existingConnection: { ...profile, ...credentials },
  createConnectionId: () => {
    throw new Error('Existing profile identity must not be replaced')
  },
}
assert.equal(planConnectionOpening(opening).action, 'activate-existing')
assert.equal(planConnectionOpening(opening).target.connectionId, profile.id)
assert.equal(planConnectionOpening({ ...opening, editingConnectionId: profile.id }).action, 'save')
assert.equal(
  planConnectionOpening({ ...opening, editingConnectionId: 'other' }).target.connectionId,
  profile.id,
)
const fresh = planConnectionOpening({
  ...opening,
  existingConnection: null,
  createConnectionId: () => 'fresh',
})
assert.equal(fresh.action, 'save')
assert.equal(fresh.target.connectionId, 'fresh')
assert.equal(fresh.target.branch, 'main')
assert.equal(fresh.draft.env, 'dev')
assert.equal(
  planConnectionOpening({
    ...opening,
    existingConnection: { ...profile, ...credentials, adminSecret: 'unrelated-probe-secret' },
    createConnectionId: () => 'fresh',
  }).target.connectionId,
  'fresh',
)
handoff.offer(credentials, target)
assert.equal(
  handoff.take({
    connection: { ...credentials, adminSecret: 'other' },
    connectionId: 'local',
    branch: 'main',
    schemaHash: 'latest',
  }),
  null,
)
assert.equal(
  handoff.take({
    connection: credentials,
    connectionId: 'local',
    branch: 'main',
    schemaHash: 'latest',
  }),
  null,
)

// @lat: [[jazzAccess#Credential boundary]], [[inspectionContext#Connection identity]]
// Synchronous fake browser ports expose persistence boundaries without a new runner.
function profileFixture(
  initialStore: StoredConnectionsStore = store,
  beforePersist: Effect.Effect<void> = Effect.void,
) {
  const previousSecret = 'previous-probe-secret'
  const credentialsById = new Map<string, RuntimeConnection>(
    initialStore.connections.map((connection) => [
      connection.id,
      { ...connection, adminSecret: previousSecret },
    ]),
  )
  const persistenceError = new Error('Profile persistence failed')
  const clearError = new Error('Credential removal failed')
  const restoreError = new Error('Credential restore failed')
  const scopedError = new Error('Scoped cleanup failed')
  const saveError = new Error('Credential save failed')
  const state = {
    persisted: initialStore,
    events: [] as string[],
    failPersist: false,
    failClear: false,
    failRestore: false,
    failScoped: false,
    failSave: false,
    onPersist: () => {},
  }
  const access: ConnectionProfileAccess = {
    persistProfiles: (next) =>
      Effect.andThen(
        beforePersist,
        Effect.try({
          try: () => {
            state.events.push('persist')
            state.onPersist()
            if (state.failPersist === true) throw persistenceError
            state.persisted = projectStoredConnections(next)
          },
          catch: (error) => error,
        }),
      ),
    resolveCredential: (connection) =>
      Effect.sync(() => {
        state.events.push('resolve')
        return connection === null ? null : (credentialsById.get(connection.id) ?? null)
      }),
    saveCredential: (connection, adminSecret) =>
      Effect.try({
        try: () => {
          const restores = adminSecret === previousSecret
          state.events.push(restores === true ? 'restore' : 'save')
          if (restores === true && state.failRestore === true) throw restoreError
          if (restores === false && state.failSave === true) throw saveError
          const runtime = { ...connection, adminSecret }
          credentialsById.set(connection.id, runtime)
          return runtime
        },
        catch: (error) => error,
      }),
    clearCredential: (id) =>
      Effect.try({
        try: () => {
          state.events.push('clear')
          if (state.failClear === true) throw clearError
          credentialsById.delete(id)
        },
        catch: (error) => error,
      }),
    removeScopedPreferences: () =>
      Effect.try({
        try: () => {
          state.events.push('scoped')
          if (state.failScoped === true) throw scopedError
        },
        catch: (error) => error,
      }),
  }
  const profiles = Effect.runSync(createConnectionProfiles(initialStore, access))
  return {
    profiles,
    state,
    previousSecret,
    persistenceError,
    clearError,
    restoreError,
    scopedError,
    saveError,
  }
}

const replacementDraft = { ...draft, adminSecret: 'replacement-probe-secret', env: 'production' }
{
  const initial = createEmptyConnectionStore()
  const { profiles, state, persistenceError } = profileFixture(initial)
  state.failPersist = true
  assert.throws(
    () => Effect.runSync(profiles.saveWithContext(replacementDraft, 'new', 'main', 'selected')),
    (error) => error === persistenceError,
  )
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'clear'])
  assert.equal(Effect.runSync(profiles.snapshot), initial)
  assert.equal(Effect.runSync(profiles.getConnection('new')), null)
}
{
  const { profiles, state } = profileFixture()
  state.onPersist = () => assert.equal(Effect.runSync(profiles.snapshot), store)
  Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'feature', 'selected'))
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'scoped'])
  const current = Effect.runSync(profiles.snapshot)
  assert.equal(current.connections[0]?.env, replacementDraft.env)
  assert.equal(current.preferencesByConnectionId[profile.id]?.lastBranch, 'feature')
  assert.deepEqual(state.persisted, projectStoredConnections(current))
  assert.equal(JSON.stringify(state.persisted).includes(replacementDraft.adminSecret), false)
}
{
  const { profiles, state, previousSecret, persistenceError } = profileFixture()
  state.failPersist = true
  assert.throws(
    () =>
      Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected')),
    (error) => error === persistenceError,
  )
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'clear', 'restore'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.equal(state.persisted, store)
  assert.equal(Effect.runSync(profiles.getConnection(profile.id))?.adminSecret, previousSecret)
}
{
  const { profiles, state, restoreError } = profileFixture()
  state.failPersist = true
  state.failRestore = true
  assert.throws(
    () =>
      Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected')),
    (error) => error === restoreError,
  )
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'clear', 'restore'])
  // Failed credential restore retains the saved local ID but requires secret re-entry.
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.equal(state.persisted.connections[0]?.id, profile.id)
  assert.equal(Effect.runSync(profiles.getConnection(profile.id)), null)
}
{
  const { profiles, state, clearError } = profileFixture()
  state.failPersist = true
  state.failClear = true
  assert.throws(
    () =>
      Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected')),
    (error) => error === clearError,
  )
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'clear'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
}
{
  const { profiles, state, clearError } = profileFixture()
  state.failClear = true
  assert.throws(
    () => Effect.runSync(profiles.deleteProfile(profile.id)),
    (error) => error === clearError,
  )
  assert.deepEqual(state.events, ['clear'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.equal(state.persisted, store)
}
{
  const { profiles, state, persistenceError } = profileFixture()
  state.failPersist = true
  assert.throws(
    () => Effect.runSync(profiles.deleteProfile(profile.id)),
    (error) => error === persistenceError,
  )
  assert.deepEqual(state.events, ['clear', 'persist'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.equal(Effect.runSync(profiles.getConnection(profile.id)), null)
}
{
  const { profiles, state, scopedError } = profileFixture()
  state.failScoped = true
  assert.throws(
    () => Effect.runSync(profiles.deleteProfile(profile.id)),
    (error) => error === scopedError,
  )
  assert.deepEqual(state.events, ['clear', 'persist', 'scoped'])
  assert.equal(Effect.runSync(profiles.snapshot).connections.length, 0)
  assert.equal(state.persisted.connections.length, 0)
  state.failScoped = false
  Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'replacement'))
  assert.equal(Effect.runSync(profiles.snapshot).connections[0]?.id, profile.id)
  assert.equal(state.persisted.connections[0]?.env, replacementDraft.env)
  assert.equal(
    Effect.runSync(profiles.getConnection(profile.id))?.adminSecret,
    replacementDraft.adminSecret,
  )
}
{
  const { profiles, state, scopedError } = profileFixture()
  state.failScoped = true
  assert.throws(
    () =>
      Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected')),
    (error) => error === scopedError,
  )
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'scoped'])
  assert.equal(Effect.runSync(profiles.snapshot).connections[0]?.env, replacementDraft.env)
  assert.equal(
    Effect.runSync(profiles.getConnection(profile.id))?.adminSecret,
    replacementDraft.adminSecret,
  )
  state.failScoped = false
  state.events = []
  Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'replacement'))
  // Re-entry compares with the committed replacement identity, not the original profile.
  assert.deepEqual(state.events, ['resolve', 'save', 'persist'])
  assert.equal(state.persisted.preferencesByConnectionId[profile.id]?.lastSchemaHash, 'replacement')
}
{
  const { profiles, state, saveError } = profileFixture()
  state.failSave = true
  assert.throws(
    () =>
      Effect.runSync(profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected')),
    (error) => error === saveError,
  )
  assert.deepEqual(state.events, ['resolve', 'save'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
}
for (const unchangedIdentity of [
  { ...draft, name: 'Renamed' },
  { ...draft, adminSecret: 'rotated-probe-secret' },
  { ...draft, credentialRetention: 'session' as const },
]) {
  const { profiles, state } = profileFixture()
  Effect.runSync(profiles.saveWithContext(unchangedIdentity, profile.id, 'main', 'selected'))
  assert.equal(state.events.includes('scoped'), false)
}
for (const changedIdentity of [
  replacementDraft,
  { ...draft, serverUrl: 'https://other.example.test' },
  { ...draft, appId: 'other-app' },
]) {
  const { profiles, state } = profileFixture()
  Effect.runSync(profiles.saveWithContext(changedIdentity, profile.id, 'main', 'selected'))
  assert.deepEqual(state.events.slice(-2), ['persist', 'scoped'])
}
{
  const { profiles, state, persistenceError } = profileFixture()
  state.failPersist = true
  assert.throws(
    () => Effect.runSync(profiles.setContext(profile.id, 'other', 'other')),
    (error) => error === persistenceError,
  )
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.deepEqual(state.events, ['persist'])
  state.failPersist = false
  state.onPersist = () => assert.equal(Effect.runSync(profiles.snapshot), store)
  Effect.runSync(profiles.setContext(profile.id, 'other', 'other'))
  assert.equal(
    Effect.runSync(profiles.snapshot).preferencesByConnectionId[profile.id]?.lastBranch,
    'other',
  )
}

{
  const { profiles, state } = profileFixture(createEmptyConnectionStore(), Effect.yieldNow)
  const [first, second] = await Effect.runPromise(
    Effect.all(
      [
        profiles.saveWithContext(draft, 'first', 'main', 'first-schema'),
        profiles.saveWithContext(draft, 'second', 'main', 'second-schema'),
      ],
      { concurrency: 'unbounded' },
    ),
  )
  assert.equal(first.id, 'first')
  assert.equal(second.id, 'second')
  assert.equal(state.persisted.preferencesByConnectionId[first.id]?.lastSchemaHash, 'first-schema')
  assert.equal(
    state.persisted.preferencesByConnectionId[second.id]?.lastSchemaHash,
    'second-schema',
  )
  assert.deepEqual(state.persisted.connections.map(({ id }) => id).sort(), ['first', 'second'])
  assert.deepEqual(
    (await Effect.runPromise(profiles.snapshot)).connections.map(({ id }) => id).sort(),
    ['first', 'second'],
  )
}
{
  const { profiles, state } = profileFixture(createEmptyConnectionStore(), Effect.yieldNow)
  await Effect.runPromise(
    Effect.all(
      [
        profiles.saveWithContext(draft, 'new', 'main', 'first-schema'),
        profiles.setContext('new', 'feature', 'second-schema'),
      ],
      { concurrency: 'unbounded' },
    ),
  )
  assert.equal(state.persisted.connections[0]?.id, 'new')
  assert.equal(state.persisted.preferencesByConnectionId.new?.lastSchemaHash, 'second-schema')
}
{
  const { profiles, state } = profileFixture(store, Effect.yieldNow)
  await Effect.runPromise(
    Effect.all(
      [
        profiles.saveWithContext(draft, 'new', 'main', 'new-schema'),
        profiles.deleteProfile(profile.id),
      ],
      { concurrency: 'unbounded' },
    ),
  )
  assert.deepEqual(
    state.persisted.connections.map(({ id }) => id),
    ['new'],
  )
}
{
  const { profiles, state } = profileFixture(store, Effect.yieldNow)
  state.failScoped = true
  const results = await Effect.runPromise(
    Effect.all(
      [
        profiles
          .saveWithContext(replacementDraft, profile.id, 'main', 'first-schema')
          .pipe(Effect.result),
        profiles
          .saveWithContext(replacementDraft, profile.id, 'feature', 'second-schema')
          .pipe(Effect.result),
      ],
      { concurrency: 'unbounded' },
    ),
  )
  assert.deepEqual(
    results.map((result) => result._tag),
    ['Failure', 'Success'],
  )
  assert.equal(state.persisted.connections[0]?.env, replacementDraft.env)
  assert.equal(
    state.persisted.preferencesByConnectionId[profile.id]?.lastSchemaHash,
    'second-schema',
  )
  assert.deepEqual(await Effect.runPromise(profiles.snapshot), state.persisted)
}
{
  const { profiles, state } = profileFixture(store, Effect.yieldNow)
  state.failScoped = true
  const results = await Effect.runPromise(
    Effect.all(
      [
        profiles.deleteProfile(profile.id).pipe(Effect.result),
        profiles
          .saveWithContext(replacementDraft, profile.id, 'feature', 'replacement-schema')
          .pipe(Effect.result),
      ],
      { concurrency: 'unbounded' },
    ),
  )
  assert.deepEqual(
    results.map((result) => result._tag),
    ['Failure', 'Success'],
  )
  assert.equal(state.persisted.connections[0]?.id, profile.id)
  assert.equal(state.persisted.connections[0]?.env, replacementDraft.env)
  assert.equal(
    state.persisted.preferencesByConnectionId[profile.id]?.lastSchemaHash,
    'replacement-schema',
  )
  assert.deepEqual(await Effect.runPromise(profiles.snapshot), state.persisted)
}

{
  const entered = Deferred.makeUnsafe<void>()
  const release = Deferred.makeUnsafe<void>()
  const { profiles, state, previousSecret } = profileFixture(
    store,
    Effect.andThen(Deferred.succeed(entered, undefined), Deferred.await(release)),
  )
  state.failPersist = true
  const abort = new AbortController()
  const pending = Effect.runPromise(
    profiles.saveWithContext(replacementDraft, profile.id, 'main', 'selected'),
    { signal: abort.signal },
  )
  await Effect.runPromise(Deferred.await(entered))
  abort.abort()
  Effect.runSync(Deferred.succeed(release, undefined))
  await assert.rejects(pending)
  assert.deepEqual(state.events, ['resolve', 'save', 'persist', 'clear', 'restore'])
  assert.equal(Effect.runSync(profiles.snapshot), store)
  assert.equal(Effect.runSync(profiles.getConnection(profile.id))?.adminSecret, previousSecret)
  state.failPersist = false
  await Effect.runPromise(profiles.setContext(profile.id, 'main', 'after-compensation'))
  assert.equal(
    state.persisted.preferencesByConnectionId[profile.id]?.lastSchemaHash,
    'after-compensation',
  )
}

console.log('Connection tests passed')
