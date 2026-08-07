import * as React from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import * as stylex from '@stylexjs/stylex'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { popupPositioning } from '../../primitives/popupPositioning'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import type { FormControlSize } from '../../utils/formControlSize'
import { selectStyles } from './select.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>

export type SelectTriggerSize = FormControlSize
export type SelectWidth = 'compact' | 'content' | 'full'

export type SelectRootProps<Value> = Omit<
  BaseSelect.Root.Props<Value, false>,
  'defaultValue' | 'disabled' | 'items' | 'multiple' | 'onValueChange' | 'value'
> & {
  /** Items used to resolve selected value labels. */
  items?: BaseSelect.Root.Props<Value, false>['items']
  /** The selected value. */
  value?: Value | null
  /** The initially selected value. */
  defaultValue?: Value | null
  /** Runs when the selected value changes. */
  onValueChange?: BaseSelect.Root.Props<Value, false>['onValueChange']
  /** Disables the Select. */
  disabled?: boolean
}
export type SelectLabelProps = WithoutStyles<BaseSelect.Label.Props>

export interface SelectTriggerProps
  extends Omit<
    WithoutStyles<BaseSelect.Trigger.Props>,
    'children' | 'disabled' | 'nativeButton' | 'prefix' | 'size'
  > {
  /** Text displayed when the Select has no value. */
  placeholder?: string
  /** Controls the trigger height and padding. */
  size?: SelectTriggerSize
  /** Controls whether the trigger follows the selected value, reserves a stable compact width, or fills its container. */
  width?: SelectWidth
}

export interface SelectContentProps {
  /** Select items rendered in the popup. */
  children?: React.ReactNode
}

export interface SelectItemProps<Value> {
  /** Text displayed for this option. */
  children: string
  /** The value represented by this option. */
  value: Value
  /** Disables the option. */
  disabled?: BaseSelect.Item.Props['disabled']
  /** Text used to match the option during keyboard navigation. */
  label?: BaseSelect.Item.Props['label']
}

const sizeStyles = {
  s: selectStyles.sizeS,
  m: selectStyles.sizeM,
  l: selectStyles.sizeL,
} satisfies Record<SelectTriggerSize, unknown>

const widthStyles = {
  compact: selectStyles.triggerWidthCompact,
  content: selectStyles.triggerWidthContent,
  full: selectStyles.triggerWidthFull,
} satisfies Record<SelectWidth, unknown>

function SelectRoot<Value>({ disabled = false, ...props }: SelectRootProps<Value>) {
  return <BaseSelect.Root {...props} disabled={disabled} />
}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  function SelectLabel(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Label.State>((state) => [
      selectStyles.label,
      state.disabled === true && selectStyles.labelDisabled,
      state.valid === true && selectStyles.labelValid,
      state.valid === false && selectStyles.labelInvalid,
      state.touched === true && selectStyles.labelTouched,
      state.dirty === true && selectStyles.labelDirty,
      state.filled === true && selectStyles.labelFilled,
      state.focused === true && selectStyles.labelFocused,
    ])
    return <BaseSelect.Label {...props} ref={ref} {...stateStyles} />
  },
)

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger(
  { placeholder, size = 'm', width = 'content', ...props }: SelectTriggerProps,
  ref,
) {
  const stateStyles = createStateStyleProps<BaseSelect.Trigger.State>((state) => [
    selectStyles.trigger,
    sizeStyles[size],
    widthStyles[width],
    state.open === true && selectStyles.triggerOpen,
    state.open === true && selectStyles.triggerPressed,
    state.valid === false && selectStyles.triggerInvalid,
    state.disabled === true && selectStyles.disabled,
    state.readOnly === true && selectStyles.triggerReadOnly,
    state.valid === true && selectStyles.triggerValid,
    state.touched === true && selectStyles.triggerTouched,
    state.dirty === true && selectStyles.triggerDirty,
    state.filled === true && selectStyles.triggerFilled,
    state.focused === true && selectStyles.triggerFocused,
    state.placeholder === true && selectStyles.triggerPlaceholder,
    state.popupSide === 'top' && selectStyles.triggerSideTop,
    state.popupSide === 'bottom' && selectStyles.triggerSideBottom,
    state.popupSide === 'left' && selectStyles.triggerSideLeft,
    state.popupSide === 'right' && selectStyles.triggerSideRight,
    state.popupSide === 'inline-start' && selectStyles.triggerSideInlineStart,
    state.popupSide === 'inline-end' && selectStyles.triggerSideInlineEnd,
  ])

  return (
    <BaseSelect.Trigger
      {...props}
      ref={ref}
      nativeButton
      {...stateStyles}
      data-size={size}
      data-slot="select-trigger"
      data-width={width}
    >
      <SelectValue placeholder={placeholder} />
      <SelectIcon />
    </BaseSelect.Trigger>
  )
})

const SelectValue = React.forwardRef<HTMLSpanElement, BaseSelect.Value.Props>(
  function SelectValue(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Value.State>((state) => [
      state.placeholder === true && selectStyles.valuePlaceholder,
    ])
    return <BaseSelect.Value {...props} ref={ref} {...stateStyles} />
  },
)

const SelectIcon = React.forwardRef<HTMLSpanElement, BaseSelect.Icon.Props>(
  function SelectIcon(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Icon.State>((state) => [
      selectStyles.iconContainer,
      state.open === true && selectStyles.iconOpen,
    ])
    const iconStyles = stylex.props(selectStyles.icon)
    return (
      <BaseSelect.Icon {...props} ref={ref} {...stateStyles} data-slot="select-icon">
        <svg
          aria-hidden="true"
          data-slot="select-chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          {...iconStyles}
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </BaseSelect.Icon>
    )
  },
)

