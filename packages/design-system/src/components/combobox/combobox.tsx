import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import { type ReactNode } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { Button } from "../button/button";
import { comboboxStyles } from "./combobox.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style">;

export type ComboboxRootProps<Value> = Omit<
  BaseCombobox.Root.Props<Value, false>,
  "className" | "style" | "multiple"
> & {
  /** Items available for filtering and selection. */
  items?: BaseCombobox.Root.Props<Value, false>["items"];
  /** The selected item. */
  value?: Value | null;
  /** The initially selected item. */
  defaultValue?: Value | null;
  /** Runs when the selected item changes. */
  onValueChange?: BaseCombobox.Root.Props<Value, false>["onValueChange"];
  /** The current filter input value. */
  inputValue?: BaseCombobox.Root.Props<Value, false>["inputValue"];
  /** Runs when the filter input value changes. */
  onInputValueChange?: BaseCombobox.Root.Props<Value, false>["onInputValueChange"];
  /** Whether the popup is initially open. */
  defaultOpen?: boolean;
  /** Whether the popup is open. */
  open?: boolean;
  /** Runs when the popup opens or closes. */
  onOpenChange?: BaseCombobox.Root.Props<Value, false>["onOpenChange"];
  /** Converts an item into its displayed label. */
  itemToStringLabel?: BaseCombobox.Root.Props<Value, false>["itemToStringLabel"];
  /** Compares an item with the selected value. */
  isItemEqualToValue?: BaseCombobox.Root.Props<Value, false>["isItemEqualToValue"];
  /** Filters an item against the current query. */
  filter?: BaseCombobox.Root.Props<Value, false>["filter"];
  /** Disables the combobox. */
  disabled?: boolean;
};

export type ComboboxInputGroupProps = WithoutStyles<BaseCombobox.InputGroup.Props>;
export type ComboboxInputProps = Omit<
  WithoutStyles<BaseCombobox.Input.Props>,
  "size" | "value"
>;
export interface ComboboxInputTriggerProps
  extends Omit<WithoutStyles<BaseCombobox.Trigger.Props>, "children"> {
  /** Disables the input action trigger. */
  disabled?: boolean;
}

export type ComboboxTriggerVariant = "ghost" | "outline";
export type ComboboxTriggerSize = "s" | "m" | "l";

export interface ComboboxTriggerProps
  extends Omit<WithoutStyles<BaseCombobox.Trigger.Props>, "children" | "render"> {
  /** Content displayed by the trigger. */
  children: ReactNode;
  /** Controls the trigger treatment. */
  variant?: ComboboxTriggerVariant;
  /** Controls the trigger height and padding. */
  size?: ComboboxTriggerSize;
  /** Stretches the trigger to its container width. */
  fullWidth?: boolean;
  /** Disables the trigger. */
  disabled?: boolean;
}

export interface ComboboxLabelProps extends WithoutStyles<BaseCombobox.Label.Props> {
  /** Composes the label onto another element. */
  render?: BaseCombobox.Label.Props["render"];
}

export interface ComboboxValueProps extends WithoutStyles<BaseCombobox.Value.Props> {
  /** Content displayed when no item is selected. */
  placeholder?: ReactNode;
}

export interface ComboboxPortalProps extends WithoutStyles<BaseCombobox.Portal.Props> {
  /** Keeps the portal mounted while closed. */
  keepMounted?: boolean;
}

export interface ComboboxPositionerProps extends WithoutStyles<BaseCombobox.Positioner.Props> {
  /** Sets the gap between the control and popup. */
  sideOffset?: BaseCombobox.Positioner.Props["sideOffset"];
  /** Aligns the popup along the control. */
  align?: BaseCombobox.Positioner.Props["align"];
}

export type ComboboxPopupWidth = "anchor" | "content" | "s" | "m" | "l";

export interface ComboboxPopupProps
  extends Omit<WithoutStyles<BaseCombobox.Popup.Props>, "width"> {
  /** Controls the popup width using a design-system size. */
  width?: ComboboxPopupWidth;
}

