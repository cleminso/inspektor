import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  createConnectionFromDraft,
  createEmptyConnectionStore,
  upsertConnection,
  writeStoredConnections,
} from '@app/connections/connections'
import { useStoredConnections } from '@app/session/useInspectorSession'

let entries: Map<string, string>
let writeError: Error | null
const tabsKey = 'inspektor-tabs:connection-1%3Amain%3Aschema-1'

function renderStoredSession(adminSecret = 'secret') {
  const connection = createConnectionFromDraft(
    {
      name: 'Local app',
      serverUrl: 'https://sync.example.com',
      appId: 'app-1',
      adminSecret,
      env: 'dev',
    },
    'connection-1',
  )
  writeStoredConnections(upsertConnection(createEmptyConnectionStore(), connection))
  window.localStorage.setItem(tabsKey, '{}')
  return { connection, ...renderHook(() => useStoredConnections()) }
}

beforeEach(() => {
  entries = new Map<string, string>()
  writeError = null
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return entries.size
      },
      clear: () => entries.clear(),
      getItem: (key: string) => entries.get(key) ?? null,
      key: (index: number) => [...entries.keys()][index] ?? null,
      removeItem: (key: string) => entries.delete(key),
      setItem: (key: string, value: string) => {
        if (writeError !== null) {
          throw writeError
        }
        entries.set(key, value)
      },
    } satisfies Storage,
  })
})

describe('useStoredConnections', () => {
  it('removes every Inspektor preference scoped to the deleted connection', () => {
    const connection = createConnectionFromDraft(
      {
        name: 'Local app',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
      },
      'connection-1',
    )
    writeStoredConnections(upsertConnection(createEmptyConnectionStore(), connection))
    window.localStorage.setItem('inspektor-tabs:connection-1%3Amain%3Aschema-1', '{}')
    window.localStorage.setItem('inspektor-table-pins:connection-1%3Amain%3Aschema-1', '{}')
    window.localStorage.setItem(
      'inspektor-table-preferences:connection-1%3Amain%3Aschema-1%3Aaccounts',
      '{}',
    )
    window.localStorage.setItem('inspektor-tabs:connection-2%3Amain%3Aschema-1', '{}')
    window.localStorage.setItem('unrelated', '{}')
    const { result } = renderHook(() => useStoredConnections())

    act(() => result.current.deleteConnection(connection.id))

    expect(window.localStorage.getItem('inspektor-tabs:connection-2%3Amain%3Aschema-1')).toBe('{}')
    expect(window.localStorage.getItem('unrelated')).toBe('{}')
    expect(window.localStorage.getItem('inspektor-tabs:connection-1%3Amain%3Aschema-1')).toBeNull()
    expect(
      window.localStorage.getItem('inspektor-table-pins:connection-1%3Amain%3Aschema-1'),
    ).toBeNull()
    expect(
      window.localStorage.getItem(
        'inspektor-table-preferences:connection-1%3Amain%3Aschema-1%3Aaccounts',
      ),
    ).toBeNull()
  })

  it('does not save a profile or its context when their persistence fails', () => {
    const { result } = renderHook(() => useStoredConnections())
    const draft = {
      name: 'First',
      serverUrl: 'https://sync.example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    writeError = new Error('Storage unavailable')

    expect(() =>
      act(() => {
        result.current.saveConnectionWithContext(draft, 'connection-1', 'feature', 'schema-1')
      }),
    ).toThrow('Storage unavailable')

    expect(result.current.connections).toEqual([])
    expect(result.current.activeConnectionId).toBeNull()
    expect(window.localStorage.getItem('inspektor-connections')).toBeNull()

    writeError = null
    act(() => {
      result.current.saveConnectionWithContext(
        { ...draft, name: 'Second' },
        'connection-1',
        'feature',
        'schema-1',
      )
    })
    expect(result.current.connections.map(({ name }) => name)).toEqual(['Second'])
    expect(result.current.activeConnectionId).toBe('connection-1')
  })

  it.each([
    ['appId', 'app-2'],
    ['env', 'prod'],
    ['serverUrl', 'https://other.example.com'],
  ] as const)('clears table preferences when connection %s changes', (field, value) => {
    const { connection, result } = renderStoredSession()

    act(() => {
      result.current.saveConnectionWithContext(
        { ...connection, [field]: value },
        connection.id,
        'main',
        'schema-1',
      )
    })

    expect(window.localStorage.getItem(tabsKey)).toBeNull()
  })

  it('preserves table preferences across a credential rotation for the same runtime', () => {
    const { connection, result } = renderStoredSession('secret-1')

    act(() => {
      result.current.saveConnectionWithContext(
        { ...connection, adminSecret: 'secret-2' },
        connection.id,
        'main',
        'schema-1',
      )
    })

    expect(window.localStorage.getItem(tabsKey)).toBe('{}')
  })
})
