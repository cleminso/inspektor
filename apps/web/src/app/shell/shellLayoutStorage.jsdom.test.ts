import { beforeEach, describe, expect, it } from 'vitest'

import { createInspectorShellLayoutPersistence } from './shellLayoutStorage'

const values = new Map<string, string>()

beforeEach(() => {
  values.clear()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
})

describe('createInspectorShellLayoutPersistence', () => {
  it('uses ShellLayout.Root fallback when local storage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Unavailable')
      },
    })
    expect(createInspectorShellLayoutPersistence()).toBeUndefined()
  })

  it('writes the table-specific layout and expanded size through to semantic keys', () => {
    window.localStorage.setItem(
      'react-resizable-panels:tables-side-panel',
      JSON.stringify({ content: 65, navigation: 35 }),
    )
    window.localStorage.setItem('inspector:tables-side-panel:navigation-expanded-size', '35')
    const { id, storage } = createInspectorShellLayoutPersistence()!

    expect(id).toBe('inspector-shell')
    expect(storage.getItem('react-resizable-panels:inspector-shell:leftDock:view')).toBe(
      JSON.stringify({ leftDock: 35, view: 65 }),
    )
    expect(storage.getExpandedDockSize('left')).toBe(35)
    expect(
      window.localStorage.getItem('react-resizable-panels:inspector-shell:leftDock:view'),
    ).toBe(JSON.stringify({ leftDock: 35, view: 65 }))
    expect(window.localStorage.getItem('inspector:shell-layout:left-dock-expanded-size')).toBe('35')
  })

  it.each([
    ['malformed JSON', 'not-json'],
    ['a non-object', '100'],
    ['an array', JSON.stringify([35, 65])],
    ['a missing view', JSON.stringify({ leftDock: 100 })],
    ['a nonnumeric size', JSON.stringify({ leftDock: '35', view: 65 })],
    ['a non-finite size', '{"leftDock":1e400,"view":65}'],
    ['zero total size', JSON.stringify({ leftDock: 0, view: 0 })],
    ['a negative size', JSON.stringify({ leftDock: -10, view: 110 })],
    ['an unknown panel', JSON.stringify({ extra: 35, leftDock: 65 })],
  ])('ignores %s', (_case, value) => {
    const storageKey = 'react-resizable-panels:inspector-shell:leftDock:view'
    window.localStorage.setItem(storageKey, value)
    const { storage } = createInspectorShellLayoutPersistence()!

    expect(storage.getItem(storageKey)).toBeNull()
  })

  it.each([
    {
      layout: { view: 100 },
      name: 'view-only layout',
      storageKey: 'react-resizable-panels:inspector-shell:view',
    },
    {
      layout: { leftDock: 20, view: 60, rightDock: 20 },
      name: 'layout with both docks',
      storageKey: 'react-resizable-panels:inspector-shell:leftDock:view:rightDock',
    },
  ])('accepts a persisted $name', ({ layout, storageKey }) => {
    const value = JSON.stringify(layout)
    window.localStorage.setItem(storageKey, value)
    const { storage } = createInspectorShellLayoutPersistence()!

    expect(storage.getItem(storageKey)).toBe(value)
  })

  it('does not restore a layout for a different panel composition', () => {
    const value = JSON.stringify({ leftDock: 35, view: 65 })
    const storageKey = 'react-resizable-panels:inspector-shell:leftDock:view:rightDock'
    window.localStorage.setItem(storageKey, value)
    const { storage } = createInspectorShellLayoutPersistence()!

    expect(storage.getItem(storageKey)).toBeNull()
  })

  it('does not apply the legacy fallback to another composition', () => {
    window.localStorage.setItem(
      'react-resizable-panels:tables-side-panel',
      JSON.stringify({ content: 65, navigation: 35 }),
    )
    const { storage } = createInspectorShellLayoutPersistence()!

    expect(
      storage.getItem('react-resizable-panels:inspector-shell:leftDock:view:rightDock'),
    ).toBeNull()
  })

  it('returns migrated values when write-through storage fails', () => {
    values.set(
      'react-resizable-panels:tables-side-panel',
      JSON.stringify({ content: 65, navigation: 35 }),
    )
    values.set('inspector:tables-side-panel:navigation-expanded-size', '35')
    window.localStorage.setItem = () => {
      throw new Error('Quota exceeded')
    }
    const { storage } = createInspectorShellLayoutPersistence()!

    expect(storage.getItem('react-resizable-panels:inspector-shell:leftDock:view')).toBe(
      JSON.stringify({ leftDock: 35, view: 65 }),
    )
    expect(storage.getExpandedDockSize('left')).toBe(35)
  })
})
