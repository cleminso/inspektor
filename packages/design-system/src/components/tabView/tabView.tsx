// TODO:
// - add `click-right` -> context menu to perform actions with tabView
// - handle behavior: select tab + press shit + click another tab = select all tabs range
//  - right click = open context menu
//  - direct press `delete` = close all tabView from the selected range
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'
import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { Button } from '../button/button'
import { Tooltip } from '../tooltip/tooltip'
import { tabViewStyles } from './tabView.styles'
import { TabViewReorderContext, type TabViewValue } from './tabViewReorderContext'

export type { TabViewValue } from './tabViewReorderContext'

interface TabViewContextValue {
  value: TabViewValue | null
}

const TabViewContext = createContext<TabViewContextValue>({ value: null })

/**
 * Why: importing DND from this static module pulled the shared sortable chunk into the initial
 * application load. A later sibling-runtime approach avoided that download but matched tab values
 * to discovered DOM elements by position, which made tabs jump and reorder unpredictably.
 *
 * How: the DND implementation loads after mount and wraps the list. Its context supplies a
 * sortable component that attaches `useSortable` directly to each owning TabView.Item ref.
 *
 * What: the first render stays static, then the list remounts once with reorder behavior. The
 * focused tab is recorded by its typed value key and restored after that remount.
 */
type TabViewReorderModule = typeof import('./tabViewReorder')

let tabViewReorderModule: Promise<TabViewReorderModule> | undefined

function loadTabViewReorder(): Promise<TabViewReorderModule> {
  tabViewReorderModule ??= import('./tabViewReorder').catch((error: unknown) => {
    tabViewReorderModule = undefined
    throw error
  })
  return tabViewReorderModule
}

function getTabViewValueKey(value: TabViewValue): string {
  return `${typeof value}:${String(value)}`
}

export interface TabViewRootProps {
  /** The tab views and their associated panels. */
  children?: ReactNode
  /** The active view value when controlled. */
  value?: TabViewValue | null
  /** The initially active view value when uncontrolled. */
  defaultValue?: TabViewValue | null
  /** Called when the active view changes. */
  onValueChange?: (
    value: TabViewValue | null,
    eventDetails: BaseTabs.Root.ChangeEventDetails,
  ) => void
}

