import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import * as stylex from "@stylexjs/stylex";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { selectStyles } from "./select.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style" | "render">;

export type SelectSize = "s" | "m" | "l";
export type SelectWidth = "content" | "full";

const sizeStyles = {
  s: selectStyles.sizeS,
  m: selectStyles.sizeM,
  l: selectStyles.sizeL,
} satisfies Record<SelectSize, unknown>;

export type SelectRootProps<Value> = Omit<
  BaseSelect.Root.Props<Value, false>,
  "className" | "style" | "multiple"
> & {
  /** Items used to resolve selected value labels. */
  items?: BaseSelect.Root.Props<Value, false>["items"];
  /** The selected value. */
  value?: Value | null;
  /** The initially selected value. */
  defaultValue?: Value | null;
  /** Runs when the selected value changes. */
  onValueChange?: BaseSelect.Root.Props<Value, false>["onValueChange"];
  /** Disables the select. */
  disabled?: boolean;
};

export type SelectLabelProps = WithoutStyles<BaseSelect.Label.Props>;

export interface SelectTriggerProps
  extends Omit<WithoutStyles<BaseSelect.Trigger.Props>, "prefix" | "size"> {
  /** Controls the trigger height and padding. */
  size?: SelectSize;
  /** Controls whether the trigger follows its content or fills its container. */
  width?: SelectWidth;
  /** Content displayed before the selected value. */
  prefix?: React.ReactNode;
  /** Content displayed after the selected value and before the chevron. */
  suffix?: React.ReactNode;
  /** Stretches the trigger to the width of its container. @deprecated Use `width="full"`. */
  fullWidth?: boolean;
  /** Disables the trigger. */
  disabled?: boolean;
}

export type SelectValueProps = WithoutStyles<BaseSelect.Value.Props>;
export type SelectIconProps = Omit<WithoutStyles<BaseSelect.Icon.Props>, "children">;
export type SelectPortalProps = WithoutStyles<BaseSelect.Portal.Props>;

export interface SelectPositionerProps extends WithoutStyles<BaseSelect.Positioner.Props> {
  /** Sets the gap between the trigger and popup. */
  sideOffset?: BaseSelect.Positioner.Props["sideOffset"];
  /** Aligns the popup along the trigger. */
  align?: BaseSelect.Positioner.Props["align"];
  /** Aligns the selected item text with the trigger value. */
  alignItemWithTrigger?: boolean;
}

export type SelectPopupProps = WithoutStyles<BaseSelect.Popup.Props>;
export type SelectListProps = WithoutStyles<BaseSelect.List.Props>;

export interface SelectContentProps {
  /** Select options, groups, and separators rendered in the popup. */
  children?: React.ReactNode;
  /** Places the popup on this side of the trigger. */
  side?: BaseSelect.Positioner.Props["side"];
  /** Sets the gap between the trigger and popup. */
  sideOffset?: BaseSelect.Positioner.Props["sideOffset"];
  /** Aligns the popup along the trigger. */
  align?: BaseSelect.Positioner.Props["align"];
  /** Offsets the popup along its alignment axis. */
  alignOffset?: BaseSelect.Positioner.Props["alignOffset"];
  /** Aligns the selected item text with the trigger value. */
  alignItemWithTrigger?: BaseSelect.Positioner.Props["alignItemWithTrigger"];
}

export type SelectItemProps<Value> = Omit<WithoutStyles<BaseSelect.Item.Props>, "value"> & {
  /** The value represented by this option. */
  value: Value;
  /** Controls the option height and horizontal padding. */
  size?: SelectSize;
  /** Disables the option. */
  disabled?: BaseSelect.Item.Props["disabled"];
};

export type SelectItemTextProps = WithoutStyles<BaseSelect.ItemText.Props>;
export type SelectGroupProps = WithoutStyles<BaseSelect.Group.Props>;
export type SelectGroupLabelProps = WithoutStyles<BaseSelect.GroupLabel.Props>;
export type SelectSeparatorProps = WithoutStyles<BaseSelect.Separator.Props>;

export interface SelectItemIndicatorProps
  extends Omit<WithoutStyles<BaseSelect.ItemIndicator.Props>, "children"> {
  /** Keeps the indicator mounted while the item is not selected. */
  keepMounted?: boolean;
}

function SelectRoot<Value>({ disabled = false, ...props }: SelectRootProps<Value>) {
  return <BaseSelect.Root {...props} disabled={disabled} />;
}

function SelectLabel(props: SelectLabelProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Label.State>((state) => [
    selectStyles.label,
    state.disabled === true && selectStyles.labelDisabled,
  ]);
  return <BaseSelect.Label {...props} {...stateStyles} />;
}

const widthStyles = {
  content: selectStyles.triggerWidthContent,
  full: selectStyles.triggerWidthFull,
} satisfies Record<SelectWidth, unknown>;

function hasChild(children: React.ReactNode, component: React.ElementType): boolean {
  return React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === component ||
        (child.type === React.Fragment &&
          hasChild((child.props as { children?: React.ReactNode }).children, component))),
  );
}

