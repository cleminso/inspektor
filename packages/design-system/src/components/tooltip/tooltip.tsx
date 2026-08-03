import { useDirection } from '@base-ui/react/direction-provider'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import * as stylex from '@stylexjs/stylex'
import React, { type PropsWithChildren } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { popupPositioning } from '../../primitives/popupPositioning'
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
  /** Whether the tooltip is initially open. */
  defaultOpen?: BaseTooltip.Root.Props['defaultOpen']
  /** Whether the tooltip is currently open. */
  open?: BaseTooltip.Root.Props['open']
  /** Runs when the tooltip opens or closes. */
  onOpenChange?: BaseTooltip.Root.Props['onOpenChange']
  /** Runs after opening or closing animations complete. */
  onOpenChangeComplete?: BaseTooltip.Root.Props['onOpenChangeComplete']
  /** Allows the tooltip to close while the pointer moves over its popup. */
  disableHoverablePopup?: BaseTooltip.Root.Props['disableHoverablePopup']
  /** Selects which cursor axis the popup follows. */
  trackCursorAxis?: BaseTooltip.Root.Props['trackCursorAxis']
  /** Provides imperative tooltip actions. */
  actionsRef?: BaseTooltip.Root.Props['actionsRef']
  /** Prevents the tooltip from opening. */
  disabled?: BaseTooltip.Root.Props['disabled']
}>

export interface TooltipTriggerProps extends Omit<
  BaseTooltip.Trigger.Props,
  'className' | 'style' | 'handle' | 'payload' | 'ref'
> {
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

const TooltipTrigger = React.forwardRef<React.ComponentRef<typeof BaseTooltip.Trigger>, TooltipTriggerProps>(
  function TooltipTrigger({ closeOnClick = true, disabled = false, render, ...props }, ref) {
    const stateStyleProps = createStateStyleProps<BaseTooltip.Trigger.State>(() => [
      render === undefined && tooltipStyles.trigger,
    ])
    return (
      <BaseTooltip.Trigger
        {...props}
        ref={ref as BaseTooltip.Trigger.Props['ref']}
        closeOnClick={closeOnClick}
        disabled={disabled}
        render={render}
        {...stateStyleProps}
        data-slot="tooltip-trigger"
      />
    )
  },
)

const arrowSideStyles = {
  top: tooltipStyles.arrowTop,
  bottom: tooltipStyles.arrowBottom,
  left: tooltipStyles.arrowLeft,
  right: tooltipStyles.arrowRight,
} satisfies Record<'top' | 'bottom' | 'left' | 'right', unknown>

function getArrowSideStyle(
  side: NonNullable<BaseTooltip.Positioner.Props['side']>,
  direction: 'ltr' | 'rtl',
) {
  if (side === 'inline-start') {
    return direction === 'rtl' ? tooltipStyles.arrowRight : tooltipStyles.arrowLeft
  }
  if (side === 'inline-end') {
    return direction === 'rtl' ? tooltipStyles.arrowLeft : tooltipStyles.arrowRight
  }
  return arrowSideStyles[side]
}

function TooltipContent({ side = 'top', align = 'center', children }: TooltipContentProps) {
  const direction = useDirection()
  const positionerStyleProps = createStateStyleProps<BaseTooltip.Positioner.State>(() => [
    tooltipStyles.positioner,
  ])
  const popupStyleProps = createStateStyleProps<BaseTooltip.Popup.State>((state) => [
    tooltipStyles.popup,
    state.instant === undefined &&
      (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') &&
      tooltipStyles.popupTransition,
  ])
  const arrowStyleProps = createStateStyleProps<BaseTooltip.Arrow.State>((state) => [
    tooltipStyles.arrow,
    getArrowSideStyle(state.side, direction),
  ])
  const arrowIconStyleProps = stylex.props(tooltipStyles.arrowIcon)

  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        align={align}
        sideOffset={popupPositioning.tooltipSideOffset}
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
