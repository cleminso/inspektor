import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { ReactNode } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { segmentedControlStyles } from './segmentedControl.styles'

export type SegmentedControlValue = string | number
export type SegmentedControlWidth = 'content' | 'full'

export interface SegmentedControlRootProps {
  /** The segments and their associated views. */
  children?: ReactNode
  /** The selected segment value when controlled. */
  value?: SegmentedControlValue
  /** The initially selected segment value when uncontrolled. */
  defaultValue?: SegmentedControlValue
  /** Called when the selected segment changes. */
  onValueChange?: (
    value: SegmentedControlValue | null,
    eventDetails: BaseTabs.Root.ChangeEventDetails,
  ) => void
}

export interface SegmentedControlListProps {
  /** The selectable segments. */
  children?: ReactNode
  /** An accessible name for the segment list. */
  'aria-label'?: string
  /** Identifies the element that labels the segment list. */
  'aria-labelledby'?: string
  /** Controls whether the segment list follows its content or fills its container. */
  width?: SegmentedControlWidth
  /** Loops keyboard focus between the first and last segments. */
  loopFocus?: boolean
}

export interface SegmentedControlItemProps {
  /** Uniquely identifies the represented view and links it to a matching panel. */
  value: SegmentedControlValue
  /** The visible segment label. */
  children: ReactNode
  /** Disables selection for this segment. */
  disabled?: boolean
}

export interface SegmentedControlPanelProps {
  /** Identifies the segment that controls this view. */
  value: SegmentedControlValue
  /** The represented view content. */
  children?: ReactNode
  /** Keeps the view mounted while another segment is selected. */
  keepMounted?: boolean
}

function SegmentedControlRoot({
  children,
  value,
  defaultValue,
  onValueChange,
}: SegmentedControlRootProps) {
  const rootStyles = createStateStyleProps<BaseTabs.Root.State>(() => [
    segmentedControlStyles.root,
  ])

  return (
    <BaseTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation="horizontal"
      {...rootStyles}
      data-slot="segmented-control-root"
    >
      {children}
    </BaseTabs.Root>
  )
}

function SegmentedControlList({
  children,
  width = 'content',
  loopFocus = true,
  ...props
}: SegmentedControlListProps) {
  const listStyles = createStateStyleProps<BaseTabs.List.State>(() => [
    segmentedControlStyles.list,
    width === 'full' && segmentedControlStyles.listFullWidth,
  ])
  const indicatorStyles = createStateStyleProps<BaseTabs.Indicator.State>((state) => [
    segmentedControlStyles.indicator,
    state.tabActivationDirection !== 'none' && segmentedControlStyles.indicatorInstant,
  ])

  return (
    <BaseTabs.List
      {...props}
      activateOnFocus
      loopFocus={loopFocus}
      {...listStyles}
      data-slot="segmented-control-list"
    >
      {children}
      <BaseTabs.Indicator
        {...indicatorStyles}
        data-slot="segmented-control-indicator"
      />
    </BaseTabs.List>
  )
}

function SegmentedControlItem({
  value,
  children,
  disabled = false,
}: SegmentedControlItemProps) {
  const itemStyles = createStateStyleProps<BaseTabs.Tab.State>((state) => [
    segmentedControlStyles.item,
    state.active === true && segmentedControlStyles.itemActive,
    state.disabled === true && segmentedControlStyles.itemDisabled,
  ])

  return (
    <BaseTabs.Tab
      value={value}
      disabled={disabled}
      {...itemStyles}
      data-slot="segmented-control-item"
    >
      {children}
    </BaseTabs.Tab>
  )
}

function SegmentedControlPanel({
  value,
  children,
  keepMounted = false,
}: SegmentedControlPanelProps) {
  const panelStyles = createStateStyleProps<BaseTabs.Panel.State>(() => [
    segmentedControlStyles.panel,
  ])

  return (
    <BaseTabs.Panel
      value={value}
      keepMounted={keepMounted}
      {...panelStyles}
      data-slot="segmented-control-panel"
    >
      {children}
    </BaseTabs.Panel>
  )
}

export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Root: SegmentedControlRoot,
  List: SegmentedControlList,
  Item: SegmentedControlItem,
  Panel: SegmentedControlPanel,
})
