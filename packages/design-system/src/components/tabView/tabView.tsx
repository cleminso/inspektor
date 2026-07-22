import { Button as BaseButton } from '@base-ui/react/button'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { arrayMove } from '@dnd-kit/helpers'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import {
  AutoScroller,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import * as stylex from '@stylexjs/stylex'
import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useMemo,
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

interface TabViewReorderContextValue {
  enabled: boolean
  getIndex: (value: TabViewValue) => number
}

const TabViewReorderContext = createContext<TabViewReorderContextValue>({
  enabled: false,
  getIndex: () => -1,
})

const tabViewPointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({ value: 4 })],
  preventActivation: (event) => {
    if (event.pointerType === 'touch') {
      return true
    }
    if (!(event.target instanceof Element)) {
      return false
    }
    return (
      event.target.closest('[data-slot="tab-view-close"]') !== null ||
      event.target.closest('[contenteditable="true"]') !== null
    )
  },
})

const tabViewSensors = [tabViewPointerSensor]

function getReorderedValues(
  values: readonly TabViewValue[],
  sourceValue: TabViewValue,
  destinationIndex: number,
): TabViewValue[] | null {
  if (new Set(values).size !== values.length) {
    return null
  }
  const sourceIndex = values.indexOf(sourceValue)
  if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= values.length) {
    return null
  }
  if (sourceIndex === destinationIndex) {
    return null
  }
  return arrayMove([...values], sourceIndex, destinationIndex)
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
  values,
  onReorder,
  ...props
}: TabViewListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const listStyles = createStateStyleProps<BaseTabs.List.State>(() => [tabViewStyles.list])
  const valueIndices = useMemo(
    () => new Map(values?.map((value, index) => [value, index]) ?? []),
    [values],
  )
  const reorderEnabled =
    values !== undefined && onReorder !== undefined && valueIndices.size === values.length
  const reorderContext = useMemo<TabViewReorderContextValue>(
    () => ({
      enabled: reorderEnabled,
      getIndex: (value) => valueIndices.get(value) ?? -1,
    }),
    [reorderEnabled, valueIndices],
  )
  const modifiers = useMemo(
    () => [
      RestrictToHorizontalAxis,
      RestrictToElement.configure({ element: () => listRef.current }),
    ],
    [],
  )

  const list = (
    <TabViewReorderContext.Provider value={reorderContext}>
      <BaseTabs.List
        {...props}
        ref={listRef}
        activateOnFocus={activateOnFocus}
        loopFocus={loopFocus}
        {...listStyles}
        data-slot="tab-view-list"
      />
    </TabViewReorderContext.Provider>
  )

  if (reorderEnabled === false) {
    return list
  }

  return (
    <DragDropProvider
      sensors={tabViewSensors}
      modifiers={modifiers}
      plugins={(defaults) => [
        ...defaults,
        AutoScroller.configure({ acceleration: 8, threshold: { x: 0.05, y: 0 } }),
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragStart={(event) => {
        const tab = event.operation.source?.element?.querySelector('[data-slot="tab-view-tab"]')
        if (tab instanceof HTMLButtonElement && tab.disabled === false) {
          tab.click()
        }
      }}
      onDragEnd={(event) => {
        if (event.canceled) {
          return
        }
        const source = event.operation.source
        if (!isSortable(source)) {
          return
        }
        const reorderedValues = getReorderedValues(values, source.id, source.index)
        if (reorderedValues !== null) {
          onReorder(reorderedValues)
        }
      }}
    >
      {list}
    </DragDropProvider>
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
  const reorderContext = useContext(TabViewReorderContext)
  const active = context.value === value
  const hasPrefix = prefix !== undefined
  const itemRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const [titleOverflowing, setTitleOverflowing] = useState(false)
  const sortableIndex = reorderContext.getIndex(value)
  const sortableEnabled = reorderContext.enabled && sortableIndex >= 0
  const sortable = useSortable({
    id: value,
    index: Math.max(0, sortableIndex),
    disabled: {
      draggable: sortableEnabled === false || disabled === true,
      droppable: sortableEnabled === false,
    },
  })
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

  const setItemRef = useCallback(
    (element: HTMLDivElement | null) => {
      itemRef.current = element
      sortable.ref(element)
    },
    [sortable.ref],
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
        sortable.isDragSource === true && tabViewStyles.itemDragging,
        disabled === true && tabViewStyles.itemDisabled,
      )}
      data-active={active === true ? '' : undefined}
      data-disabled={disabled === true ? '' : undefined}
      data-dragging={sortable.isDragSource === true ? '' : undefined}
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
            titleOverflowing === true && disabled === false && tabViewStyles.closeContainerOverflowing,
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