interface TabViewListBaseProps {
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

interface ReorderableTabViewListProps {
  /** The tab values in their controlled visual order. */
  values: readonly TabViewValue[]
  /** Called with the complete ordered value list after a tab is dragged. */
  onReorder: (values: TabViewValue[]) => void
}

interface StaticTabViewListProps {
  values?: never
  onReorder?: never
}

export type TabViewListProps = TabViewListBaseProps &
  (ReorderableTabViewListProps | StaticTabViewListProps)

export interface TabViewItemProps {
  /** Uniquely identifies the view and links it to a matching panel. */
  value: TabViewValue
  /** The visible view name. */
  children: ReactNode
  /** Supplementary context shown in a tooltip even when the view name fits. */
  details?: ReactNode
  /** Renders a decorative medium icon before the view name. */
  prefix?: ReactNode
  /** Disables selection and closing for this view. */
  disabled?: boolean
  /** Adds a close action to the view. */
  onClose?: (value: TabViewValue) => void
  /** Provides the accessible name for the close action. */
  closeLabel?: string
}

export interface TabViewPanelProps {
  /** Identifies the view that controls this panel. */
  value: TabViewValue
  /** The view content. */
  children?: ReactNode
  /** Keeps the panel mounted while another view is active. */
  keepMounted?: boolean
}

function TabViewRoot({ children, value, defaultValue, onValueChange }: TabViewRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<TabViewValue | null>(
    defaultValue ?? null,
  )
  const selectedValue = value === undefined ? uncontrolledValue : value
  const rootStyles = createStateStyleProps<BaseTabs.Root.State>((state) => [
    tabViewStyles.root,
    state.orientation === 'horizontal' && tabViewStyles.rootHorizontal,
    state.orientation === 'vertical' && tabViewStyles.rootVertical,
    state.tabActivationDirection === 'left' && tabViewStyles.rootActivationLeft,
    state.tabActivationDirection === 'right' && tabViewStyles.rootActivationRight,
    state.tabActivationDirection === 'up' && tabViewStyles.rootActivationUp,
    state.tabActivationDirection === 'down' && tabViewStyles.rootActivationDown,
    state.tabActivationDirection === 'none' && tabViewStyles.rootActivationNone,
  ])

  const handleValueChange: NonNullable<BaseTabs.Root.Props['onValueChange']> = (
    nextValue,
    eventDetails,
  ) => {
    const nextTabViewValue = nextValue as TabViewValue | null
    onValueChange?.(nextTabViewValue, eventDetails)
    if (eventDetails.reason === 'none' && eventDetails.isCanceled === true) {
      return
    }
    if (value === undefined) {
      setUncontrolledValue(nextTabViewValue)
    }
  }

  return (
    <TabViewContext.Provider value={{ value: selectedValue }}>
      <BaseTabs.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        orientation="horizontal"
        {...rootStyles}
        data-slot="tab-view-root"
      >
        {children}
      </BaseTabs.Root>
    </TabViewContext.Provider>
  )
}

function TabViewList({
  activateOnFocus = true,
  loopFocus = true,
  values,
  onReorder,
  ...props
}: TabViewListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const focusedValueKeyRef = useRef<string | null>(null)
  const listStyles = createStateStyleProps<BaseTabs.List.State>((state) => [
    tabViewStyles.list,
    scrollbarStyles.hidden,
    state.orientation === 'horizontal' && tabViewStyles.listHorizontal,
    state.orientation === 'vertical' && tabViewStyles.listVertical,
    state.tabActivationDirection === 'left' && tabViewStyles.listActivationLeft,
    state.tabActivationDirection === 'right' && tabViewStyles.listActivationRight,
    state.tabActivationDirection === 'up' && tabViewStyles.listActivationUp,
    state.tabActivationDirection === 'down' && tabViewStyles.listActivationDown,
    state.tabActivationDirection === 'none' && tabViewStyles.listActivationNone,
  ])
  const [ReorderComponent, setReorderComponent] = useState<
    TabViewReorderModule['TabViewReorder'] | null
  >(null)
  if (values !== undefined && new Set(values).size !== values.length) {
    throw new Error('TabView.List values must be unique')
  }

  const reorderConfigured = values !== undefined && onReorder !== undefined
  const reorderReady = ReorderComponent !== null
  const reorderEnabled = reorderConfigured === true && reorderReady === true
  useEffect(() => {
    if (reorderConfigured === false || ReorderComponent !== null) {
      return
    }

    let active = true
    void loadTabViewReorder()
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
          setReorderComponent(() => module.TabViewReorder)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load TabView reorder behavior', error)
      })

    return () => {
      active = false
    }
  }, [ReorderComponent, reorderConfigured])

  useLayoutEffect(() => {
    const focusedValueKey = focusedValueKeyRef.current
    if (ReorderComponent === null || focusedValueKey === null) {
      return
    }
    const focusedItem = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-reorder-key]') ?? [],
    ).find((item) => item.dataset.reorderKey === focusedValueKey)
    focusedItem?.querySelector<HTMLElement>('[data-slot="tab-view-tab"]')?.focus()
    focusedValueKeyRef.current = null
  }, [ReorderComponent])

  const list = (
    <BaseTabs.List
      {...props}
      ref={listRef}
      activateOnFocus={activateOnFocus}
      loopFocus={loopFocus}
      {...listStyles}
      data-scrollbar="hidden"
      data-slot="tab-view-list"
    />
  )

  if (reorderEnabled === false) {
    return list
  }

  return (
    <ReorderComponent listRef={listRef} values={values} onReorder={onReorder}>
      {list}
    </ReorderComponent>
  )
}

function TabViewItem({ closeLabel = 'Close tab', ...props }: TabViewItemProps) {
  const reorderContext = useContext(TabViewReorderContext)
  const index = reorderContext.getIndex(props.value)
  const SortableItem = reorderContext.Item

  if (SortableItem !== null && index >= 0) {
    return (
      <SortableItem value={props.value} disabled={props.disabled} index={index}>
        {(sortable) => (
          <TabViewItemContent
            {...props}
            closeLabel={closeLabel}
            isDragSource={sortable.isDragSource}
            setReorderRef={sortable.setReorderRef}
          />
        )}
      </SortableItem>
    )
  }

  return <TabViewItemContent {...props} closeLabel={closeLabel} />
}

interface TabViewItemContentProps extends TabViewItemProps {
  isDragSource?: boolean
  setReorderRef?: (element: HTMLDivElement | null) => void
}

