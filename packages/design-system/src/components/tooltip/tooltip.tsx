import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
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
  /** Prevents the pointer from keeping the tooltip open through its popup. */
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
  disableHoverablePopup = true,
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
  function TooltipTrigger(
    { delay = 600, closeOnClick = true, closeDelay = 0, disabled, render, ...props },
    ref,
  ) {
    const stateStyleProps =
      render === undefined
        ? createStateStyleProps<BaseTooltip.Trigger.State>((state) => [
            tooltipStyles.trigger,
            state.open === true && tooltipStyles.triggerOpen,
          ])
        : undefined
    return (
      <BaseTooltip.Trigger
        {...props}
        ref={ref as BaseTooltip.Trigger.Props['ref']}
        delay={delay}
        closeOnClick={closeOnClick}
        closeDelay={closeDelay}
        disabled={disabled}
        render={render}
        {...stateStyleProps}
        data-slot="tooltip-trigger"
      />
    )
  },
)

function TooltipContent({ side = 'top', align = 'center', children }: TooltipContentProps) {
  const positionerStyleProps = createStateStyleProps<BaseTooltip.Positioner.State>((state) => [
    tooltipStyles.positioner,
    state.open === true && tooltipStyles.positionerOpen,
    state.open === false && tooltipStyles.positionerClosed,
    state.anchorHidden === true && tooltipStyles.positionerAnchorHidden,
    state.instant !== undefined && tooltipStyles.positionerInstant,
    state.side === 'top' && tooltipStyles.positionerSideTop,
    state.side === 'bottom' && tooltipStyles.positionerSideBottom,
    state.side === 'left' && tooltipStyles.positionerSideLeft,
    state.side === 'right' && tooltipStyles.positionerSideRight,
    state.side === 'inline-start' && tooltipStyles.positionerSideInlineStart,
    state.side === 'inline-end' && tooltipStyles.positionerSideInlineEnd,
    state.align === 'start' && tooltipStyles.positionerAlignStart,
    state.align === 'center' && tooltipStyles.positionerAlignCenter,
    state.align === 'end' && tooltipStyles.positionerAlignEnd,
  ])
  const popupStyleProps = createStateStyleProps<BaseTooltip.Popup.State>((state) => [
    tooltipStyles.popup,
    state.instant === undefined &&
      state.transitionStatus === 'starting' &&
      tooltipStyles.popupTransition,
    state.open === true && tooltipStyles.popupOpen,
    state.open === false && tooltipStyles.popupClosed,
    state.transitionStatus === 'starting' && tooltipStyles.popupStarting,
    state.transitionStatus === 'ending' && tooltipStyles.popupEnding,
    state.instant !== undefined && tooltipStyles.popupInstant,
    state.side === 'top' && tooltipStyles.popupSideTop,
    state.side === 'bottom' && tooltipStyles.popupSideBottom,
    state.side === 'left' && tooltipStyles.popupSideLeft,
    state.side === 'right' && tooltipStyles.popupSideRight,
    state.side === 'inline-start' && tooltipStyles.popupSideInlineStart,
    state.side === 'inline-end' && tooltipStyles.popupSideInlineEnd,
    state.align === 'start' && tooltipStyles.popupAlignStart,
    state.align === 'center' && tooltipStyles.popupAlignCenter,
    state.align === 'end' && tooltipStyles.popupAlignEnd,
  ])
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
