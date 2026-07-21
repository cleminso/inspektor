import { Button as BaseButton } from '@base-ui/react/button'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useEffect,
  useContext,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { Tooltip } from '../tooltip/tooltip'
import { tabViewStyles } from './tabView.styles'

export type TabViewValue = string | number

interface TabViewContextValue {
  value: TabViewValue | null
}

const TabViewContext = createContext<TabViewContextValue>({ value: null })

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

export interface TabViewListProps {
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

export interface TabViewItemProps {
  /** Uniquely identifies the view and links it to a matching panel. */
  value: TabViewValue
  /** The visible view name. */
  children: ReactNode
  /** Supplementary context shown in a tooltip even when the view name fits. */
  details?: ReactNode
  /** Renders a decorative 16px icon before the view name. */
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

function TabViewRoot({
  children,
  value,
  defaultValue,
  onValueChange,
}: TabViewRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<TabViewValue | null>(
    defaultValue ?? null,
  )
  const selectedValue = value === undefined ? uncontrolledValue : value
  const rootStyles = createStateStyleProps<BaseTabs.Root.State>(() => [tabViewStyles.root])

  const handleValueChange: NonNullable<BaseTabs.Root.Props['onValueChange']> = (
    nextValue,
    eventDetails,
  ) => {
    const nextTabViewValue = nextValue as TabViewValue | null
    if (value === undefined) {
      setUncontrolledValue(nextTabViewValue)
    }
    onValueChange?.(nextTabViewValue, eventDetails)
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
  ...props
}: TabViewListProps) {
  const listStyles = createStateStyleProps<BaseTabs.List.State>(() => [tabViewStyles.list])

  return (
    <BaseTabs.List
      {...props}
      activateOnFocus={activateOnFocus}
      loopFocus={loopFocus}
      {...listStyles}
      data-slot="tab-view-list"
    />
  )
}

function TabViewItem({
  value,
  children,
  details,
  prefix,
  disabled = false,
  onClose,
  closeLabel = 'Close tab',
}: TabViewItemProps) {
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
      ref={itemRef}
      {...stylex.props(
        tabViewStyles.item,
        active === true && tabViewStyles.itemActive,
        disabled === true && tabViewStyles.itemDisabled,
      )}
      data-active={active === true ? '' : undefined}
      data-disabled={disabled === true ? '' : undefined}
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
            titleOverflowing === true && tabViewStyles.closeContainerOverflowing,
          )}
          data-slot="tab-view-close"
        >
          <BaseButton
            aria-label={closeLabel}
            disabled={disabled}
            onClick={handleCloseClick}
            {...stylex.props(tabViewStyles.closeButton)}
            data-slot="tab-view-close-button"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              {...stylex.props(tabViewStyles.closeIcon)}
            >
              <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </BaseButton>
        </div>
      ) : null}
    </div>
  )
}

function TabViewPanel({ value, children, keepMounted = false }: TabViewPanelProps) {
  const panelStyles = createStateStyleProps<BaseTabs.Panel.State>(() => [tabViewStyles.panel])

  return (
    <BaseTabs.Panel
      value={value}
      keepMounted={keepMounted}
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
