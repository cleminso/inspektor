import { beforeEach, describe, expect, it } from 'vitest'

import { createDesignSystemShellLayoutPersistence } from './appShellStorage'

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

describe('createDesignSystemShellLayoutPersistence', () => {
  it('persists the two-dock layout and each expanded dock size', () => {
    const layoutKey = 'react-resizable-panels:inspektor-design-system-shell:leftDock:view:rightDock'
    const layout = JSON.stringify({ leftDock: 20, view: 60, rightDock: 20 })
    window.localStorage.setItem(layoutKey, layout)
    window.localStorage.setItem('inspektor-design-system:shell-layout:left-expanded-size', '20')
    window.localStorage.setItem('inspektor-design-system:shell-layout:right-expanded-size', '25')

    const { id, storage } = createDesignSystemShellLayoutPersistence()!

    expect(id).toBe('inspektor-design-system-shell')
    expect(storage.getItem(layoutKey)).toBe(layout)
    expect(storage.getExpandedDockSize('left')).toBe(20)
    expect(storage.getExpandedDockSize('right')).toBe(25)

    storage.setItem(layoutKey, JSON.stringify({ leftDock: 0, view: 75, rightDock: 25 }))
    storage.setExpandedDockSize('left', 30)

    expect(window.localStorage.getItem(layoutKey)).toBe(
      JSON.stringify({ leftDock: 0, view: 75, rightDock: 25 }),
    )
    expect(
      window.localStorage.getItem('inspektor-design-system:shell-layout:left-expanded-size'),
    ).toBe('30')
  })

  it('ignores malformed layouts and expanded sizes', () => {
    const layoutKey = 'react-resizable-panels:inspektor-design-system-shell:leftDock:view:rightDock'
    window.localStorage.setItem(layoutKey, JSON.stringify({ leftDock: 20, view: 80 }))
    window.localStorage.setItem('inspektor-design-system:shell-layout:left-expanded-size', '0')
    const { storage } = createDesignSystemShellLayoutPersistence()!

    expect(storage.getItem(layoutKey)).toBeNull()
    expect(storage.getExpandedDockSize('left')).toBeNull()
  })
})
