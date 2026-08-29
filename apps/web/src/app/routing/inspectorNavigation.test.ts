import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createEmptyConnectionStore,
  type StoredConnectionsStore,
} from '@app/connections/connections'
import {
  createSchemaCatalogue,
  resolveStoredTablesNavigationTarget,
} from '@app/routing/inspectorNavigation'

const fetchSchemaHashes = vi.fn()

vi.mock('jazz-tools', () => ({ fetchSchemaHashes }))

afterEach(() => {
  fetchSchemaHashes.mockReset()
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

describe('resolveStoredTablesNavigationTarget', () => {
  it('opens the first advertised schema instead of the remembered schema', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: 'connection-1',
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
    expect(fetchSchemaHashes).toHaveBeenCalledOnce()
    expect(fetchSchemaHashes).toHaveBeenCalledWith('https://example.com', {
      appId: 'app-1',
      adminSecret: 'secret',
    })
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
      resolveStoredTablesNavigationTarget({
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
      resolveStoredTablesNavigationTarget({
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

  it('retains an unverified persisted target when direct-link validation is unavailable', async () => {
    fetchSchemaHashes.mockRejectedValueOnce(new Error('Network unavailable'))

    await expect(
      resolveStoredTablesNavigationTarget({
        connectionId: 'connection-1',
        store: createStore('schema-1'),
      }),
    ).resolves.toEqual({
      connectionId: 'connection-1',
      branch: 'main',
      schemaHash: 'schema-1',
      schemaCatalogue: [],
    })
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
      resolveStoredTablesNavigationTarget({
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
      resolveStoredTablesNavigationTarget({
        connectionId: 'connection-1',
        store: createStore(null),
      }),
    ).rejects.toBe(error)
  })
})

describe('createSchemaCatalogue', () => {
  it('preserves advertised schema order regardless of publication metadata', () => {
    expect(
      createSchemaCatalogue({
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
      createSchemaCatalogue({
        hashes: ['schema-z', 'schema-a'],
        schemas: [{ hash: 'schema-a', publishedAt: 1 }],
      }),
    ).toEqual([
      { hash: 'schema-z', publishedAt: null },
      { hash: 'schema-a', publishedAt: 1 },
    ])
  })
})