function TabViewItemContent({
  value,
  children,
  details,
  prefix,
  disabled = false,
  onClose,
  closeLabel = 'Close tab',
  isDragSource = false,
  setReorderRef,
}: TabViewItemContentProps) {
  const context = useContext(TabViewContext)
  const active = context.value === value
  const hasPrefix = prefix !== undefined
  const itemRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const [titleOverflowing, setTitleOverflowing] = useState(false)
  const tabStyles = createStateStyleProps<BaseTabs.Tab.State>((state) => [
    tabViewStyles.tab,
    state.active === true && tabViewStyles.tabActive,
    state.disabled === true && tabViewStyles.tabDisabled,
    state.orientation === 'horizontal' && tabViewStyles.tabHorizontal,
    state.orientation === 'vertical' && tabViewStyles.tabVertical,
    state.tabActivationDirection === 'left' && tabViewStyles.tabActivationLeft,
    state.tabActivationDirection === 'right' && tabViewStyles.tabActivationRight,
    state.tabActivationDirection === 'up' && tabViewStyles.tabActivationUp,
    state.tabActivationDirection === 'down' && tabViewStyles.tabActivationDown,
    state.tabActivationDirection === 'none' && tabViewStyles.tabActivationNone,
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
    if (event.key !== 'Delete' || onClose === undefined || disabled === true) {
      return
    }
    event.preventDefault()
    handleClose()
  }

  const setItemRef = useCallback(
    (element: HTMLDivElement | null) => {
      itemRef.current = element
      setReorderRef?.(element)
    },
    [setReorderRef],
  )

  useEffect(() => {
    const item = itemRef.current
    const title = titleRef.current
    if (item === null || title === null) {
      return
    }

    let animationFrame: number | undefined
    const measure = () => {
      setTitleOverflowing(title.scrollWidth > title.clientWidth)
    }
    const scheduleMeasure = () => {
      if (animationFrame !== undefined) {
        return
      }
      animationFrame = requestAnimationFrame(() => {
        animationFrame = undefined
        measure()
      })
    }

    measure()
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(item)

    return () => {
      resizeObserver.disconnect()
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [children, hasPrefix])

  return (
    <div
      ref={setItemRef}
      {...stylex.props(
        tabViewStyles.item,
        active === true && tabViewStyles.itemActive,
        isDragSource === true && tabViewStyles.itemDragging,
        disabled === true && tabViewStyles.itemDisabled,
      )}
      data-active={active === true ? '' : undefined}
      data-disabled={disabled === true ? '' : undefined}
      data-dragging={isDragSource === true ? '' : undefined}
      data-reorder-key={getTabViewValueKey(value)}
      data-slot="tab-view-item"
      data-title-overflow={titleOverflowing}
    >
      <Tooltip.Root disabled={details === undefined && titleOverflowing === false}>
        <Tooltip.Trigger
          render={
            <BaseTabs.Tab
              value={value}
              disabled={disabled}
              onKeyDown={handleTabKeyDown}
              {...tabStyles}
              data-slot="tab-view-tab"
            >
              {prefix !== undefined ? (
                <span aria-hidden="true" {...stylex.props(tabViewStyles.prefix)}>
                  {prefix}
                </span>
              ) : null}
              <span
                ref={titleRef}
                {...stylex.props(tabViewStyles.title)}
                data-slot="tab-view-title"
              >
                {children}
              </span>
            </BaseTabs.Tab>
          }
        />
        <Tooltip.Content>{details ?? children}</Tooltip.Content>
      </Tooltip.Root>
      {onClose !== undefined ? (
        <div
          {...stylex.props(
            tabViewStyles.closeContainer,
            titleOverflowing === true &&
              disabled === false &&
              tabViewStyles.closeContainerOverflowing,
          )}
          data-slot="tab-view-close"
        >
          <Button
            aria-label={closeLabel}
            disabled={disabled}
            iconOnly
            onClick={handleCloseClick}
            radius="xs"
            render={<button type="button" {...stylex.props(tabViewStyles.closeAction)} />}
            size="xs"
            variant="ghost"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              {...stylex.props(tabViewStyles.closeIcon)}
            >
              <path
                d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function TabViewPanel({ value, children, keepMounted = false }: TabViewPanelProps) {
  const panelStyles = createStateStyleProps<BaseTabs.Panel.State>((state) => [
    tabViewStyles.panel,
    state.hidden === true && tabViewStyles.panelHidden,
    state.orientation === 'horizontal' && tabViewStyles.panelHorizontal,
    state.orientation === 'vertical' && tabViewStyles.panelVertical,
    state.tabActivationDirection === 'left' && tabViewStyles.panelActivationLeft,
    state.tabActivationDirection === 'right' && tabViewStyles.panelActivationRight,
    state.tabActivationDirection === 'up' && tabViewStyles.panelActivationUp,
    state.tabActivationDirection === 'down' && tabViewStyles.panelActivationDown,
    state.tabActivationDirection === 'none' && tabViewStyles.panelActivationNone,
    state.transitionStatus === 'starting' && tabViewStyles.panelStarting,
    state.transitionStatus === 'ending' && tabViewStyles.panelEnding,
  ])

  return (
    <BaseTabs.Panel
      value={value}
      keepMounted={keepMounted}
      tabIndex={-1}
      {...panelStyles}
      data-slot="tab-view-panel"
    >
      {children}
    </BaseTabs.Panel>
  )
}

export const TabView = Object.assign(TabViewRoot, {
  Root: TabViewRoot,
  List: TabViewList,
  Item: TabViewItem,
  Panel: TabViewPanel,
})
