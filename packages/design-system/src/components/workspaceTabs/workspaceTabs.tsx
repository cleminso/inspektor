import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { Button } from '../button/button'
import { ContextMenu } from '../contextMenu/contextMenu'
import { CloseGlyph } from '../icon/iconArtwork'
import { Tooltip } from '../tooltip/tooltip'
import { workspaceTabsStyles } from './workspaceTabs.styles'
import {
  getReorderedWorkspaceTabsValues,
  WorkspaceTabsReorderContext,
  type WorkspaceTabsValue,
} from './workspaceTabsReorderContext'

export type { WorkspaceTabsValue } from './workspaceTabsReorderContext'

type WorkspaceTabsStructuralProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'style'>

interface WorkspaceTabsContextValue {
  value: WorkspaceTabsValue | null
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue>({ value: null })
const WorkspaceTabsActivateOnFocusContext = createContext(false)

interface WorkspaceTabsReorderActionsContextValue {
  values: readonly WorkspaceTabsValue[]
  onReorder: (values: WorkspaceTabsValue[]) => void
}

const WorkspaceTabsReorderActionsContext = createContext<WorkspaceTabsReorderActionsContextValue | null>(null)

/**
 * Why: importing DND from this static module pulled the shared sortable chunk into the initial
 * application load. A later sibling-runtime approach avoided that download but matched tab values
 * to discovered DOM elements by position, which made tabs jump and reorder unpredictably.
 *
 * How: the DND implementation loads after mount and wraps the list. Its context supplies a
 * sortable component that attaches `useSortable` directly to each owning WorkspaceTabs.Tab ref.
 *
 * What: the first render stays static, then the list remounts once with reorder behavior. The
 * focused tab is recorded by its typed value key and restored after that remount.
 */
type WorkspaceTabsReorderModule = typeof import('./workspaceTabsReorder')

let workspaceTabsReorderModule: Promise<WorkspaceTabsReorderModule> | undefined

function loadWorkspaceTabsReorder(): Promise<WorkspaceTabsReorderModule> {
  workspaceTabsReorderModule ??= import('./workspaceTabsReorder').catch((error: unknown) => {
    workspaceTabsReorderModule = undefined
    throw error
  })
  return workspaceTabsReorderModule
}

function getWorkspaceTabsValueKey(value: WorkspaceTabsValue): string {
  return `${typeof value}:${String(value)}`
}

export interface WorkspaceTabsRootProps {
  /** The tab views and their associated panels. */
  children?: ReactNode
  /** The active view value when controlled. */
  value?: WorkspaceTabsValue | null
  /** The initially active view value when uncontrolled. */
  defaultValue?: WorkspaceTabsValue | null
  /** Called when the active view changes. */
  onValueChange?: (
    value: WorkspaceTabsValue | null,
    eventDetails: BaseTabs.Root.ChangeEventDetails,
  ) => void
}

interface WorkspaceTabsListBaseProps {
  /** The tab view items. */
  children?: ReactNode
  /** An accessible name for the tab list. */
  'aria-label'?: string
  /** Identifies the element that labels the tab list. */
  'aria-labelledby'?: string
  /** Activates a view as arrow-key navigation moves focus. */
  activateOnFocus?: boolean
  /** Loops keyboard focus between the first and last views. */
  loopFocus?: boolean
}

interface ReorderableWorkspaceTabsListProps {
  /** The tab values in their controlled visual order. */
  values: readonly WorkspaceTabsValue[]
  /** Called with the complete ordered value list after a tab is dragged. */
  onReorder: (values: WorkspaceTabsValue[]) => void
}

interface StaticWorkspaceTabsListProps {
  values?: never
  onReorder?: never
}

export type WorkspaceTabsListProps = WorkspaceTabsListBaseProps &
  (ReorderableWorkspaceTabsListProps | StaticWorkspaceTabsListProps)

export interface WorkspaceTabsBarProps extends WorkspaceTabsStructuralProps {
  /** The fixed edge areas and scrollable view list. */
  children?: ReactNode
}

interface WorkspaceTabsFixedAreaProps extends WorkspaceTabsStructuralProps {
  /** Controls that remain visible beside the scrollable view list. */
  children?: ReactNode
  /** An accessible name for the fixed control group. */
  'aria-label'?: string
  /** Identifies the element that labels the fixed control group. */
  'aria-labelledby'?: string
}

export type WorkspaceTabsLeadingAreaProps = WorkspaceTabsFixedAreaProps

export type WorkspaceTabsTrailingAreaProps = WorkspaceTabsFixedAreaProps

export interface WorkspaceTabsTabProps {
  /** Uniquely identifies the view and links it to a matching panel. */
  value: WorkspaceTabsValue
  /** The visible view name. */
  children: ReactNode
  /** Renders a decorative medium icon before the view name. */
  prefix?: ReactNode
  /** Disables selection and closing for this view. */
  disabled?: boolean
  /** Runs when focus leaves the tab button. */
  onBlur?: BaseTabs.Tab.Props['onBlur']
  /** Adds a close action to the view. */
  onClose?: (value: WorkspaceTabsValue) => void
  /** Runs when the tab button receives focus. */
  onFocus?: BaseTabs.Tab.Props['onFocus']
  /** Runs when a pointer press starts on the tab button. */
  onPointerDown?: BaseTabs.Tab.Props['onPointerDown']
  /** Runs when the pointer enters the tab button. */
  onPointerEnter?: BaseTabs.Tab.Props['onPointerEnter']
  /** Runs when the pointer leaves the tab button. */
  onPointerLeave?: BaseTabs.Tab.Props['onPointerLeave']
  /** Provides the accessible name for the close action. */
  closeLabel?: string
  /** Enables the reorder context menu and provides its accessible name. */
  reorderLabel?: string
}

export interface WorkspaceTabsPanelProps {
  /** Identifies the view that controls this panel. */
  value: WorkspaceTabsValue
  /** The view content. */
  children?: ReactNode
  /** Keeps the panel mounted while another view is active. */
  keepMounted?: boolean
}

function WorkspaceTabsRoot({ children, value, defaultValue, onValueChange }: WorkspaceTabsRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<WorkspaceTabsValue | null>(
    defaultValue ?? null,
  )
  const selectedValue = value === undefined ? uncontrolledValue : value
  const rootStyles = createStateStyleProps<BaseTabs.Root.State>((state) => [
    workspaceTabsStyles.root,
    state.orientation === 'horizontal' && workspaceTabsStyles.rootHorizontal,
    state.orientation === 'vertical' && workspaceTabsStyles.rootVertical,
    state.tabActivationDirection === 'left' && workspaceTabsStyles.rootActivationLeft,
    state.tabActivationDirection === 'right' && workspaceTabsStyles.rootActivationRight,
    state.tabActivationDirection === 'up' && workspaceTabsStyles.rootActivationUp,
    state.tabActivationDirection === 'down' && workspaceTabsStyles.rootActivationDown,
    state.tabActivationDirection === 'none' && workspaceTabsStyles.rootActivationNone,
  ])

  const handleValueChange: NonNullable<BaseTabs.Root.Props['onValueChange']> = (
    nextValue,
    eventDetails,
  ) => {
    const nextWorkspaceTabsValue = nextValue as WorkspaceTabsValue | null
    onValueChange?.(nextWorkspaceTabsValue, eventDetails)
    if (eventDetails.reason === 'none' && eventDetails.isCanceled === true) {
      return
    }
    if (value === undefined) {
      setUncontrolledValue(nextWorkspaceTabsValue)
    }
  }

  return (
    <WorkspaceTabsContext.Provider value={{ value: selectedValue }}>
      <BaseTabs.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        orientation="horizontal"
        {...rootStyles}
        data-slot="workspace-tabs-root"
      >
        {children}
      </BaseTabs.Root>
    </WorkspaceTabsContext.Provider>
  )
}

function WorkspaceTabsList({
  activateOnFocus = false,
  loopFocus = true,
  values,
  onReorder,
  ...props
}: WorkspaceTabsListProps) {
  const { value } = useContext(WorkspaceTabsContext)
  const listRef = useRef<HTMLDivElement>(null)
  const focusedValueKeyRef = useRef<string | null>(null)
  const listStyles = createStateStyleProps<BaseTabs.List.State>((state) => [
    workspaceTabsStyles.list,
    scrollbarStyles.hidden,
    state.orientation === 'horizontal' && workspaceTabsStyles.listHorizontal,
    state.orientation === 'vertical' && workspaceTabsStyles.listVertical,
    state.tabActivationDirection === 'left' && workspaceTabsStyles.listActivationLeft,
    state.tabActivationDirection === 'right' && workspaceTabsStyles.listActivationRight,
    state.tabActivationDirection === 'up' && workspaceTabsStyles.listActivationUp,
    state.tabActivationDirection === 'down' && workspaceTabsStyles.listActivationDown,
    state.tabActivationDirection === 'none' && workspaceTabsStyles.listActivationNone,
  ])
  const [ReorderComponent, setReorderComponent] = useState<
    WorkspaceTabsReorderModule['WorkspaceTabsReorder'] | null
  >(null)
  if (values !== undefined && new Set(values).size !== values.length) {
    throw new Error('WorkspaceTabs.List values must be unique')
  }

  const reorderConfigured = values !== undefined && onReorder !== undefined
  const pointerReorderConfigured = reorderConfigured === true && values.length > 1
  const reorderReady = ReorderComponent !== null
  const reorderEnabled = pointerReorderConfigured === true && reorderReady === true
  useEffect(() => {
    if (pointerReorderConfigured === false || ReorderComponent !== null) {
      return
    }

    let active = true
    void loadWorkspaceTabsReorder()
      .then((module) => {
        if (active === true) {
          const activeElement = document.activeElement
          if (
            activeElement instanceof Element &&
            listRef.current?.contains(activeElement) === true
          ) {
            focusedValueKeyRef.current =
              activeElement.closest<HTMLElement>('[data-reorder-key]')?.dataset.reorderKey ?? null
          }
          setReorderComponent(() => module.WorkspaceTabsReorder)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load WorkspaceTabs reorder behavior', error)
      })

    return () => {
      active = false
    }
  }, [ReorderComponent, pointerReorderConfigured])

  useLayoutEffect(() => {
    const focusedValueKey = focusedValueKeyRef.current
    if (ReorderComponent === null || focusedValueKey === null) {
      return
    }
    const focusedItem = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-reorder-key]') ?? [],
    ).find((item) => item.dataset.reorderKey === focusedValueKey)
    focusedItem?.querySelector<HTMLElement>('[data-slot="workspace-tabs-tab"]')?.focus()
    focusedValueKeyRef.current = null
  }, [ReorderComponent])

