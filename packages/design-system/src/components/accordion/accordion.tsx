import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ReactNode } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { accordionStyles } from './accordion.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>

export type AccordionValue = string | number

export interface AccordionRootProps extends Omit<
  WithoutStyles<BaseAccordion.Root.Props<AccordionValue>>,
  'orientation'
> {
  /** Accordion items and their panels. */
  children?: ReactNode
  /** Values expanded when the accordion is uncontrolled. */
  defaultValue?: AccordionValue[]
  /** Values expanded when the accordion is controlled. */
  value?: AccordionValue[]
  /** Runs when expanded values change. */
  onValueChange?: BaseAccordion.Root.Props<AccordionValue>['onValueChange']
  /** Allows more than one panel to remain expanded. */
  multiple?: boolean
  /** Disables every accordion item. */
  disabled?: boolean
}

export interface AccordionItemProps extends WithoutStyles<BaseAccordion.Item.Props> {
  /** Identifies the item for controlled and initial state. */
  value: AccordionValue
  /** Disables this accordion item. */
  disabled?: boolean
}

export interface AccordionHeaderProps extends WithoutStyles<BaseAccordion.Header.Props> {
  /** Composes the heading behavior and styles onto another heading element. */
  render?: BaseAccordion.Header.Props['render']
}

export interface AccordionTriggerProps extends Omit<
  WithoutStyles<BaseAccordion.Trigger.Props>,
  'children'
> {
  /** Visible heading text. */
  children: ReactNode
  /** Optional content aligned opposite the heading. */
  suffix?: ReactNode
  /** Composes trigger behavior and styles onto another button component. */
  render?: BaseAccordion.Trigger.Props['render']
}

export interface AccordionPanelProps extends WithoutStyles<BaseAccordion.Panel.Props> {
  /** Panel content. */
  children?: ReactNode
  /** Keeps the panel mounted while collapsed. */
  keepMounted?: BaseAccordion.Panel.Props['keepMounted']
  /** Allows browser find-in-page to reveal collapsed panel content. */
  hiddenUntilFound?: BaseAccordion.Panel.Props['hiddenUntilFound']
}

const AccordionRoot = forwardRef<HTMLDivElement, AccordionRootProps>(function AccordionRoot(
  { multiple = false, disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseAccordion.Root.State>(() => [accordionStyles.root])
  return (
    <BaseAccordion.Root
      {...props}
      ref={forwardedRef}
      multiple={multiple}
      disabled={disabled}
      {...stateStyles}
    />
  )
})

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseAccordion.Item.State>(() => [accordionStyles.item])
  return <BaseAccordion.Item {...props} ref={forwardedRef} disabled={disabled} {...stateStyles} />
})

const AccordionHeader = forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  function AccordionHeader(props, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseAccordion.Header.State>(() => [
      accordionStyles.header,
    ])
    return <BaseAccordion.Header {...props} ref={forwardedRef} {...stateStyles} />
  },
)

const AccordionTrigger = forwardRef<HTMLElement, AccordionTriggerProps>(function AccordionTrigger(
  { children, suffix, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseAccordion.Trigger.State>((state) => [
    accordionStyles.trigger,
    state.open === true && accordionStyles.triggerOpen,
    state.disabled === true && accordionStyles.triggerDisabled,
  ])

  return (
    <BaseAccordion.Trigger {...props} ref={forwardedRef} {...stateStyles}>
      <span {...stylex.props(accordionStyles.leading)}>
        <span {...stylex.props(accordionStyles.label)}>{children}</span>
        <svg aria-hidden="true" viewBox="0 0 14 14" {...stylex.props(accordionStyles.indicator)}>
          <path d="m5 3 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      {suffix === undefined ? null : (
        <span {...stylex.props(accordionStyles.suffix)}>{suffix}</span>
      )}
    </BaseAccordion.Trigger>
  )
})

const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(
  function AccordionPanel(props, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseAccordion.Panel.State>((state) => [
      accordionStyles.panel,
      (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') &&
        accordionStyles.panelTransitioning,
    ])
    return <BaseAccordion.Panel {...props} ref={forwardedRef} {...stateStyles} />
  },
)

export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Header: AccordionHeader,
  Item: AccordionItem,
  Panel: AccordionPanel,
  Trigger: AccordionTrigger,
})
