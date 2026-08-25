import { beforeEach, describe, expect, it } from 'vitest'

import {
  getConnectionScopedStorageKey,
  getConnectionScopedStorageKeyCandidates,
  getConnectionScopedStorageValue,
  removeConnectionScopedStorage,
} from '@app/storage/connectionScopedStorage'
import { createTableScope, createTableWorkspaceScope } from '@tables/workspace/scope'

beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      get length() {
        return values.size
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
})

describe('connection-scoped storage', () => {
  it('removes collision-safe workspace and table keys for one connection', () => {
    const workspaceScope = createTableWorkspaceScope({
      branch: 'main:preview',
      connectionId: 'connection:1',
      schemaHash: 'schema:1',
    })
    const otherScope = createTableWorkspaceScope({
      branch: 'main',
      connectionId: 'connection:2',
      schemaHash: 'schema:2',
    })
    const tabsKey = getConnectionScopedStorageKey('tabs', workspaceScope)
    const preferencesKey = getConnectionScopedStorageKey(
      'tablePreferences',
      createTableScope(workspaceScope, 'accounts:active'),
    )
    const otherKey = getConnectionScopedStorageKey('tabs', otherScope)
    const legacyKey = getConnectionScopedStorageKey('tabs', 'connection:1:main:preview:schema:1')
    window.localStorage.setItem(tabsKey, 'tabs')
    window.localStorage.setItem(preferencesKey, 'preferences')
    window.localStorage.setItem(legacyKey, 'legacy')
    window.localStorage.setItem(otherKey, 'other')

    removeConnectionScopedStorage('connection:1')

    expect(window.localStorage.getItem(tabsKey)).toBeNull()
    expect(window.localStorage.getItem(preferencesKey)).toBeNull()
    expect(window.localStorage.getItem(legacyKey)).toBeNull()
    expect(window.localStorage.getItem(otherKey)).toBe('other')
  })

  it('keeps legacy storage discoverable while reserved scope delimiters become safe', () => {
    const compatibleScope = createTableWorkspaceScope({
      branch: 'main/preview',
      connectionId: 'connection-1',
      schemaHash: 'schema-1',
    })
    const encodedScope = createTableWorkspaceScope({
      branch: 'main:preview',
      connectionId: 'connection:1',
      schemaHash: 'schema:1',
    })

    expect(compatibleScope).toBe('connection-1:main/preview:schema-1')
    expect(getConnectionScopedStorageKeyCandidates('tabs', compatibleScope)).toHaveLength(1)
    expect(getConnectionScopedStorageKeyCandidates('tabs', encodedScope)).toEqual([
      getConnectionScopedStorageKey('tabs', encodedScope),
      getConnectionScopedStorageKey('tabs', 'connection:1:main:preview:schema:1'),
    ])
    window.localStorage.setItem(
      getConnectionScopedStorageKey('tabs', 'connection:1:main:preview:schema:1'),
      'legacy',
    )
    expect(getConnectionScopedStorageValue('tabs', encodedScope)).toBe('legacy')
  })
})
