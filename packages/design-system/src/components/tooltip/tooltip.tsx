import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import * as stylex from '@stylexjs/stylex'
import type { PropsWithChildren } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { tooltipStyles } from './tooltip.styles'

export type TooltipProviderProps = PropsWithChildren<{
  /** Sets the shared delay before tooltips open. */
  delay?: BaseTooltip.Provider.Props['delay']
  /** Sets the shared delay before tooltips close. */
  closeDelay?: BaseTooltip.Provider.Props['closeDelay']
  /** Keeps adjacent tooltips in the instant-open phase after one closes. */
  timeout?: BaseTooltip.Provider.Props['timeout']
}>

export type TooltipRootProps = PropsWithChildren<{
  /** Sets the initial open state when uncontrolled. */
  defaultOpen?: BaseTooltip.Root.Props['defaultOpen']
  /** Controls whether the tooltip is open. */
  open?: BaseTooltip.Root.Props['open']
  /** Runs when the open state changes. */
  onOpenChange?: BaseTooltip.Root.Props['onOpenChange']
  /** Runs after an opening or closing transition completes. */
  onOpenChangeComplete?: BaseTooltip.Root.Props['onOpenChangeComplete']
  /** Prevents pointer movement over the popup from keeping it open. */
  disableHoverablePopup?: BaseTooltip.Root.Props['disableHoverablePopup']
  /** Selects the cursor axis followed by the tooltip. */
  trackCursorAxis?: BaseTooltip.Root.Props['trackCursorAxis']
  /** Provides access to imperative close and unmount actions. */
  actionsRef?: BaseTooltip.Root.Props['actionsRef']
  /** Prevents the tooltip from opening. */
  disabled?: BaseTooltip.Root.Props['disabled']
}>

export interface TooltipTriggerProps
  extends Omit<BaseTooltip.Trigger.Props, 'className' | 'style' | 'handle' | 'payload'> {
  /** Overrides the delay before this tooltip opens. */
  delay?: BaseTooltip.Trigger.Props['delay']
  /** Closes the tooltip when its trigger is clicked. */
  closeOnClick?: BaseTooltip.Trigger.Props['closeOnClick']
  /** Overrides the delay before this tooltip closes. */
  closeDelay?: BaseTooltip.Trigger.Props['closeDelay']
  /** Prevents this trigger from opening the tooltip. */
  disabled?: BaseTooltip.Trigger.Props['disabled']
  /** Composes tooltip trigger behavior onto another element. */
  render?: BaseTooltip.Trigger.Props['render']
}

export type TooltipContentProps = PropsWithChildren<{
  /** Places the tooltip on this side of its trigger. */
  side?: BaseTooltip.Positioner.Props['side']
  /** Aligns the tooltip along its trigger. */
  align?: BaseTooltip.Positioner.Props['align']
  /** Sets the distance between the tooltip and its trigger. */
  sideOffset?: BaseTooltip.Positioner.Props['sideOffset']
}>

function TooltipProvider({ timeout = 400, ...props }: TooltipProviderProps) {
  return <BaseTooltip.Provider {...props} timeout={timeout} />
}

function TooltipRoot({
  defaultOpen = false,
  disableHoverablePopup = false,
  trackCursorAxis = 'none',
  disabled = false,
  ...props
}: TooltipRootProps) {
  return (
    <BaseTooltip.Root
      {...props}
      defaultOpen={defaultOpen}
      disableHoverablePopup={disableHoverablePopup}
      trackCursorAxis={trackCursorAxis}
      disabled={disabled}
    />
  )
}

function TooltipTrigger({
  closeOnClick = true,
  disabled = false,
  ...props
}: TooltipTriggerProps) {
  return (
    <BaseTooltip.Trigger
      {...props}
      closeOnClick={closeOnClick}
      disabled={disabled}
      data-slot="tooltip-trigger"
    />
  )
}

const arrowSideStyles = {
  top: tooltipStyles.arrowTop,
  bottom: tooltipStyles.arrowBottom,
  left: tooltipStyles.arrowLeft,
  right: tooltipStyles.arrowRight,
  'inline-start': tooltipStyles.arrowLeft,
  'inline-end': tooltipStyles.arrowRight,
} satisfies Record<NonNullable<BaseTooltip.Positioner.Props['side']>, unknown>

function TooltipContent({
  side = 'top',
  align = 'center',
  sideOffset = 8,
  children,
}: TooltipContentProps) {
  const positionerStyleProps = createStateStyleProps<BaseTooltip.Positioner.State>(() => [
    tooltipStyles.positioner,
  ])
  const popupStyleProps = createStateStyleProps<BaseTooltip.Popup.State>((state) => [
    tooltipStyles.popup,
    (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') &&
      tooltipStyles.popupTransition,
  ])
  const arrowStyleProps = createStateStyleProps<BaseTooltip.Arrow.State>((state) => [
    tooltipStyles.arrow,
    arrowSideStyles[state.side],
  ])
  const arrowIconStyleProps = stylex.props(tooltipStyles.arrowIcon)

  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        {...positionerStyleProps}
      >
        <BaseTooltip.Popup {...popupStyleProps} data-slot="tooltip-content">
          {children}
          <BaseTooltip.Arrow {...arrowStyleProps}>
            <svg aria-hidden="true" viewBox="0 0 8 4" {...arrowIconStyleProps}>
              <path d="M0 0h8L4 4z" />
            </svg>
          </BaseTooltip.Arrow>
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

export const Tooltip = Object.assign(TooltipRoot, {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
})
