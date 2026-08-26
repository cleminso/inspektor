import {
  Box,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizableDefaultLayout,
  useResizablePanelRef,
  type ResizableLayoutStorage,
  type ResizablePanelSize,
} from '@inspector/ds'
import { createContext, use, useCallback, useMemo, useRef, useState } from 'react'

interface SidePanelLayoutContextValue {
  defaultLayout: ReturnType<typeof useResizableDefaultLayout>['defaultLayout']
  isOpen: boolean
  onLayoutChanged: ReturnType<typeof useResizableDefaultLayout>['onLayoutChanged']
  panelRef: ReturnType<typeof useResizablePanelRef>
  setIsOpenFromSize: (size: ResizablePanelSize) => void
  toggle: () => void
}

const SidePanelLayoutContext = createContext<SidePanelLayoutContextValue | null>(null)

const expandedNavigationSizeStorageKey = 'inspector:tables-side-panel:navigation-expanded-size'

interface TableLayoutStorage extends ResizableLayoutStorage {
  getExpandedNavigationSize: () => number | null
  setExpandedNavigationSize: (size: number) => void
}

const unavailableLayoutStorage: TableLayoutStorage = {
  getExpandedNavigationSize: () => null,
  getItem: () => null,
  setExpandedNavigationSize: () => undefined,
  setItem: () => undefined,
}

/**
 * Adapts browser storage to the resizable-panel persistence contract.
 *
 * Layout persistence is best-effort: unavailable storage, invalid data, and read or write failures
 * behave like an empty store so a saved preference can never prevent the table workspace rendering.
 */
function createTableLayoutStorage(): TableLayoutStorage {
  if (typeof window === 'undefined') {
    return unavailableLayoutStorage
  }

  let storage: Storage
  try {
    storage = window.localStorage
  } catch {
    return unavailableLayoutStorage
  }

  return {
    getExpandedNavigationSize: () => {
      try {
        const value = storage.getItem(expandedNavigationSizeStorageKey)
        if (value === null) {
          return null
        }
        const size = Number(value)
        return Number.isFinite(size) === true && size > 0 && size <= 100 ? size : null
      } catch {
        return null
      }
    },
    getItem: (key) => {
      try {
        const value = storage.getItem(key)
        if (value === null) {
          return null
        }
        const layout = JSON.parse(value) as Record<string, unknown>
        const contentSize = layout.content
        const navigationSize = layout.navigation
        return Object.keys(layout).length === 2 &&
          typeof contentSize === 'number' &&
          typeof navigationSize === 'number' &&
          Number.isFinite(contentSize) === true &&
          Number.isFinite(navigationSize) === true &&
          contentSize >= 0 &&
          navigationSize >= 0 &&
          Number.isFinite(contentSize + navigationSize) === true &&
          contentSize + navigationSize > 0
          ? value
          : null
      } catch {
        return null
      }
    },
    setExpandedNavigationSize: (size) => {
      try {
        storage.setItem(expandedNavigationSizeStorageKey, String(size))
      } catch {
        // Private browsing and storage quotas must not break table navigation.
      }
    },
    setItem: (key, value) => {
      try {
        storage.setItem(key, value)
      } catch {
        // Private browsing and storage quotas must not break table navigation.
      }
    },
  }
}

export function useSidePanelLayout(): SidePanelLayoutContextValue {
  const value = use(SidePanelLayoutContext)

  if (value === null) {
    throw new Error('SidePanelLayout components must be rendered within SidePanelLayoutProvider')
  }

  return value
}

interface SidePanelLayoutProviderProps {
  children: React.ReactNode
}

interface SidePanelLayoutRootProps {
  children: React.ReactNode
}

