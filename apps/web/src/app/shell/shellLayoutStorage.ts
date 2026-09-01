import type {
  ResizableLayout,
  ShellLayoutDockSide,
  ShellLayoutPersistence,
  ShellLayoutStorage,
} from '@inspector/ds'

const shellLayoutId = 'inspector-shell'
const shellLayoutStorageKey = `react-resizable-panels:${shellLayoutId}`
const shellLayoutStorageKeyPrefix = `${shellLayoutStorageKey}:`
const legacyCompositionStorageKey = `${shellLayoutStorageKeyPrefix}leftDock:view`
const legacyLayoutStorageKey = 'react-resizable-panels:tables-side-panel'
const expandedDockSizeStorageKeys = {
  left: 'inspector:shell-layout:left-dock-expanded-size',
  right: 'inspector:shell-layout:right-dock-expanded-size',
} satisfies Record<ShellLayoutDockSide, string>
const legacyExpandedLeftDockSizeStorageKey = 'inspector:tables-side-panel:navigation-expanded-size'

function parseNumericLayout<const Id extends string>(
  value: string,
  expectedIds: readonly Id[],
): Record<Id, number> | null {
  try {
    const layout: unknown = JSON.parse(value)
    if (typeof layout !== 'object' || layout === null || Array.isArray(layout) === true) {
      return null
    }
    const values = layout as Record<string, unknown>
    const sizes = expectedIds.map((id) => values[id])
    if (
      Object.keys(values).length !== expectedIds.length ||
      sizes.every(
        (size) => typeof size === 'number' && Number.isFinite(size) === true && size >= 0,
      ) === false
    ) {
      return null
    }
    const total = (sizes as number[]).reduce((sum, size) => sum + size, 0)
    return Number.isFinite(total) === true && total > 0 ? (values as Record<Id, number>) : null
  } catch {
    return null
  }
}

function getPanelIdsFromStorageKey(key: string): string[] | null {
  if (key.startsWith(shellLayoutStorageKeyPrefix) === false) {
    return null
  }
  const panelIds = key.slice(shellLayoutStorageKeyPrefix.length).split(':')
  const composition = panelIds.join(':')
  return composition === 'view' ||
    composition === 'leftDock:view' ||
    composition === 'view:rightDock' ||
    composition === 'leftDock:view:rightDock'
    ? panelIds
    : null
}

function migrateLegacyLayout(value: string): ResizableLayout | null {
  const layout = parseNumericLayout(value, ['navigation', 'content'])
  return layout === null ? null : { leftDock: layout.navigation, view: layout.content }
}

function parseExpandedDockSize(value: string | null): number | null {
  if (value === null) {
    return null
  }
  const size = Number(value)
  return Number.isFinite(size) === true && size > 0 && size <= 100 ? size : null
}

function setItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // Private browsing and storage quotas must not break shell navigation.
  }
}

/** Adapts browser storage to the universal Inspector shell preference. */
export function createInspectorShellLayoutPersistence(): ShellLayoutPersistence | undefined {
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
    getExpandedDockSize: (side) => {
      try {
        const savedSize = parseExpandedDockSize(storage.getItem(expandedDockSizeStorageKeys[side]))
        if (savedSize !== null || side === 'right') {
          return savedSize
        }
        const legacyValue = storage.getItem(legacyExpandedLeftDockSizeStorageKey)
        const legacySize = parseExpandedDockSize(legacyValue)
        if (legacySize !== null) {
          setItem(storage, expandedDockSizeStorageKeys.left, String(legacySize))
        }
        return legacySize
      } catch {
        return null
      }
    },
    getItem: (key) => {
      try {
        const panelIds = getPanelIdsFromStorageKey(key)
        if (panelIds === null) {
          return null
        }
        const value = storage.getItem(key)
        if (value !== null) {
          return parseNumericLayout(value, panelIds) === null ? null : value
        }
        if (key !== legacyCompositionStorageKey) {
          return null
        }
        const legacyValue = storage.getItem(legacyLayoutStorageKey)
        const migratedLayout = legacyValue === null ? null : migrateLegacyLayout(legacyValue)
        if (migratedLayout === null) {
          return null
        }
        const migratedValue = JSON.stringify(migratedLayout)
        setItem(storage, key, migratedValue)
        return migratedValue
      } catch {
        return null
      }
    },
    setExpandedDockSize: (side, size) => {
      setItem(storage, expandedDockSizeStorageKeys[side], String(size))
    },
    setItem: (key, value) => {
      setItem(storage, key, value)
    },
  }

  return { id: shellLayoutId, storage: shellStorage }
}
