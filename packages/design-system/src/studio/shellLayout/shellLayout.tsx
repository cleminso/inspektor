import * as stylex from '@stylexjs/stylex'
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type PropsWithChildren,
} from 'react'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizableDefaultLayout,
  type ResizableLayoutStorage,
  type ResizablePanelGroupProps,
  type ResizablePanelImperativeHandle,
  type ResizablePanelSize,
} from '../resizablePanel/resizablePanel'
import { shellLayoutStyles } from './shellLayout.styles'

export type ShellLayoutDockSide = 'left' | 'right'

export interface ShellLayoutStorage extends ResizableLayoutStorage {
  /** Returns the last non-collapsed percentage for a dock. */
  getExpandedDockSize: (side: ShellLayoutDockSide) => number | null
  /** Stores the last non-collapsed percentage for a dock. */
  setExpandedDockSize: (side: ShellLayoutDockSide, size: number) => void
}

export interface ShellLayoutPersistence {
  /** Uniquely identifies the persisted shell layout. */
  id: string
  /** Persists panel geometry and expanded dock sizes. */
  storage: ShellLayoutStorage
}

export interface ShellLayoutRootProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'className' | 'style'
> {
  /** Enables persistence through a consumer-owned storage adapter. */
  persistence?: ShellLayoutPersistence
}

export type ShellLayoutHeaderProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>
export type ShellLayoutFooterProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>

export type ShellLayoutBodyProps = PropsWithChildren
export type ShellLayoutLeftDockProps = PropsWithChildren
export type ShellLayoutRightDockProps = PropsWithChildren
export type ShellLayoutViewProps = PropsWithChildren

export interface ShellLayoutDockController {
  /** Whether the dock is expanded. */
  isOpen: boolean
  /** Collapses or restores the dock. */
  toggle: () => void
}

export interface ShellLayoutContextValue {
  leftDock: ShellLayoutDockController
  rightDock: ShellLayoutDockController
}

interface ShellLayoutInternalContextValue extends ShellLayoutContextValue {
  leftDockPanelRef: React.RefObject<ResizablePanelImperativeHandle | null>
  onLeftDockResize: (size: ResizablePanelSize) => void
  onRightDockResize: (size: ResizablePanelSize) => void
  persistenceId: string
  rightDockPanelRef: React.RefObject<ResizablePanelImperativeHandle | null>
  storage: ShellLayoutStorage
}

const unavailableShellLayoutStorage: ShellLayoutStorage = {
  getExpandedDockSize: () => null,
  getItem: () => null,
  setExpandedDockSize: () => undefined,
  setItem: () => undefined,
}

const ShellLayoutContext = createContext<ShellLayoutInternalContextValue | null>(null)

function useShellLayoutContext(): ShellLayoutInternalContextValue {
  const value = use(ShellLayoutContext)
  if (value === null) {
    throw new Error('ShellLayout components must be rendered within ShellLayout.Root')
  }
  return value
}

export function useShellLayout(): ShellLayoutContextValue {
  const { leftDock, rightDock } = useShellLayoutContext()
  return { leftDock, rightDock }
}

const ShellLayoutRoot = forwardRef<HTMLDivElement, ShellLayoutRootProps>(function ShellLayoutRoot(
  { persistence, ...props },
  ref,
) {
  const fallbackId = useId()
  const storage = persistence?.storage ?? unavailableShellLayoutStorage
  const persistenceId = persistence?.id ?? fallbackId
  const leftDockPanelRef = useRef<ResizablePanelImperativeHandle>(null)
  const rightDockPanelRef = useRef<ResizablePanelImperativeHandle>(null)
  const [expandedDockSizes] = useState(() => ({
    left: storage.getExpandedDockSize('left'),
    right: storage.getExpandedDockSize('right'),
  }))
  const [isLeftDockOpen, setIsLeftDockOpen] = useState(true)
  const [isRightDockOpen, setIsRightDockOpen] = useState(true)

  const updateDockFromSize = useCallback(
    (side: ShellLayoutDockSide, size: ResizablePanelSize) => {
      const isOpen = size.inPixels > 0
      if (isOpen === true) {
        expandedDockSizes[side] = size.asPercentage
      }
      if (side === 'left') {
        setIsLeftDockOpen(isOpen)
      } else {
        setIsRightDockOpen(isOpen)
      }
    },
    [expandedDockSizes],
  )
  const onLeftDockResize = useCallback(
    (size: ResizablePanelSize) => updateDockFromSize('left', size),
    [updateDockFromSize],
  )
  const onRightDockResize = useCallback(
    (size: ResizablePanelSize) => updateDockFromSize('right', size),
    [updateDockFromSize],
  )
  const toggleDock = useCallback(
    (side: ShellLayoutDockSide, isOpen: boolean) => {
      const panel = side === 'left' ? leftDockPanelRef.current : rightDockPanelRef.current
      if (panel === null) {
        return
      }
      if (isOpen === true) {
        panel.collapse()
      } else {
        const expandedSize = expandedDockSizes[side]
        if (expandedSize === null) {
          panel.expand()
        } else {
          panel.resize(`${expandedSize}%`)
        }
      }
      if (side === 'left') {
        setIsLeftDockOpen(isOpen === false)
      } else {
        setIsRightDockOpen(isOpen === false)
      }
    },
    [expandedDockSizes],
  )
  const toggleLeftDock = useCallback(
    () => toggleDock('left', isLeftDockOpen),
    [isLeftDockOpen, toggleDock],
  )
  const toggleRightDock = useCallback(
    () => toggleDock('right', isRightDockOpen),
    [isRightDockOpen, toggleDock],
  )

  const leftDock = useMemo(
    () => ({ isOpen: isLeftDockOpen, toggle: toggleLeftDock }),
    [isLeftDockOpen, toggleLeftDock],
  )
  const rightDock = useMemo(
    () => ({ isOpen: isRightDockOpen, toggle: toggleRightDock }),
    [isRightDockOpen, toggleRightDock],
  )
  const contextValue = useMemo(
    () => ({
      leftDock,
      leftDockPanelRef,
      onLeftDockResize,
      onRightDockResize,
      persistenceId,
      rightDock,
      rightDockPanelRef,
      storage,
    }),
    [leftDock, onLeftDockResize, onRightDockResize, persistenceId, rightDock, storage],
  )

  return (
    <ShellLayoutContext.Provider value={contextValue}>
      <div
        {...props}
        ref={ref}
        {...stylex.props(shellLayoutStyles.root)}
        data-slot="shell-layout"
      />
    </ShellLayoutContext.Provider>
  )
})

