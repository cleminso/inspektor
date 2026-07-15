import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  Group as BaseGroup,
  Panel as BasePanel,
  Separator as BaseSeparator,
  useDefaultLayout,
  useGroupCallbackRef,
  useGroupRef,
  usePanelCallbackRef,
  usePanelRef,
  type GroupImperativeHandle,
  type GroupProps as BaseGroupProps,
  type Layout,
  type LayoutStorage,
  type PanelImperativeHandle,
  type PanelProps as BasePanelProps,
  type PanelSize,
  type SeparatorProps as BaseSeparatorProps,
} from 'react-resizable-panels'

import { resizablePanelStyles } from './resizablePanel.styles'

export type ResizableHandleAppearance = 'line' | 'grip'

type ResizablePanelOrientation = NonNullable<BaseGroupProps['orientation']>

const ResizablePanelOrientationContext = createContext<ResizablePanelOrientation>('horizontal')

const gripOrientationStyles = {
  horizontal: resizablePanelStyles.gripVertical,
  vertical: resizablePanelStyles.gripHorizontal,
} satisfies Record<ResizablePanelOrientation, unknown>

export interface ResizablePanelGroupProps
  extends Omit<BaseGroupProps, 'className' | 'style' | 'resizeTargetMinimumSize'> {
  /** Controls whether panels are arranged and resized horizontally or vertically. */
  orientation?: BaseGroupProps['orientation']
  /** Restores a previously saved layout keyed by panel id. */
  defaultLayout?: BaseGroupProps['defaultLayout']
  /** Disables resizing for every panel and handle in the group. */
  disabled?: BaseGroupProps['disabled']
  /** Prevents the library from changing the pointer cursor during resizing. */
  disableCursor?: BaseGroupProps['disableCursor']
  /** Uniquely identifies the group and its persisted layout. */
  id?: BaseGroupProps['id']
  /** Runs continuously while the group layout changes. */
  onLayoutChange?: BaseGroupProps['onLayoutChange']
  /** Runs after a group layout change is committed. */
  onLayoutChanged?: BaseGroupProps['onLayoutChanged']
  /** Provides access to the group's imperative layout controls. */
  groupRef?: BaseGroupProps['groupRef']
  /** Provides access to the group's root element. */
  elementRef?: BaseGroupProps['elementRef']
}

export interface ResizablePanelProps extends Omit<BasePanelProps, 'className' | 'style'> {
  /** Uniquely identifies the panel within its group. */
  id?: BasePanelProps['id']
  /** Sets the panel size used when no persisted layout is available. */
  defaultSize?: BasePanelProps['defaultSize']
  /** Sets the smallest expanded panel size. */
  minSize?: BasePanelProps['minSize']
  /** Sets the largest panel size. */
  maxSize?: BasePanelProps['maxSize']
  /** Sets the panel size when collapsed. */
  collapsedSize?: BasePanelProps['collapsedSize']
  /** Allows the panel to collapse when resized below its minimum size. */
  collapsible?: BasePanelProps['collapsible']
  /** Prevents this panel from being resized directly or indirectly. */
  disabled?: BasePanelProps['disabled']
  /** Controls how the panel responds when its group changes size. */
  groupResizeBehavior?: BasePanelProps['groupResizeBehavior']
  /** Runs when the panel size changes. */
  onResize?: BasePanelProps['onResize']
  /** Provides access to collapse, expand, size, and resize controls. */
  panelRef?: BasePanelProps['panelRef']
  /** Provides access to the panel's root element. */
  elementRef?: BasePanelProps['elementRef']
}

export interface ResizableHandleProps
  extends Omit<BaseSeparatorProps, 'children' | 'className' | 'style'> {
  /** Controls whether the separator is a line or includes a visible grip. */
  appearance?: ResizableHandleAppearance
  /** Uniquely identifies the handle within its group. */
  id?: BaseSeparatorProps['id']
  /** Prevents the handle from resizing its neighboring panels. */
  disabled?: BaseSeparatorProps['disabled']
  /** Prevents a double click from restoring the adjacent panel's default size. */
  disableDoubleClick?: BaseSeparatorProps['disableDoubleClick']
  /** Provides access to the handle element. */
  elementRef?: BaseSeparatorProps['elementRef']
}

export function ResizablePanelGroup({
  orientation = 'horizontal',
  disabled = false,
  disableCursor = false,
  ...props
}: ResizablePanelGroupProps) {
  const groupStyleProps = stylex.props(resizablePanelStyles.group)

  return (
    <ResizablePanelOrientationContext.Provider value={orientation}>
      <BaseGroup
        {...props}
        className={groupStyleProps.className}
        style={groupStyleProps.style}
        orientation={orientation}
        disabled={disabled}
        disableCursor={disableCursor}
        data-slot="resizable-panel-group"
      />
    </ResizablePanelOrientationContext.Provider>
  )
}

export function ResizablePanel({
  collapsedSize = 0,
  collapsible = false,
  disabled = false,
  groupResizeBehavior = 'preserve-relative-size',
  ...props
}: ResizablePanelProps) {
  const panelStyleProps = stylex.props(resizablePanelStyles.panel)

  return (
    <BasePanel
      {...props}
      className={panelStyleProps.className}
      style={panelStyleProps.style}
      collapsedSize={collapsedSize}
      collapsible={collapsible}
      disabled={disabled}
      groupResizeBehavior={groupResizeBehavior}
      data-slot="resizable-panel"
    />
  )
}

export function ResizableHandle({
  appearance = 'line',
  disabled = false,
  disableDoubleClick = false,
  ...props
}: ResizableHandleProps) {
  const groupOrientation = useContext(ResizablePanelOrientationContext)
  const handleStyleProps = stylex.props(resizablePanelStyles.handle)
  const gripStyleProps = stylex.props(
    resizablePanelStyles.grip,
    gripOrientationStyles[groupOrientation],
  )

  return (
    <BaseSeparator
      {...props}
      className={handleStyleProps.className}
      style={handleStyleProps.style}
      disabled={disabled}
      disableDoubleClick={disableDoubleClick}
      data-appearance={appearance}
      data-slot="resizable-handle"
    >
      {appearance === 'grip' ? (
        <span
          aria-hidden="true"
          className={gripStyleProps.className}
          style={gripStyleProps.style}
        />
      ) : null}
    </BaseSeparator>
  )
}

export {
  useDefaultLayout as useResizableDefaultLayout,
  useGroupCallbackRef as useResizableGroupCallbackRef,
  useGroupRef as useResizableGroupRef,
  usePanelCallbackRef as useResizablePanelCallbackRef,
  usePanelRef as useResizablePanelRef,
}

export type {
  GroupImperativeHandle as ResizableGroupImperativeHandle,
  Layout as ResizableLayout,
  LayoutStorage as ResizableLayoutStorage,
  PanelImperativeHandle as ResizablePanelImperativeHandle,
  PanelSize as ResizablePanelSize,
}
