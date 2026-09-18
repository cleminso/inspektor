import { beforeEach, describe, expect, it } from 'vitest'

import { loadPinnedTableNames, savePinnedTableNames, updatePinnedTableNames } from './pins'

describe('table pins', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        get length() {
          return values.size
        },
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    })
  })

  it('persists pinned table names independently for each inspektor scope', () => {
    savePinnedTableNames('connection:main:schema-a', new Set(['accounts', 'users']))
    savePinnedTableNames('connection:branch:schema-b', new Set(['sessions']))

    expect([...loadPinnedTableNames('connection:main:schema-a')]).toEqual(['accounts', 'users'])
    expect([...loadPinnedTableNames('connection:branch:schema-b')]).toEqual(['sessions'])
    expect(window.localStorage.getItem('inspektor-table-pins')).toBeNull()
  })

  it('ignores invalid persisted pin data', () => {
    window.localStorage.setItem(
      'inspektor-table-pins:inspektor',
      JSON.stringify({ version: 1, tableNames: ['accounts', 42] }),
    )

    expect([...loadPinnedTableNames('inspektor')]).toEqual([])
  })

  it('discards unsupported pin versions', () => {
    window.localStorage.setItem(
      'inspektor-table-pins:inspektor',
      JSON.stringify({ version: 2, tableNames: ['accounts'] }),
    )

    expect([...loadPinnedTableNames('inspektor')]).toEqual([])
  })

  it('keeps in-memory pinning usable when persistence fails', () => {
    Object.defineProperty(window.localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })

    expect(() => savePinnedTableNames('inspektor', new Set(['accounts']))).not.toThrow()
  })

  it('creates an immutable pin selection for a user action', () => {
    const currentTableNames = new Set(['accounts'])

    const pinnedTableNames = updatePinnedTableNames(currentTableNames, ['users'], true)
    const unpinnedTableNames = updatePinnedTableNames(pinnedTableNames, ['accounts'], false)

    expect([...currentTableNames]).toEqual(['accounts'])
    expect([...pinnedTableNames]).toEqual(['accounts', 'users'])
    expect([...unpinnedTableNames]).toEqual(['users'])
  })
})
