import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createConnectionFromDraft,
  createEmptyConnectionStore,
  getConnectionDisplayName,
  getConnectionPreferences,
  readStoredConnections,
  removeConnection,
  setActiveConnectionContext,
  upsertConnection,
  writeStoredConnections,
  type RuntimeConnection,
} from '@app/connections/connections'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createConnectionFromDraft', () => {
  it('uses a readable default instead of repeating the app ID when the name is empty', () => {
    const connection = createConnectionFromDraft(
      {
        name: '',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
        credentialRetention: 'memory',
      },
      'connection-1',
    )

    expect(connection.name).toBe('my Jazz app')
  })

  it('preserves explicit names even when they resemble generated labels', () => {
    for (const name of ['app-1', 'app-1 @ sync.example.com']) {
      const connection = createConnectionFromDraft(
        {
          name,
          serverUrl: 'https://sync.example.com',
          appId: 'app-1',
          adminSecret: 'secret',
          env: 'dev',
          credentialRetention: 'memory',
        },
        'connection-1',
      )

      expect(getConnectionDisplayName(connection)).toBe(name)
    }
  })

  it('uses the readable fallback for a persisted empty name', () => {
    expect(
      getConnectionDisplayName({
        id: 'connection-1',
        name: '',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        env: 'dev',
        credentialRetention: 'memory',
      }),
    ).toBe('my Jazz app')
  })

  it('discards unsupported connection store versions and removes their payload', () => {
    const storedValue = JSON.stringify({
      version: 2,
      activeConnectionId: 'connection-1',
      connections: [],
    })
    const removeItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'inspektor-connections' ? storedValue : null),
      removeItem,
    })

    expect(readStoredConnections()).toEqual(createEmptyConnectionStore())
    expect(removeItem).toHaveBeenCalledWith('inspektor-connections')
  })

  it('restores a valid secret-free connection store', () => {
    const store = {
      version: 1 as const,
      activeConnectionId: 'connection-1',
      connections: [
        createConnectionFromDraft(
          {
            name: 'Local app',
            serverUrl: 'https://sync.example.com',
            appId: 'app-1',
            adminSecret: 'secret',
            env: 'dev',
            credentialRetention: 'session',
          },
          'connection-1',
        ),
      ],
      preferencesByConnectionId: {
        'connection-1': {
          lastBranch: 'main',
          lastSchemaHash: 'schema-1',
          rememberedBranches: ['main'],
        },
      },
    }
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'inspektor-connections' ? JSON.stringify(store) : null),
    })

    expect(readStoredConnections()).toEqual(store)
    expect(JSON.stringify(readStoredConnections())).not.toContain('secret')
  })

  it.each([
    ['malformed JSON', '{"adminSecret":"credential-marker"'],
    [
      'invalid connection value',
      JSON.stringify({
        version: 1,
        activeConnectionId: 'connection-1',
        connections: [
          {
            id: 'connection-1',
            name: 'Local app',
            serverUrl: 'https://sync.example.com',
            appId: 'app-1',
            adminSecret: 'credential-marker',
            env: null,
          },
        ],
        preferencesByConnectionId: {},
      }),
    ],
    [
      'credential hidden in otherwise valid preferences',
      JSON.stringify({
        version: 1,
        activeConnectionId: null,
        connections: [],
        preferencesByConnectionId: {
          'connection-1': {
            lastBranch: 'main',
            lastSchemaHash: null,
            rememberedBranches: ['main'],
            adminSecret: 'credential-marker',
          },
        },
      }),
    ],
    [
      'invalid preference value',
      JSON.stringify({
        version: 1,
        activeConnectionId: null,
        connections: [],
        preferencesByConnectionId: {
          'connection-1': {
            lastBranch: 'main',
            lastSchemaHash: null,
            rememberedBranches: ['main', { adminSecret: 'credential-marker' }],
          },
        },
      }),
    ],
  ])('returns the safe default for %s', (_case, storedValue) => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'inspektor-connections' ? storedValue : null),
    })

    expect(readStoredConnections()).toEqual(createEmptyConnectionStore())
    expect(JSON.stringify(readStoredConnections())).not.toContain('credential-marker')
  })
})

describe('writeStoredConnections', () => {
  it('projects profiles explicitly so an attached runtime secret cannot reach local storage', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    const runtimeConnection: RuntimeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://sync.example.com',
      appId: 'app-1',
      adminSecret: 'credential-marker',
      env: 'dev',
      credentialRetention: 'memory',
    }
    const preferencesWithSecret = {
      lastBranch: 'main',
      lastSchemaHash: null,
      rememberedBranches: ['main'],
      adminSecret: 'preference-credential-marker',
    }

    writeStoredConnections({
      ...createEmptyConnectionStore(),
      connections: [runtimeConnection],
      preferencesByConnectionId: { 'connection-1': preferencesWithSecret },
    })

    expect(setItem).toHaveBeenCalledOnce()
    expect(setItem.mock.calls[0]?.[1]).not.toContain('credential-marker')
    expect(setItem.mock.calls[0]?.[1]).not.toContain('preference-credential-marker')
  })
})

describe('setActiveConnectionContext', () => {
  it('selects the connection and remembers its runtime context atomically', () => {
    const connection = createConnectionFromDraft(
      {
        name: 'Local app',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
        credentialRetention: 'memory',
      },
      'connection-1',
    )
    const store = upsertConnection(createEmptyConnectionStore(), connection)

    const nextStore = setActiveConnectionContext(store, 'connection-1', 'feature', 'schema-2')

    expect(nextStore.activeConnectionId).toBe('connection-1')
    expect(getConnectionPreferences(nextStore, 'connection-1')).toEqual({
      lastBranch: 'feature',
      lastSchemaHash: 'schema-2',
      rememberedBranches: ['feature', 'main'],
    })
  })
})

describe('removeConnection', () => {
  it('removes the profile and its local preferences', () => {
    const connection = createConnectionFromDraft(
      {
        name: 'Local app',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
        credentialRetention: 'memory',
      },
      'connection-1',
    )
    const store = setActiveConnectionContext(
      upsertConnection(createEmptyConnectionStore(), connection),
      connection.id,
      'feature',
      'schema-1',
    )

    const nextStore = removeConnection(store, connection.id)

    expect(nextStore.connections).toEqual([])
    expect(nextStore.preferencesByConnectionId).toEqual({})
    expect(nextStore.activeConnectionId).toBeNull()
  })

  it('preserves the active profile and unrelated preferences when removing an inactive profile', () => {
    const first = createConnectionFromDraft(
      {
        name: 'First',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret-1',
        env: 'dev',
        credentialRetention: 'memory',
      },
      'connection-1',
    )
    const second = createConnectionFromDraft(
      {
        name: 'Second',
        serverUrl: 'https://sync.example.com',
        appId: 'app-2',
        adminSecret: 'secret-2',
        env: 'dev',
        credentialRetention: 'memory',
      },
      'connection-2',
    )
    const store = setActiveConnectionContext(
      upsertConnection(upsertConnection(createEmptyConnectionStore(), second), first),
      first.id,
      'feature',
      'schema-1',
    )

    const nextStore = removeConnection(store, second.id)

    expect(nextStore.connections).toEqual([first])
    expect(nextStore.activeConnectionId).toBe(first.id)
    expect(nextStore.preferencesByConnectionId).toEqual({
      [first.id]: {
        lastBranch: 'feature',
        lastSchemaHash: 'schema-1',
        rememberedBranches: ['feature', 'main'],
      },
    })
  })
})