export interface ComboboxPopupHeaderProps
  extends Omit<useRender.ComponentProps<"div">, "className" | "style"> {
  /** Composes the header layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export interface ComboboxPopupFooterProps
  extends Omit<useRender.ComponentProps<"div">, "className" | "style"> {
  /** Composes the footer layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export type ComboboxViewportHeight = "s" | "m" | "l" | "available";

export interface ComboboxViewportProps
  extends Omit<useRender.ComponentProps<"div">, "className" | "style"> {
  /** Controls the maximum height of the scrolling results region. */
  maxHeight?: ComboboxViewportHeight;
  /** Composes the viewport layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export type ComboboxSeparatorProps = WithoutStyles<BaseCombobox.Separator.Props>;
export type ComboboxEmptyProps = WithoutStyles<BaseCombobox.Empty.Props>;
export type ComboboxListProps = WithoutStyles<BaseCombobox.List.Props>;

export type ComboboxItemProps<Value> = Omit<WithoutStyles<BaseCombobox.Item.Props>, "value"> & {
  /** The item represented by this option. */
  value: Value;
};

export interface ComboboxItemTextProps {
  /** Primary item text, constrained to one line. */
  label: ReactNode;
  /** Optional secondary item text, constrained to one line. */
  description?: ReactNode;
}

export interface ComboboxItemIndicatorProps
  extends Omit<WithoutStyles<BaseCombobox.ItemIndicator.Props>, "children"> {
  /** Keeps the indicator mounted while the item is not selected. */
  keepMounted?: boolean;
}

function ComboboxRoot<Value>({ defaultOpen = false, disabled = false, ...props }: ComboboxRootProps<Value>) {
  return <BaseCombobox.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

function ComboboxInputGroup(props: ComboboxInputGroupProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.InputGroup.State>((state) => [
    comboboxStyles.inputGroup,
    state.valid === false && comboboxStyles.inputGroupInvalid,
    state.disabled === true && comboboxStyles.inputGroupDisabled,
  ]);
  return <BaseCombobox.InputGroup {...props} {...stateStyles} data-slot="combobox-input-group" />;
}

function ComboboxInput(props: ComboboxInputProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Input.State>((state) => [
    comboboxStyles.input,
    state.disabled === true && comboboxStyles.inputDisabled,
  ]);
  return <BaseCombobox.Input {...props} {...stateStyles} data-slot="combobox-input" />;
}

function ComboboxInputTrigger({ disabled = false, ...props }: ComboboxInputTriggerProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Trigger.State>((state) => [
    comboboxStyles.action,
    state.disabled === true && comboboxStyles.actionDisabled,
  ]);
  const iconStyles = stylex.props(comboboxStyles.icon);
  return (
    <BaseCombobox.Trigger aria-label="Open options" {...props} disabled={disabled} {...stateStyles}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
        <path d="M4 6h8l-4 4.5z" />
      </svg>
    </BaseCombobox.Trigger>
  );
}

function ComboboxTrigger({
  children,
  variant = "ghost",
  size = "m",
  fullWidth = false,
  disabled = false,
  ...props
}: ComboboxTriggerProps) {
  const iconStyles = stylex.props(comboboxStyles.icon);
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      justify="start"
      disabled={disabled}
      render={<BaseCombobox.Trigger {...props} disabled={disabled} />}
    >
      {children}
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
        <path d="M4 6h8l-4 4.5z" />
      </svg>
    </Button>
  );
}

function ComboboxLabel(props: ComboboxLabelProps) {
  const styles = stylex.props(comboboxStyles.label);
  return <BaseCombobox.Label {...props} {...styles} />;
}

function ComboboxValue(props: ComboboxValueProps) {
  return <BaseCombobox.Value {...props} />;
}

function ComboboxPortal({ keepMounted = false, ...props }: ComboboxPortalProps) {
  return <BaseCombobox.Portal {...props} keepMounted={keepMounted} />;
}

function ComboboxPositioner({ sideOffset = 4, align = "start", ...props }: ComboboxPositionerProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Positioner.State>(() => [comboboxStyles.positioner]);
  return <BaseCombobox.Positioner {...props} sideOffset={sideOffset} align={align} {...stateStyles} />;
}

const popupWidthStyles = {
  anchor: comboboxStyles.popupWidthAnchor,
  content: comboboxStyles.popupWidthContent,
  s: comboboxStyles.popupWidthS,
  m: comboboxStyles.popupWidthM,
  l: comboboxStyles.popupWidthL,
} satisfies Record<ComboboxPopupWidth, unknown>;