  useLayoutEffect(() => {
    if (value === null) {
      return
    }
    const activeItem = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-slot="workspace-tabs-item"]') ?? [],
    ).find((item) => item.dataset.reorderKey === getWorkspaceTabsValueKey(value))
    activeItem?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [value])

  const list = (
    <WorkspaceTabsActivateOnFocusContext.Provider value={activateOnFocus}>
      <BaseTabs.List
        {...props}
        ref={listRef}
        activateOnFocus={activateOnFocus}
        loopFocus={loopFocus}
        {...listStyles}
        data-loop-focus={loopFocus === true ? '' : undefined}
        data-scrollbar="hidden"
        data-slot="workspace-tabs-list"
      />
    </WorkspaceTabsActivateOnFocusContext.Provider>
  )
  const listContent =
    reorderEnabled === true ? (
      <ReorderComponent
        listRef={listRef}
        values={values}
        onReorder={onReorder}
      >
        {list}
      </ReorderComponent>
    ) : (
      list
    )

  if (reorderConfigured === false) {
    return listContent
  }

  return (
    <WorkspaceTabsReorderActionsContext.Provider value={{ values, onReorder }}>
      {listContent}
    </WorkspaceTabsReorderActionsContext.Provider>
  )
}

function WorkspaceTabsBar({ children, ...props }: WorkspaceTabsBarProps) {
  return (
    <div
      {...props}
      {...stylex.props(workspaceTabsStyles.bar)}
      data-slot="workspace-tabs-bar"
    >
      {children}
    </div>
  )
}

