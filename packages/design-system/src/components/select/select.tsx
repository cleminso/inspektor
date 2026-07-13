import { Select as BaseSelect } from "@base-ui/react/select";
import * as stylex from "@stylexjs/stylex";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { selectStyles } from "./select.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style">;

export type SelectSize = "s" | "m" | "l";

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
  extends Omit<WithoutStyles<BaseSelect.Trigger.Props>, "size"> {
  /** Controls the trigger height and padding. */
  size?: SelectSize;
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

export type SelectItemProps<Value> = Omit<WithoutStyles<BaseSelect.Item.Props>, "value"> & {
  /** The value represented by this option. */
  value: Value;
};

export type SelectItemTextProps = WithoutStyles<BaseSelect.ItemText.Props>;

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

function SelectTrigger({ size = "m", disabled = false, ...props }: SelectTriggerProps) {
  const stateStyles = createStateStyleProps<BaseSelect.Trigger.State>((state) => [
    selectStyles.trigger,
    sizeStyles[size],
    state.open === true && selectStyles.triggerOpen,
    state.valid === false && selectStyles.triggerInvalid,
    state.disabled === true && selectStyles.disabled,
  ]);
  return <BaseSelect.Trigger {...props} disabled={disabled} {...stateStyles} data-slot="select-trigger" />;
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
    <BaseSelect.Icon {...props} {...stateStyles}>
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

function SelectItem<Value>({ value, disabled = false, ...props }: SelectItemProps<Value>) {
  const stateStyles = createStateStyleProps<BaseSelect.Item.State>((state) => [
    selectStyles.item,
    state.highlighted === true && selectStyles.itemHighlighted,
    state.disabled === true && selectStyles.itemDisabled,
  ]);
  return <BaseSelect.Item {...props} value={value} disabled={disabled} {...stateStyles} />;
}

function SelectItemText(props: SelectItemTextProps) {
  const styles = stylex.props(selectStyles.itemText);
  return <BaseSelect.ItemText {...props} {...styles} />;
}

function SelectItemIndicator({ keepMounted = false, ...props }: SelectItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseSelect.ItemIndicator.State>(() => [selectStyles.indicator]);
  const iconStyles = stylex.props(selectStyles.icon);
  return (
    <BaseSelect.ItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
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
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
});
