import * as React from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import * as stylex from '@stylexjs/stylex'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { popupPositioning } from '../../primitives/popupPositioning'
import type { FormControlSize } from '../../utils/formControlSize'
import { selectStyles } from './select.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>

export type SelectTriggerSize = FormControlSize
export type SelectItemSize = 's' | 'm' | 'l'
export type SelectWidth = 'compact' | 'content' | 'full'

const sizeStyles = {
  s: selectStyles.sizeS,
  m: selectStyles.sizeM,
  l: selectStyles.sizeL,
} satisfies Record<SelectTriggerSize, unknown>

export type SelectRootProps<Value> = Omit<
  BaseSelect.Root.Props<Value, false>,
  'className' | 'style' | 'multiple'
> & {
  /** Items used to resolve selected value labels. */
  items?: BaseSelect.Root.Props<Value, false>['items']
  /** The selected value. */
  value?: Value | null
  /** The initially selected value. */
  defaultValue?: Value | null
  /** Runs when the selected value changes. */
  onValueChange?: BaseSelect.Root.Props<Value, false>['onValueChange']
  /** Disables the select. */
  disabled?: boolean
}

export type SelectLabelProps = WithoutStyles<BaseSelect.Label.Props>

export interface SelectTriggerProps extends Omit<
  WithoutStyles<BaseSelect.Trigger.Props>,
  'nativeButton' | 'prefix' | 'size'
> {
  /** Controls the trigger height and padding. */
  size?: SelectTriggerSize
  /** Controls whether the trigger uses an intrinsic, compact fixed, or container-filling width. */
  width?: SelectWidth
  /** Content displayed before the selected value. */
  prefix?: React.ReactNode
  /** Content displayed after the selected value and before the chevron. */
  suffix?: React.ReactNode
  /** Stretches the trigger to the width of its container. @deprecated Use `width="full"`. */
  fullWidth?: boolean
  /** Disables the trigger. */
  disabled?: boolean
  /** Indicates whether the rendered trigger is a native button. */
  nativeButton?: BaseSelect.Trigger.Props['nativeButton']
  /** Composes trigger behavior onto a compatible element. */
  render?: BaseSelect.Trigger.Props['render']
}

export type SelectValueProps = WithoutStyles<BaseSelect.Value.Props>
export type SelectIconProps = Omit<WithoutStyles<BaseSelect.Icon.Props>, 'children'>
export type SelectPortalProps = WithoutStyles<BaseSelect.Portal.Props>

export type SelectPositionerProps = Pick<
  WithoutStyles<BaseSelect.Positioner.Props>,
  'align' | 'alignItemWithTrigger' | 'children' | 'ref' | 'side'
>

export type SelectPopupProps = WithoutStyles<BaseSelect.Popup.Props>
export type SelectListProps = WithoutStyles<BaseSelect.List.Props>

export interface SelectContentProps {
  /** Select options, groups, and separators rendered in the popup. */
  children?: React.ReactNode
  /** Places the popup on this side of the trigger. */
  side?: BaseSelect.Positioner.Props['side']
  /** Aligns the popup along the trigger. */
  align?: BaseSelect.Positioner.Props['align']
  /** Aligns the selected item text with the trigger value. */
  alignItemWithTrigger?: BaseSelect.Positioner.Props['alignItemWithTrigger']
}

export type SelectItemProps<Value> = Omit<
  WithoutStyles<BaseSelect.Item.Props>,
  'nativeButton' | 'value'
> & {
  /** The value represented by this option. */
  value: Value
  /** Controls the option minimum height. */
  size?: SelectItemSize
  /** Disables the option. */
  disabled?: BaseSelect.Item.Props['disabled']
  /** Indicates whether the rendered option is a native button. */
  nativeButton?: BaseSelect.Item.Props['nativeButton']
  /** Composes option behavior onto a compatible element. */
  render?: BaseSelect.Item.Props['render']
}