const ShellLayoutHeader = forwardRef<HTMLDivElement, ShellLayoutHeaderProps>(
  function ShellLayoutHeader(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(shellLayoutStyles.fixedRegion)}
        data-slot="shell-layout-header"
      />
    )
  },
)

function ShellLayoutBody({ children }: ShellLayoutBodyProps): React.ReactElement {
  const { persistenceId, storage } = useShellLayoutContext()
  const panelIds = Children.toArray(children).flatMap((child) => {
    if (isValidElement(child) === false) {
      return []
    }
    if (child.type === ShellLayoutLeftDock) {
      return ['leftDock']
    }
    if (child.type === ShellLayoutView) {
      return ['view']
    }
    return child.type === ShellLayoutRightDock ? ['rightDock'] : []
  })
  const { defaultLayout, onLayoutChanged } = useResizableDefaultLayout({
    id: persistenceId,
    panelIds,
    storage,
  })
  const handleLayoutChanged = useCallback<NonNullable<ResizablePanelGroupProps['onLayoutChanged']>>(
    (layout, meta) => {
      onLayoutChanged(layout, meta)
      for (const side of ['left', 'right'] as const) {
        const size = layout[`${side}Dock`]
        if (size !== undefined && size > 0) {
          storage.setExpandedDockSize(side, size)
        }
      }
    },
    [onLayoutChanged, storage],
  )
  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChanged={handleLayoutChanged}
      orientation="horizontal"
      data-slot="shell-layout-body"
    >
      {children}
    </ResizablePanelGroup>
  )
}

function ShellLayoutDock({
  side,
  children,
}: PropsWithChildren<{ side: ShellLayoutDockSide }>): React.ReactElement {
  const context = useShellLayoutContext()
  const isLeft = side === 'left'
  const dock = isLeft === true ? context.leftDock : context.rightDock
  const panelRef = isLeft === true ? context.leftDockPanelRef : context.rightDockPanelRef
  const onResize = isLeft === true ? context.onLeftDockResize : context.onRightDockResize
  const handle =
    dock.isOpen === true ? (
      <ResizableHandle
        id={`${side}DockHandle`}
        appearance="gutter"
      />
    ) : null
  return (
    <>
      {isLeft === false ? handle : null}
      <ResizablePanel
        id={`${side}Dock`}
        panelRef={panelRef}
        collapsible
        collapsedSize={0}
        minSize={160}
        maxSize={360}
        onResize={onResize}
      >
        <div
          {...stylex.props(
            shellLayoutStyles.surface,
            isLeft === true ? shellLayoutStyles.leftDock : shellLayoutStyles.rightDock,
          )}
          data-slot={`shell-layout-${side}-dock`}
        >
          {children}
        </div>
      </ResizablePanel>
      {isLeft === true ? handle : null}
    </>
  )
}

function ShellLayoutLeftDock(props: ShellLayoutLeftDockProps): React.ReactElement {
  return (
    <ShellLayoutDock
      {...props}
      side="left"
    />
  )
}

function ShellLayoutView({ children }: ShellLayoutViewProps): React.ReactElement {
  return (
    <ResizablePanel id="view">
      <div
        {...stylex.props(shellLayoutStyles.surface, shellLayoutStyles.view)}
        data-slot="shell-layout-view"
      >
        {children}
      </div>
    </ResizablePanel>
  )
}

function ShellLayoutRightDock(props: ShellLayoutRightDockProps): React.ReactElement {
  return (
    <ShellLayoutDock
      {...props}
      side="right"
    />
  )
}

const ShellLayoutFooter = forwardRef<HTMLDivElement, ShellLayoutFooterProps>(
  function ShellLayoutFooter(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(shellLayoutStyles.fixedRegion)}
        data-slot="shell-layout-footer"
      />
    )
  },
)

export const ShellLayout = Object.assign(ShellLayoutRoot, {
  Root: ShellLayoutRoot,
  Body: ShellLayoutBody,
  Footer: ShellLayoutFooter,
  Header: ShellLayoutHeader,
  LeftDock: ShellLayoutLeftDock,
  RightDock: ShellLayoutRightDock,
  View: ShellLayoutView,
})