function SelectTrigger({
  size = "m",
  width = "content",
  prefix,
  suffix,
  fullWidth = false,
  disabled = false,
  children,
  ...props
}: SelectTriggerProps) {
  const resolvedWidth = fullWidth === true ? "full" : width;
  const stateStyles = createStateStyleProps<BaseSelect.Trigger.State>((state) => [
    selectStyles.trigger,
    sizeStyles[size],
    widthStyles[resolvedWidth],
    state.open === true && selectStyles.triggerOpen,
    state.valid === false && selectStyles.triggerInvalid,
    state.disabled === true && selectStyles.disabled,
  ]);
  const adornmentStyles = stylex.props(selectStyles.adornment);
  const hasIcon = hasChild(children, SelectIcon);

  return (
    <BaseSelect.Trigger
      {...props}
      disabled={disabled}
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
  );
}

function SelectValue(props: SelectValueProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Value.State>((state) => [
    state.placeholder === true && selectStyles.valuePlaceholder,
  ]);
  return <BaseSelect.Value {...props} {...stateStyles} />;
}

function SelectIcon(props: SelectIconProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Icon.State>(() => [selectStyles.iconContainer]);
  const iconStyles = stylex.props(selectStyles.icon);
  return (
    <BaseSelect.Icon {...props} {...stateStyles} data-slot="select-icon">
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
        <path d="M4.5 6h7L8 10z" />
      </svg>
    </BaseSelect.Icon>
  );
}

function SelectPortal(props: SelectPortalProps) {
  return <BaseSelect.Portal {...props} />;
}

function SelectPositioner({
  sideOffset = 4,
  align = "start",
  alignItemWithTrigger = false,
  ...props
}: SelectPositionerProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Positioner.State>(() => [selectStyles.positioner]);
  return (
    <BaseSelect.Positioner
      {...props}
      sideOffset={sideOffset}
      align={align}
      alignItemWithTrigger={alignItemWithTrigger}
      {...stateStyles}
    />
  );
}

function SelectPopup(props: SelectPopupProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Popup.State>((state) => [
    selectStyles.popup,
    (state.transitionStatus === "starting" || state.transitionStatus === "ending") &&
      selectStyles.popupTransition,
  ]);
  return <BaseSelect.Popup {...props} {...stateStyles} />;
}

function SelectList(props: SelectListProps) {
  const styles = stylex.props(selectStyles.list);
  return <BaseSelect.List {...props} {...styles} />;
}

function SelectContent({
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
}: SelectContentProps) {
  return (
    <SelectPortal>
      <SelectPositioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
      >
        <SelectPopup>
          <SelectList>{children}</SelectList>
        </SelectPopup>
      </SelectPositioner>
    </SelectPortal>
  );
}

const itemSizeStyles = {
  s: selectStyles.itemSizeS,
  m: selectStyles.itemSizeM,
  l: selectStyles.itemSizeL,
} satisfies Record<SelectSize, unknown>;

function SelectItem<Value>({
  value,
  size = "m",
  disabled = false,
  children,
  ...props
}: SelectItemProps<Value>) {
  const stateStyles = createStateStyleProps<BaseSelect.Item.State>((state) => [
    selectStyles.item,
    itemSizeStyles[size],
    state.selected === true && selectStyles.itemSelected,
    state.highlighted === true && selectStyles.itemHighlighted,
    state.disabled === true && selectStyles.itemDisabled,
  ]);
  const hasText = hasChild(children, SelectItemText);
  const hasIndicator = hasChild(children, SelectItemIndicator);

  return (
    <BaseSelect.Item
      {...props}
      value={value}
      disabled={disabled}
      {...stateStyles}
      data-size={size}
    >
      {hasText === true ? children : <SelectItemText>{children}</SelectItemText>}
      {hasIndicator === false && <SelectItemIndicator />}
    </BaseSelect.Item>
  );
}

function SelectItemText(props: SelectItemTextProps) {
  const styles = stylex.props(selectStyles.itemText);
  return <BaseSelect.ItemText {...props} {...styles} />;
}

function SelectItemIndicator({ keepMounted = false, ...props }: SelectItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseSelect.ItemIndicator.State>(() => [selectStyles.indicator]);
  const iconStyles = stylex.props(selectStyles.icon);
  return (
    <BaseSelect.ItemIndicator
      {...props}
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
  );
}

function SelectGroup(props: SelectGroupProps) {
  const styles = stylex.props(selectStyles.group);
  return <BaseSelect.Group {...props} {...styles} data-slot="select-group" />;
}

function SelectGroupLabel(props: SelectGroupLabelProps) {
  const styles = stylex.props(selectStyles.groupLabel);
  return <BaseSelect.GroupLabel {...props} {...styles} data-slot="select-group-label" />;
}

function SelectSeparator(props: SelectSeparatorProps) {
  const styles = stylex.props(selectStyles.separator);
  return <BaseSelect.Separator {...props} {...styles} />;
}

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
});