export function SidePanelLayoutProvider({
  children,
}: SidePanelLayoutProviderProps): React.ReactElement {
  const panelRef = useResizablePanelRef()
  const layoutStorage = useMemo(() => createTableLayoutStorage(), [])
  // The group id and panel ids form the persisted layout schema; renaming them requires migration.
  const { defaultLayout, onLayoutChanged } = useResizableDefaultLayout({
    id: 'tables-side-panel',
    storage: layoutStorage,
  })
  // The panel library remembers pre-collapse size only in memory, so retain it across remounts.
  const expandedNavigationSizeRef = useRef(layoutStorage.getExpandedNavigationSize())
  // Restore the semantic state with the panel geometry to avoid showing a handle for a collapsed dock.
  const [isOpen, setIsOpen] = useState(() => defaultLayout?.navigation !== 0)

  const setIsOpenFromSize = useCallback(
    (size: ResizablePanelSize) => {
      const nextIsOpen = size.inPixels > 0
      if (nextIsOpen === true) {
        expandedNavigationSizeRef.current = size.asPercentage
        layoutStorage.setExpandedNavigationSize(size.asPercentage)
      }
      setIsOpen(nextIsOpen)
    },
    [layoutStorage],
  )

  const toggle = useCallback(() => {
    const panel = panelRef.current
    if (panel === null) {
      return
    }

    if (isOpen === true) {
      panel.collapse()
      setIsOpen(false)
    } else {
      const expandedNavigationSize = expandedNavigationSizeRef.current
      if (expandedNavigationSize === null) {
        panel.expand()
      } else {
        panel.resize(`${expandedNavigationSize}%`)
      }
      setIsOpen(true)
    }
  }, [isOpen, panelRef])

  const contextValue = useMemo(
    () => ({ defaultLayout, isOpen, onLayoutChanged, panelRef, setIsOpenFromSize, toggle }),
    [defaultLayout, isOpen, onLayoutChanged, panelRef, setIsOpenFromSize, toggle],
  )
  return (
    <SidePanelLayoutContext.Provider value={contextValue}>
      {children}
    </SidePanelLayoutContext.Provider>
  )
}

function SidePanelLayoutRoot({ children }: SidePanelLayoutRootProps): React.ReactElement {
  const { defaultLayout, onLayoutChanged } = useSidePanelLayout()

  return (
    <Box
      width="full"
      height="full"
      minHeight={0}
      flex={1}
      overflow="hidden"
    >
      <ResizablePanelGroup
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        orientation="horizontal"
      >
        {children}
      </ResizablePanelGroup>
    </Box>
  )
}

interface SidePanelLayoutPartProps {
  children: React.ReactNode
}

function SidePanelLayoutPanel({ children }: SidePanelLayoutPartProps): React.ReactElement {
  const { isOpen, panelRef, setIsOpenFromSize } = useSidePanelLayout()

  return (
    <>
      <ResizablePanel
        id="navigation"
        panelRef={panelRef}
        collapsible
        collapsedSize={0}
        minSize={160}
        maxSize={360}
        onResize={setIsOpenFromSize}
      >
        <Box
          width="full"
          height="full"
          minHeight={0}
          overflow="hidden"
          backgroundColor="surface-background"
          borderBottomRightRadius="xs"
          borderTopRightRadius="xs"
        >
          {children}
        </Box>
      </ResizablePanel>
      {isOpen === true ? <ResizableHandle appearance="gutter" /> : null}
    </>
  )
}

function SidePanelLayoutContent({ children }: SidePanelLayoutPartProps): React.ReactElement {
  return (
    <ResizablePanel id="content">
      <Box
        width="full"
        height="full"
        minHeight={0}
        overflow="hidden"
        backgroundColor="surface-background"
        borderBottomLeftRadius="xs"
        borderTopLeftRadius="xs"
      >
        {children}
      </Box>
    </ResizablePanel>
  )
}

export const SidePanelLayout = Object.assign(SidePanelLayoutRoot, {
  Content: SidePanelLayoutContent,
  Panel: SidePanelLayoutPanel,
})
