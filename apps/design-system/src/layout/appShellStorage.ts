import type { ShellLayoutDockSide, ShellLayoutPersistence, ShellLayoutStorage } from '@inspektor/ds'

const shellLayoutId = 'inspektor-design-system-shell'
const layoutStorageKey = `react-resizable-panels:${shellLayoutId}:leftDock:view:rightDock`
const expandedDockSizeStorageKeys = {
  left: 'inspektor-design-system:shell-layout:left-expanded-size',
  right: 'inspektor-design-system:shell-layout:right-expanded-size',
} satisfies Record<ShellLayoutDockSide, string>

function isValidLayout(value: string): boolean {
  try {
    const layout: unknown = JSON.parse(value)
    if (typeof layout !== 'object' || layout === null || Array.isArray(layout) === true) {
      return false
    }
    const values = layout as Record<string, unknown>
    const sizes = ['leftDock', 'view', 'rightDock'].map((id) => values[id])
    return (
      Object.keys(values).length === sizes.length &&
      sizes.every(
        (size) => typeof size === 'number' && Number.isFinite(size) === true && size >= 0,
      ) &&
      (sizes as number[]).reduce((total, size) => total + size, 0) > 0
    )
  } catch {
    return false
  }
}

function getExpandedDockSize(storage: Storage, side: ShellLayoutDockSide): number | null {
  try {
    const size = Number(storage.getItem(expandedDockSizeStorageKeys[side]))
    return Number.isFinite(size) === true && size > 0 && size <= 100 ? size : null
  } catch {
    return null
  }
}

function setItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // Storage failure must not break dock controls.
  }
}

export function createDesignSystemShellLayoutPersistence(): ShellLayoutPersistence | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  let storage: Storage
  try {
    storage = window.localStorage
  } catch {
    return undefined
  }

  const shellStorage: ShellLayoutStorage = {
    getExpandedDockSize: (side) => getExpandedDockSize(storage, side),
    getItem: (key) => {
      if (key !== layoutStorageKey) {
        return null
      }
      try {
        const value = storage.getItem(key)
        return value !== null && isValidLayout(value) === true ? value : null
      } catch {
        return null
      }
    },
    setExpandedDockSize: (side, size) => {
      setItem(storage, expandedDockSizeStorageKeys[side], String(size))
    },
    setItem: (key, value) => {
      if (key === layoutStorageKey) {
        setItem(storage, key, value)
      }
    },
  }

  return { id: shellLayoutId, storage: shellStorage }
}
