import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createEmptyConnectionStore,
  type StoredConnectionsStore,
} from '@app/connections/connections'
import {
  buildSchemaCatalogue,
  handoffStoredRuntimeTarget,
  resolveStoredRuntimeTarget,
} from '@app/routing/inspectorNavigation'

const fetchSchemaHashes = vi.fn()
const fetchPermissionsHead = vi.fn()

vi.mock('jazz-tools', () => ({ fetchSchemaHashes }))

beforeEach(() => {
  fetchPermissionsHead.mockResolvedValue({
    json: async () => ({ head: null }),
    ok: true,
    status: 200,
    statusText: 'OK',
  })
  vi.stubGlobal('fetch', fetchPermissionsHead)
})

afterEach(() => {
  fetchSchemaHashes.mockReset()
  fetchPermissionsHead.mockReset()
  vi.unstubAllGlobals()
})

function createStore(lastSchemaHash: string | null = 'schema-1'): StoredConnectionsStore {
  const store = createEmptyConnectionStore()

  return {
    ...store,
    activeConnectionId: 'connection-1',
    connections: [
      {
        id: 'connection-1',
        name: 'Local app',
        serverUrl: 'https://example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
      },
    ],
    preferencesByConnectionId: {
      'connection-1': {
        lastBranch: 'main',
        lastSchemaHash,
        rememberedBranches: ['main'],
      },
    },
  }
}

describe('resolveStoredRuntimeTarget', () => {
  it('consumes a validated form target without repeating schema discovery', async () => {
    const target = {
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
    }
    handoffStoredRuntimeTarget(createStore().connections[0]!, target)

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore(),
      }),
    ).resolves.toEqual(target)
    expect(fetchSchemaHashes).not.toHaveBeenCalled()
    expect(fetchPermissionsHead).not.toHaveBeenCalled()
  })

  it('rejects a handed-off target after the saved credentials change', async () => {
    const originalStore = createStore()
    handoffStoredRuntimeTarget(originalStore.connections[0]!, {
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
    })
    const changedStore = {
      ...originalStore,
      connections: [{ ...originalStore.connections[0]!, serverUrl: 'https://changed.example.com' }],
    }
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1'],
      schemas: [{ hash: 'schema-1', publishedAt: 1 }],
    })

    await resolveStoredRuntimeTarget({ connectionId: 'connection-1', store: changedStore })

    expect(fetchSchemaHashes).toHaveBeenCalledWith('https://changed.example.com', {
      appId: 'app-1',
      adminSecret: 'secret',
    })
  })

  it('rejects a handed-off target for another connection profile', async () => {
    const originalStore = createStore()
    handoffStoredRuntimeTarget(originalStore.connections[0]!, {
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
    })
    const store = {
      ...originalStore,
      connections: [{ ...originalStore.connections[0]!, id: 'connection-2' }],
      preferencesByConnectionId: {
        'connection-2': originalStore.preferencesByConnectionId['connection-1']!,
      },
    }
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1'],
      schemas: [{ hash: 'schema-1', publishedAt: 1 }],
    })

    await expect(
      resolveStoredRuntimeTarget({ connectionId: 'connection-2', store }),
    ).resolves.toMatchObject({ connectionId: 'connection-2' })
  })

  it('opens the permissions-head schema instead of the first advertised schema', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })
    fetchPermissionsHead.mockResolvedValueOnce({
      json: async () => ({ head: { schemaHash: 'schema-2' } }),
      ok: true,
      status: 200,
      statusText: 'OK',
    })

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore(),
      }),
    ).resolves.toEqual({
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-2',
      schemaCatalogue: [
        { hash: 'schema-2', publishedAt: 2 },
        { hash: 'schema-1', publishedAt: 1 },
      ],
    })
    expect(fetchSchemaHashes).toHaveBeenCalledOnce()
    expect(fetchSchemaHashes).toHaveBeenCalledWith('https://example.com', {
      appId: 'app-1',
      adminSecret: 'secret',
    })
    expect(fetchPermissionsHead).toHaveBeenCalledWith(
      'https://example.com/apps/app-1/admin/permissions/head',
      { headers: { 'X-Jazz-Admin-Secret': 'secret' } },
    )
  })

  it('uses the advertised schema order when the permissions head is unavailable', async () => {
    const schemaCatalogue = [
      { hash: 'schema-1', publishedAt: 1 },
      { hash: 'schema-2', publishedAt: 2 },
    ]
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: schemaCatalogue,
    })
    fetchPermissionsHead.mockRejectedValueOnce(new Error('Permissions head unavailable'))

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore(),
      }),
    ).resolves.toHaveProperty('schemaCatalogue', schemaCatalogue)
  })

  it('honors an explicit available schema from a deep link', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        schemaHashOverride: 'schema-1',
        store: createStore(),
      }),
    ).resolves.toEqual({
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })
  })

  it('falls back when a direct link restores a stale schema preference', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-2', 'schema-3'],
      schemas: [
        { hash: 'schema-2', publishedAt: 2 },
        { hash: 'schema-3', publishedAt: 3 },
      ],
    })

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore('schema-1'),
      }),
    ).resolves.toEqual({
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-2',
      schemaCatalogue: [
        { hash: 'schema-2', publishedAt: 2 },
        { hash: 'schema-3', publishedAt: 3 },
      ],
    })
  })

  it('preserves discovery failures when a remembered schema cannot be verified', async () => {
    const error = new Error('Network unavailable')
    fetchSchemaHashes.mockRejectedValueOnce(error)

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore('schema-1'),
      }),
    ).rejects.toBe(error)
    expect(fetchSchemaHashes).toHaveBeenCalledOnce()
  })

  it('discovers schema hashes when no schema preference exists', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore(null),
      }),
    ).resolves.toEqual({
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })
  })

  it('preserves discovery failures when no schema preference exists', async () => {
    const error = new Error('Network unavailable')
    fetchSchemaHashes.mockRejectedValueOnce(error)

    await expect(
      resolveStoredRuntimeTarget({
        connectionId: 'connection-1',
        store: createStore(null),
      }),
    ).rejects.toBe(error)
  })
})

describe('buildSchemaCatalogue', () => {
  it('preserves advertised schema order regardless of publication metadata', () => {
    expect(
      buildSchemaCatalogue({
        hashes: ['schema-z', 'schema-b', 'schema-a', 'schema-y'],
        schemas: [
          { hash: 'schema-z', publishedAt: null },
          { hash: 'schema-b', publishedAt: 1 },
          { hash: 'schema-a', publishedAt: 1 },
          { hash: 'schema-y', publishedAt: null },
        ],
      }),
    ).toEqual([
      { hash: 'schema-z', publishedAt: null },
      { hash: 'schema-b', publishedAt: 1 },
      { hash: 'schema-a', publishedAt: 1 },
      { hash: 'schema-y', publishedAt: null },
    ])
  })

  it('retains hashes that do not include publication metadata', () => {
    expect(
      buildSchemaCatalogue({
        hashes: ['schema-z', 'schema-a'],
        schemas: [{ hash: 'schema-a', publishedAt: 1 }],
      }),
    ).toEqual([
      { hash: 'schema-z', publishedAt: null },
      { hash: 'schema-a', publishedAt: 1 },
    ])
  })
})