const SelectPositioner = React.forwardRef<
  HTMLDivElement,
  Pick<BaseSelect.Positioner.Props, 'children'>
>(function SelectPositioner(props, ref) {
  const stateStyles = createStateStyleProps<BaseSelect.Positioner.State>((state) => [
    selectStyles.positioner,
    state.open === true && selectStyles.positionerOpen,
    state.open === false && selectStyles.positionerClosed,
    state.side === 'none' && selectStyles.positionerSideNone,
    state.side === 'top' && selectStyles.positionerSideTop,
    state.side === 'bottom' && selectStyles.positionerSideBottom,
    state.side === 'left' && selectStyles.positionerSideLeft,
    state.side === 'right' && selectStyles.positionerSideRight,
    state.side === 'inline-start' && selectStyles.positionerSideInlineStart,
    state.side === 'inline-end' && selectStyles.positionerSideInlineEnd,
    state.align === 'start' && selectStyles.positionerAlignStart,
    state.align === 'center' && selectStyles.positionerAlignCenter,
    state.align === 'end' && selectStyles.positionerAlignEnd,
    state.anchorHidden === true && selectStyles.positionerAnchorHidden,
  ])
  return (
    <BaseSelect.Positioner
      {...props}
      ref={ref}
      align="start"
      alignItemWithTrigger={false}
      side="bottom"
      sideOffset={popupPositioning.dropdownSideOffset}
      {...stateStyles}
    />
  )
})

const SelectPopup = React.forwardRef<HTMLDivElement, Pick<BaseSelect.Popup.Props, 'children'>>(
  function SelectPopup(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Popup.State>((state) => [
      selectStyles.popup,
      (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') &&
        selectStyles.popupTransition,
      state.open === true && selectStyles.popupOpen,
      state.open === false && selectStyles.popupClosed,
      state.transitionStatus === 'starting' && selectStyles.popupStarting,
      state.transitionStatus === 'ending' && selectStyles.popupEnding,
      state.side === 'none' && selectStyles.popupSideNone,
      state.side === 'top' && selectStyles.popupSideTop,
      state.side === 'bottom' && selectStyles.popupSideBottom,
      state.side === 'left' && selectStyles.popupSideLeft,
      state.side === 'right' && selectStyles.popupSideRight,
      state.side === 'inline-start' && selectStyles.popupSideInlineStart,
      state.side === 'inline-end' && selectStyles.popupSideInlineEnd,
      state.align === 'start' && selectStyles.popupAlignStart,
      state.align === 'center' && selectStyles.popupAlignCenter,
      state.align === 'end' && selectStyles.popupAlignEnd,
    ])
    return <BaseSelect.Popup {...props} ref={ref} {...stateStyles} />
  },
)

const SelectList = React.forwardRef<HTMLDivElement, Pick<BaseSelect.List.Props, 'children'>>(
  function SelectList(props, ref) {
    const styles = stylex.props(selectStyles.list, scrollbarStyles.standard)
    return <BaseSelect.List {...props} ref={ref} {...styles} data-scrollbar="standard" />
  },
)

function SelectContent({ children }: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <SelectPositioner>
        <SelectPopup>
          <SelectList>{children}</SelectList>
        </SelectPopup>
      </SelectPositioner>
    </BaseSelect.Portal>
  )
}

function SelectItemInner<Value>(
  { value, disabled = false, label, children }: SelectItemProps<Value>,
  ref: React.ForwardedRef<React.ComponentRef<typeof BaseSelect.Item>>,
) {
  const stateStyles = createStateStyleProps<BaseSelect.Item.State>((state) => [
    selectStyles.item,
    selectStyles.itemSizeS,
    state.selected === true && selectStyles.itemSelected,
    state.highlighted === true && selectStyles.itemHighlighted,
    state.disabled === true && selectStyles.itemDisabled,
  ])

  return (
    <BaseSelect.Item
      ref={ref}
      value={value}
      disabled={disabled}
      label={label}
      nativeButton={false}
      {...stateStyles}
      data-size="s"
    >
      <SelectItemText>{children}</SelectItemText>
      <SelectItemIndicator />
    </BaseSelect.Item>
  )
}

const SelectItem = React.forwardRef(SelectItemInner) as <Value>(
  props: Omit<SelectItemProps<Value>, 'ref'> &
    React.RefAttributes<React.ComponentRef<typeof BaseSelect.Item>>,
) => React.ReactElement | null

const SelectItemText = React.forwardRef<HTMLDivElement, BaseSelect.ItemText.Props>(
  function SelectItemText(props, ref) {
    const styles = stylex.props(selectStyles.itemText)
    return <BaseSelect.ItemText {...props} ref={ref} {...styles} data-slot="select-item-text" />
  },
)

const SelectItemIndicator = React.forwardRef<HTMLSpanElement, BaseSelect.ItemIndicator.Props>(
  function SelectItemIndicator(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.ItemIndicator.State>((state) => [
      selectStyles.indicator,
      state.selected === true && selectStyles.indicatorSelected,
      state.transitionStatus === 'starting' && selectStyles.indicatorStarting,
      state.transitionStatus === 'ending' && selectStyles.indicatorEnding,
    ])
    const iconStyles = stylex.props(selectStyles.icon)
    return (
      <BaseSelect.ItemIndicator
        {...props}
        ref={ref}
        keepMounted={false}
        {...stateStyles}
        data-slot="select-item-indicator"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          {...iconStyles}
        >
          <path d="m3 8 3 3 7-7" />
        </svg>
      </BaseSelect.ItemIndicator>
    )
  },
)

export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Label: SelectLabel,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
})