function WorkspaceTabsLeadingArea(props: WorkspaceTabsLeadingAreaProps) {
  return (
    <div
      {...props}
      role={props.role ?? 'group'}
      {...stylex.props(workspaceTabsStyles.fixedArea, workspaceTabsStyles.leadingArea)}
      data-slot="workspace-tabs-leading-area"
    />
  )
}

function WorkspaceTabsTrailingArea(props: WorkspaceTabsTrailingAreaProps) {
  return (
    <div
      {...props}
      role={props.role ?? 'group'}
      {...stylex.props(workspaceTabsStyles.fixedArea, workspaceTabsStyles.trailingArea)}
      data-slot="workspace-tabs-trailing-area"
    />
  )
}

function WorkspaceTabsTab({ closeLabel = 'Close tab', ...props }: WorkspaceTabsTabProps) {
  const reorderContext = useContext(WorkspaceTabsReorderContext)
  const index = reorderContext.getIndex(props.value)
  const SortableItem = reorderContext.Item

  if (SortableItem !== null && index >= 0) {
    return (
      <SortableItem
        value={props.value}
        disabled={props.disabled}
        index={index}
      >
        {(sortable) => (
          <WorkspaceTabsTabContent
            {...props}
            closeLabel={closeLabel}
            isDragSource={sortable.isDragSource}
            reorderReady
            setReorderRef={sortable.setReorderRef}
          />
        )}
      </SortableItem>
    )
  }

  return (
    <WorkspaceTabsTabContent
      {...props}
      closeLabel={closeLabel}
    />
  )
}