export type SelectItemTextProps = WithoutStyles<BaseSelect.ItemText.Props>
export type SelectGroupProps = WithoutStyles<BaseSelect.Group.Props>
export type SelectGroupLabelProps = WithoutStyles<BaseSelect.GroupLabel.Props>
export type SelectSeparatorProps = WithoutStyles<BaseSelect.Separator.Props>

export interface SelectItemIndicatorProps extends Omit<
  WithoutStyles<BaseSelect.ItemIndicator.Props>,
  'children'
> {
  /** Keeps the indicator mounted while the item is not selected. */
  keepMounted?: boolean
}

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

const widthStyles = {
  compact: selectStyles.triggerWidthCompact,
  content: selectStyles.triggerWidthContent,
  full: selectStyles.triggerWidthFull,
} satisfies Record<SelectWidth, unknown>

function hasChild(children: React.ReactNode, component: React.ElementType): boolean {
  return React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === component ||
        (child.type === React.Fragment &&
          hasChild((child.props as { children?: React.ReactNode }).children, component))),
  )
}

const SelectTrigger = React.forwardRef<React.ComponentRef<typeof BaseSelect.Trigger>, SelectTriggerProps>(
  function SelectTrigger(
    {
      size = 'm',
      width = 'content',
      prefix,
      suffix,
      fullWidth = false,
      disabled = false,
      nativeButton = true,
      render,
      children,
      ...props
    },
    ref,
  ) {
    const resolvedWidth = fullWidth === true ? 'full' : width
    const stateStyles = createStateStyleProps<BaseSelect.Trigger.State>((state) => [
      selectStyles.trigger,
      sizeStyles[size],
      widthStyles[resolvedWidth],
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
    const adornmentStyles = stylex.props(selectStyles.adornment)
    const hasIcon = hasChild(children, SelectIcon)

    return (
      <BaseSelect.Trigger
        {...props}
        ref={ref}
        disabled={disabled}
        nativeButton={nativeButton}
        render={render}
        {...stateStyles}
        data-size={size}
        data-slot="select-trigger"
        data-width={resolvedWidth}
      >
        {prefix != null && (
          <span {...adornmentStyles} data-slot="select-prefix">
            {prefix}
          </span>
        )}
        {children}
        {suffix != null && (
          <span {...adornmentStyles} data-slot="select-suffix">
            {suffix}
          </span>
        )}
        {hasIcon === false && <SelectIcon />}
      </BaseSelect.Trigger>
    )
  },
)

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  function SelectValue(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Value.State>((state) => [
      state.placeholder === true && selectStyles.valuePlaceholder,
    ])
    return <BaseSelect.Value {...props} ref={ref} {...stateStyles} />
  },
)

const SelectIcon = React.forwardRef<HTMLSpanElement, SelectIconProps>(
  function SelectIcon(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Icon.State>((state) => [
      selectStyles.iconContainer,
      state.open === true && selectStyles.iconOpen,
    ])
    const iconStyles = stylex.props(selectStyles.icon)
    return (
      <BaseSelect.Icon {...props} ref={ref} {...stateStyles} data-slot="select-icon">
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
          <path d="M4.5 6h7L8 10z" />
        </svg>
      </BaseSelect.Icon>
    )
  },
)

const SelectPortal = React.forwardRef<HTMLDivElement, SelectPortalProps>(
  function SelectPortal(props, ref) {
    return <BaseSelect.Portal {...props} ref={ref} />
  },
)

const SelectPositioner = React.forwardRef<HTMLDivElement, SelectPositionerProps>(
  function SelectPositioner(
    { align = 'start', alignItemWithTrigger = false, side = 'bottom', ...props },
    ref,
  ) {
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
        sideOffset={popupPositioning.dropdownSideOffset}
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        side={side}
        {...stateStyles}
      />
    )
  },
)