function ComboboxPopup({ width = "anchor", ...props }: ComboboxPopupProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Popup.State>((state) => [
    comboboxStyles.popup,
    popupWidthStyles[width],
    (state.transitionStatus === "starting" || state.transitionStatus === "ending") &&
      comboboxStyles.popupTransition,
  ]);
  return <BaseCombobox.Popup {...props} {...stateStyles} />;
}

function ComboboxPopupHeader({ render, ...props }: ComboboxPopupHeaderProps) {
  const styles = stylex.props(comboboxStyles.popupHeader);
  const defaultProps = {
    ...styles,
    "data-slot": "combobox-popup-header",
  } as useRender.ComponentProps<"div">;
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

function ComboboxPopupFooter({ render, ...props }: ComboboxPopupFooterProps) {
  const styles = stylex.props(comboboxStyles.popupFooter);
  const defaultProps = {
    ...styles,
    "data-slot": "combobox-popup-footer",
  } as useRender.ComponentProps<"div">;
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

const viewportHeightStyles = {
  s: comboboxStyles.viewportHeightS,
  m: comboboxStyles.viewportHeightM,
  l: comboboxStyles.viewportHeightL,
  available: comboboxStyles.viewportHeightAvailable,
} satisfies Record<ComboboxViewportHeight, unknown>;

function ComboboxViewport({ maxHeight = "m", render, ...props }: ComboboxViewportProps) {
  const styles = stylex.props(comboboxStyles.viewport, viewportHeightStyles[maxHeight]);
  const defaultProps = {
    ...styles,
    "data-slot": "combobox-viewport",
  } as useRender.ComponentProps<"div">;
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

function ComboboxSeparator(props: ComboboxSeparatorProps) {
  const styles = stylex.props(comboboxStyles.separator);
  return <BaseCombobox.Separator {...props} {...styles} />;
}

function ComboboxEmpty({ children, ...props }: ComboboxEmptyProps) {
  const styles = stylex.props(comboboxStyles.empty);
  return (
    <BaseCombobox.Empty {...props}>
      <span {...styles}>{children}</span>
    </BaseCombobox.Empty>
  );
}

function ComboboxList(props: ComboboxListProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.List.State>((state) => [
    comboboxStyles.list,
    state.empty === true && comboboxStyles.listEmpty,
  ]);
  return <BaseCombobox.List {...props} {...stateStyles} />;
}

function ComboboxItem<Value>({ value, ...props }: ComboboxItemProps<Value>) {
  const stateStyles = createStateStyleProps<BaseCombobox.Item.State>((state) => [
    comboboxStyles.item,
    state.highlighted === true && comboboxStyles.itemHighlighted,
    state.disabled === true && comboboxStyles.itemDisabled,
  ]);
  return <BaseCombobox.Item {...props} value={value} {...stateStyles} />;
}

function ComboboxItemText({ label, description }: ComboboxItemTextProps) {
  const textStyles = stylex.props(comboboxStyles.itemText);
  const labelStyles = stylex.props(comboboxStyles.itemLabel);
  const descriptionStyles = stylex.props(comboboxStyles.itemDescription);
  return (
    <span {...textStyles}>
      <span {...labelStyles}>{label}</span>
      {description !== undefined ? <span {...descriptionStyles}>{description}</span> : null}
    </span>
  );
}

function ComboboxItemIndicator({ keepMounted = false, ...props }: ComboboxItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.ItemIndicator.State>(() => [comboboxStyles.indicator]);
  const iconStyles = stylex.props(comboboxStyles.icon);
  return (
    <BaseCombobox.ItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" {...iconStyles}>
        <path d="m3 8 3 3 7-7" />
      </svg>
    </BaseCombobox.ItemIndicator>
  );
}

export const Combobox = Object.assign(ComboboxRoot, {
  Root: ComboboxRoot,
  Label: ComboboxLabel,
  Value: ComboboxValue,
  InputGroup: ComboboxInputGroup,
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  InputTrigger: ComboboxInputTrigger,
  Portal: ComboboxPortal,
  Positioner: ComboboxPositioner,
  Popup: ComboboxPopup,
  PopupHeader: ComboboxPopupHeader,
  PopupFooter: ComboboxPopupFooter,
  Viewport: ComboboxViewport,
  Separator: ComboboxSeparator,
  Empty: ComboboxEmpty,
  List: ComboboxList,
  Item: ComboboxItem,
  ItemText: ComboboxItemText,
  ItemIndicator: ComboboxItemIndicator,
});