interface WorkspaceTabsTabContentProps extends WorkspaceTabsTabProps {
  isDragSource?: boolean
  reorderReady?: boolean
  setReorderRef?: (element: HTMLDivElement | null) => void
}

function WorkspaceTabsTabContent({
  value,
  children,
  prefix,
  disabled = false,
  onBlur,
  onClose,
  onFocus,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  reorderLabel,
  closeLabel = 'Close tab',
  isDragSource = false,
  reorderReady = false,
  setReorderRef,
}: WorkspaceTabsTabContentProps) {
  const context = useContext(WorkspaceTabsContext)
  const activateOnFocus = useContext(WorkspaceTabsActivateOnFocusContext)
  const reorderActions = useContext(WorkspaceTabsReorderActionsContext)
  const active = context.value === value
  const reorderIndex = reorderActions?.values.indexOf(value) ?? -1
  const showReorderActions =
    reorderLabel !== undefined &&
    reorderIndex >= 0 &&
    (reorderActions?.values.length ?? 0) > 1 &&
    disabled === false
  const tabStyles = createStateStyleProps<BaseTabs.Tab.State>((state) => [
    workspaceTabsStyles.tab,
    state.active === true && workspaceTabsStyles.tabActive,
    state.disabled === true && workspaceTabsStyles.tabDisabled,
    state.orientation === 'horizontal' && workspaceTabsStyles.tabHorizontal,
    state.orientation === 'vertical' && workspaceTabsStyles.tabVertical,
    state.tabActivationDirection === 'left' && workspaceTabsStyles.tabActivationLeft,
    state.tabActivationDirection === 'right' && workspaceTabsStyles.tabActivationRight,
    state.tabActivationDirection === 'up' && workspaceTabsStyles.tabActivationUp,
    state.tabActivationDirection === 'down' && workspaceTabsStyles.tabActivationDown,
    state.tabActivationDirection === 'none' && workspaceTabsStyles.tabActivationNone,
  ])

  const handleClose = () => {
    if (disabled === false) {
      onClose?.(value)
    }
  }

  const handleCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleClose()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const opensContextMenu =
      event.key === 'Enter' ||
      event.key === 'ContextMenu' ||
      (event.key === 'F10' &&
        event.shiftKey === true &&
        event.altKey === false &&
        event.ctrlKey === false &&
        event.metaKey === false)
    if (showReorderActions === true && opensContextMenu === true) {
      event.preventDefault()
      event.stopPropagation()
      const bounds = event.currentTarget.getBoundingClientRect()
      const tab = event.currentTarget
      const openReorderMenu = () => {
        tab.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            button: 2,
            buttons: 2,
            cancelable: true,
            clientX: bounds.left,
            clientY: bounds.bottom,
          }),
        )
      }
      if (event.key === 'Enter') {
        openReorderMenu()
      } else {
        window.setTimeout(openReorderMenu, 0)
      }
      return
    }

    if (
      showReorderActions === true &&
      event.shiftKey === true &&
      event.altKey === false &&
      event.ctrlKey === false &&
      event.metaKey === false &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault()
      moveTab(reorderIndex + (event.key === 'ArrowLeft' ? -1 : 1))
      return
    }

    if (
      event.shiftKey === false &&
      event.altKey === false &&
      event.ctrlKey === false &&
      event.metaKey === false &&
      (event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'Home' ||
        event.key === 'End')
    ) {
      const list = event.currentTarget.closest<HTMLElement>('[data-slot="workspace-tabs-list"]')
      const tabs = Array.from(
        list?.querySelectorAll<HTMLButtonElement>('[data-slot="workspace-tabs-tab"]') ?? [],
      ).filter((tab) => tab.disabled === false)
      const currentIndex = tabs.indexOf(event.currentTarget)
      const loops = list?.hasAttribute('data-loop-focus') === true
      let destinationIndex = currentIndex
      if (event.key === 'Home') {
        destinationIndex = 0
      } else if (event.key === 'End') {
        destinationIndex = tabs.length - 1
      } else {
        const offset = event.key === 'ArrowLeft' ? -1 : 1
        destinationIndex = currentIndex + offset
        if (loops === true) {
          destinationIndex = (destinationIndex + tabs.length) % tabs.length
        }
      }
      const destination = tabs[destinationIndex]
      if (destination !== undefined && destination !== event.currentTarget) {
        event.preventDefault()
        event.stopPropagation()
        destination.focus()
        if (activateOnFocus === true) {
          destination.click()
        }
      }
      return
    }

    if (event.key !== 'Delete' || onClose === undefined || disabled === true) {
      return
    }
    event.preventDefault()
    handleClose()
  }

  const moveTab = (destinationIndex: number) => {
    if (reorderActions === null) {
      return
    }
    const reorderedValues = getReorderedWorkspaceTabsValues(
      reorderActions.values,
      value,
      destinationIndex,
    )
    if (reorderedValues !== null) {
      reorderActions.onReorder(reorderedValues)
    }
  }

  const handleTabMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    // Base Tabs activates on focus. Prevent pointer focus while a sortable tab may become a drag;
    // the click still activates immediately, and a successful drop activates from onDragEnd.
    if (reorderReady === true && active === false && disabled === false && event.button === 0) {
      event.preventDefault()
    }
  }

  const item = (
    <div
      ref={setReorderRef}
      {...stylex.props(
        workspaceTabsStyles.item,
        onClose !== undefined && workspaceTabsStyles.itemClosable,
        active === true && workspaceTabsStyles.itemActive,
        isDragSource === true && workspaceTabsStyles.itemDragging,
        disabled === true && workspaceTabsStyles.itemDisabled,
      )}
      data-active={active === true ? '' : undefined}
      data-disabled={disabled === true ? '' : undefined}
      data-dragging={isDragSource === true ? '' : undefined}
      data-reorder-key={getWorkspaceTabsValueKey(value)}
      data-reorder-ready={reorderReady === true && showReorderActions === true ? '' : undefined}
      data-slot="workspace-tabs-item"
    >
      <BaseTabs.Tab
        value={value}
        disabled={disabled}
        tabIndex={disabled === true ? -1 : 0}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleTabKeyDown}
        onMouseDown={handleTabMouseDown}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        {...tabStyles}
        data-slot="workspace-tabs-tab"
      >
        {prefix !== undefined ? (
          <span
            aria-hidden="true"
            {...stylex.props(workspaceTabsStyles.prefix)}
          >
            {prefix}
          </span>
        ) : null}
        <span
          {...stylex.props(workspaceTabsStyles.title)}
          data-slot="workspace-tabs-title"
        >
          {children}
        </span>
      </BaseTabs.Tab>
      {onClose !== undefined ? (
        <div
          {...stylex.props(workspaceTabsStyles.closeContainer)}
          data-slot="workspace-tabs-close"
        >
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  aria-label={closeLabel}
                  disabled={disabled}
                  iconOnly
                  onClick={handleCloseClick}
                  radius="xs"
                  render={
                    <button
                      type="button"
                      {...stylex.props(workspaceTabsStyles.closeAction)}
                    />
                  }
                  size="xs"
                  variant="ghost"
                >
                  <CloseGlyph
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    {...stylex.props(workspaceTabsStyles.closeIcon)}
                  />
                </Button>
              }
            />
            <Tooltip.Content>Close view</Tooltip.Content>
          </Tooltip.Root>
        </div>
      ) : null}
    </div>
  )

  if (showReorderActions === false) {
    return item
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={item} />
      <ContextMenu.Content aria-label={reorderLabel}>
        <ContextMenu.Item
          disabled={reorderIndex <= 0}
          onClick={() => {
            moveTab(reorderIndex - 1)
          }}
        >
          Move left
        </ContextMenu.Item>
        <ContextMenu.Item
          disabled={reorderIndex >= (reorderActions?.values.length ?? 0) - 1}
          onClick={() => {
            moveTab(reorderIndex + 1)
          }}
        >
          Move right
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

function WorkspaceTabsPanel({ value, children, keepMounted = false }: WorkspaceTabsPanelProps) {
  const panelStyles = createStateStyleProps<BaseTabs.Panel.State>((state) => [
    workspaceTabsStyles.panel,
    state.hidden === true && workspaceTabsStyles.panelHidden,
    state.orientation === 'horizontal' && workspaceTabsStyles.panelHorizontal,
    state.orientation === 'vertical' && workspaceTabsStyles.panelVertical,
    state.tabActivationDirection === 'left' && workspaceTabsStyles.panelActivationLeft,
    state.tabActivationDirection === 'right' && workspaceTabsStyles.panelActivationRight,
    state.tabActivationDirection === 'up' && workspaceTabsStyles.panelActivationUp,
    state.tabActivationDirection === 'down' && workspaceTabsStyles.panelActivationDown,
    state.tabActivationDirection === 'none' && workspaceTabsStyles.panelActivationNone,
    state.transitionStatus === 'starting' && workspaceTabsStyles.panelStarting,
    state.transitionStatus === 'ending' && workspaceTabsStyles.panelEnding,
  ])

  return (
    <BaseTabs.Panel
      value={value}
      keepMounted={keepMounted}
      tabIndex={-1}
      {...panelStyles}
      data-slot="workspace-tabs-panel"
    >
      {children}
    </BaseTabs.Panel>
  )
}

export const WorkspaceTabs = Object.assign(WorkspaceTabsRoot, {
  Bar: WorkspaceTabsBar,
  LeadingArea: WorkspaceTabsLeadingArea,
  Root: WorkspaceTabsRoot,
  List: WorkspaceTabsList,
  Panel: WorkspaceTabsPanel,
  Tab: WorkspaceTabsTab,
  TrailingArea: WorkspaceTabsTrailingArea,
})