const SelectPopup = React.forwardRef<HTMLDivElement, SelectPopupProps>(
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

const SelectList = React.forwardRef<HTMLDivElement, SelectListProps>(
  function SelectList(props, ref) {
    const styles = stylex.props(selectStyles.list, scrollbarStyles.standard)
    return <BaseSelect.List {...props} ref={ref} {...styles} data-scrollbar="standard" />
  },
)

function SelectContent({
  children,
  side = 'bottom',
  align = 'start',
  alignItemWithTrigger = false,
}: SelectContentProps) {
  return (
    <SelectPortal>
      <SelectPositioner side={side} align={align} alignItemWithTrigger={alignItemWithTrigger}>
        <SelectPopup>
          <SelectList>{children}</SelectList>
        </SelectPopup>
      </SelectPositioner>
    </SelectPortal>
  )
}

const itemSizeStyles = {
  s: selectStyles.itemSizeS,
  m: selectStyles.itemSizeM,
  l: selectStyles.itemSizeL,
} satisfies Record<SelectItemSize, unknown>

function SelectItemInner<Value>(
  {
    value,
    size = 's',
    disabled = false,
    nativeButton = false,
    render,
    children,
    ...props
  }: SelectItemProps<Value>,
  ref: React.ForwardedRef<React.ComponentRef<typeof BaseSelect.Item>>,
) {
  const stateStyles = createStateStyleProps<BaseSelect.Item.State>((state) => [
    selectStyles.item,
    itemSizeStyles[size],
    state.selected === true && selectStyles.itemSelected,
    state.highlighted === true && selectStyles.itemHighlighted,
    state.disabled === true && selectStyles.itemDisabled,
  ])
  const hasText = hasChild(children, SelectItemText)
  const hasIndicator = hasChild(children, SelectItemIndicator)

  return (
    <BaseSelect.Item
      {...props}
      ref={ref}
      value={value}
      disabled={disabled}
      nativeButton={nativeButton}
      render={render}
      {...stateStyles}
      data-size={size}
    >
      {hasIndicator === false && <SelectItemIndicator />}
      {hasText === true ? children : <SelectItemText>{children}</SelectItemText>}
    </BaseSelect.Item>
  )
}

const SelectItem = React.forwardRef(SelectItemInner) as <Value>(
  props: Omit<SelectItemProps<Value>, 'ref'> &
    React.RefAttributes<React.ComponentRef<typeof BaseSelect.Item>>,
) => React.ReactElement | null

const SelectItemText = React.forwardRef<HTMLDivElement, SelectItemTextProps>(
  function SelectItemText(props, ref) {
    const styles = stylex.props(selectStyles.itemText)
    return <BaseSelect.ItemText {...props} ref={ref} {...styles} data-slot="select-item-text" />
  },
)

const SelectItemIndicator = React.forwardRef<HTMLSpanElement, SelectItemIndicatorProps>(
  function SelectItemIndicator({ keepMounted = false, ...props }, ref) {
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
        keepMounted={keepMounted}
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

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
  function SelectGroup(props, ref) {
    return <BaseSelect.Group {...props} ref={ref} {...stylex.props(selectStyles.group)} data-slot="select-group" />
  },
)

const SelectGroupLabel = React.forwardRef<HTMLDivElement, SelectGroupLabelProps>(
  function SelectGroupLabel(props, ref) {
    const styles = stylex.props(selectStyles.groupLabel)
    return <BaseSelect.GroupLabel {...props} ref={ref} {...styles} data-slot="select-group-label" />
  },
)

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  function SelectSeparator(props, ref) {
    const stateStyles = createStateStyleProps<BaseSelect.Separator.State>((state) => [
      selectStyles.separator,
      state.orientation === 'horizontal' && selectStyles.separatorHorizontal,
      state.orientation === 'vertical' && selectStyles.separatorVertical,
    ])
    return <BaseSelect.Separator {...props} ref={ref} {...stateStyles} />
  },
)

export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Label: SelectLabel,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Icon: SelectIcon,
  Portal: SelectPortal,
  Positioner: SelectPositioner,
  Popup: SelectPopup,
  List: SelectList,
  Content: SelectContent,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Group: SelectGroup,
  GroupLabel: SelectGroupLabel,
  Separator: SelectSeparator,
})
