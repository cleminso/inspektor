import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  createConnectionFromDraft,
  createEmptyConnectionStore,
  upsertConnection,
  writeStoredConnections,
} from '@app/connections/connections'
import { useInspectorSession } from '@app/session/useInspectorSession'

let entries: Map<string, string>
let writeError: Error | null

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

describe('useInspectorSession', () => {
  it('removes every Inspector preference scoped to the deleted connection', () => {
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
    const { result } = renderHook(() => useInspectorSession())

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

  it('does not advance the session snapshot when persistence fails', () => {
    const { result } = renderHook(() => useInspectorSession())
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
        result.current.saveConnection(draft)
      }),
    ).toThrow('Storage unavailable')

    writeError = null
    act(() => {
      result.current.saveConnection({ ...draft, name: 'Second' })
    })

    expect(result.current.connections.map(({ name }) => name)).toEqual(['Second'])
  })
})
