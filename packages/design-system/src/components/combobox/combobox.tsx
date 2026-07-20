import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useState } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { Button } from "../button/button";
import { comboboxStyles } from "./combobox.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style" | "render">;

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
  /** The initial filter input value when uncontrolled. */
  defaultInputValue?: BaseCombobox.Root.Props<Value, false>["defaultInputValue"];
  /** Runs when the filter input value changes. */
  onInputValueChange?: BaseCombobox.Root.Props<Value, false>["onInputValueChange"];
  /** Whether the popup is initially open. */
  defaultOpen?: boolean;
  /** Whether the popup is open. */
  open?: boolean;
  /** Runs when the popup opens or closes. */
  onOpenChange?: BaseCombobox.Root.Props<Value, false>["onOpenChange"];
  /** Runs after an opening or closing transition completes. */
  onOpenChangeComplete?: BaseCombobox.Root.Props<Value, false>["onOpenChangeComplete"];
  /** Converts an item into its displayed label. */
  itemToStringLabel?: BaseCombobox.Root.Props<Value, false>["itemToStringLabel"];
  /** Converts an item into the value submitted with a form. */
  itemToStringValue?: BaseCombobox.Root.Props<Value, false>["itemToStringValue"];
  /** Compares an item with the selected value. */
  isItemEqualToValue?: BaseCombobox.Root.Props<Value, false>["isItemEqualToValue"];
  /** Filters an item against the current query. */
  filter?: BaseCombobox.Root.Props<Value, false>["filter"];
  /** Identifies the value when the combobox participates in form submission. */
  name?: BaseCombobox.Root.Props<Value, false>["name"];
  /** Associates the combobox with a form element. */
  form?: BaseCombobox.Root.Props<Value, false>["form"];
  /** Requires a selection before form submission. */
  required?: BaseCombobox.Root.Props<Value, false>["required"];
  /** Prevents selection changes while preserving focus and form participation. */
  readOnly?: BaseCombobox.Root.Props<Value, false>["readOnly"];
  /** Disables the combobox. */
  disabled?: boolean;
};

export type ComboboxInputGroupAppearance = "default" | "bare";
export type ComboboxInputGroupWidth = "content" | "full";

export interface ComboboxInputGroupProps extends WithoutStyles<BaseCombobox.InputGroup.Props> {
  /** Controls the input-group surface treatment. */
  appearance?: ComboboxInputGroupAppearance;
  /** Controls whether the input group follows its content or fills its container. */
  width?: ComboboxInputGroupWidth;
}
export type ComboboxInputProps = Omit<WithoutStyles<BaseCombobox.Input.Props>, "size" | "value">;
export interface ComboboxInputTriggerProps extends Omit<
  WithoutStyles<BaseCombobox.Trigger.Props>,
  "children"
> {
  /** Disables the input action trigger. */
  disabled?: boolean;
}

export type ComboboxTriggerVariant = "ghost" | "outline";
export type ComboboxTriggerSize = "s" | "m" | "l";
export type ComboboxTriggerWidth = "content" | "s" | "m" | "full";

export interface ComboboxTriggerProps extends Omit<
  WithoutStyles<BaseCombobox.Trigger.Props>,
  "children" | "render"
> {
  /** Content displayed by the trigger. */
  children: ReactNode;
  /** Controls the trigger treatment. */
  variant?: ComboboxTriggerVariant;
  /** Controls the trigger height and padding. */
  size?: ComboboxTriggerSize;
  /** Constrains the trigger width. */
  width?: ComboboxTriggerWidth;
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

export interface ComboboxPopupProps extends Omit<WithoutStyles<BaseCombobox.Popup.Props>, "width"> {
  /** Controls the popup width using a design-system size. */
  width?: ComboboxPopupWidth;
}

export interface ComboboxContentProps {
  /** Content rendered inside the positioned popup. */
  children?: ReactNode;
  /** Controls the popup width using a design-system size. */
  width?: ComboboxPopupWidth;
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean;
  /** Sets the gap between the control and popup. */
  sideOffset?: ComboboxPositionerProps["sideOffset"];
  /** Aligns the popup along the control. */
  align?: ComboboxPositionerProps["align"];
}

export interface ComboboxPopupHeaderProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "style"
> {
  /** Composes the header layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export interface ComboboxPopupFooterProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "style"
> {
  /** Composes the footer layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export type ComboboxViewportHeight = "s" | "m" | "l" | "available";

export interface ComboboxViewportProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "style"
> {
  /** Controls the maximum height of the scrolling results region. */
  maxHeight?: ComboboxViewportHeight;
  /** Composes the viewport layout onto another element. */
  render?: useRender.ComponentProps<"div">["render"];
}

export type ComboboxSeparatorProps = WithoutStyles<BaseCombobox.Separator.Props>;
export type ComboboxEmptyProps = WithoutStyles<BaseCombobox.Empty.Props>;
export type ComboboxStatusProps = WithoutStyles<BaseCombobox.Status.Props>;
export type ComboboxListProps = WithoutStyles<BaseCombobox.List.Props>;
export type ComboboxGroupProps = WithoutStyles<BaseCombobox.Group.Props>;
export type ComboboxGroupLabelProps = WithoutStyles<BaseCombobox.GroupLabel.Props>;

export interface ComboboxClearProps extends Omit<
  WithoutStyles<BaseCombobox.Clear.Props>,
  "children" | "aria-label"
> {
  /** Accessible label for the clear action. */
  label?: string;
  /** Keeps the clear action mounted when no value is selected. */
  keepMounted?: BaseCombobox.Clear.Props["keepMounted"];
  /** Disables the clear action. */
  disabled?: BaseCombobox.Clear.Props["disabled"];
}

export type ComboboxItemProps<Value> = Omit<WithoutStyles<BaseCombobox.Item.Props>, "value"> & {
  /** The item represented by this option. */
  value: Value;
  /** Controls whether the standard selected indicator is displayed. */
  indicator?: "check" | "none";
};

export interface ComboboxItemTextProps {
  /** Primary item text, constrained to one line. */
  label: ReactNode;
  /** Optional secondary item text, constrained to one line. */
  description?: ReactNode;
}

export interface ComboboxItemIndicatorProps extends Omit<
  WithoutStyles<BaseCombobox.ItemIndicator.Props>,
  "children"
> {
  /** Keeps the indicator mounted while the item is not selected. */
  keepMounted?: boolean;
}

function ComboboxRoot<Value>({
  defaultOpen = false,
  required = false,
  readOnly = false,
  disabled = false,
  ...props
}: ComboboxRootProps<Value>) {
  return (
    <BaseCombobox.Root
      {...props}
      defaultOpen={defaultOpen}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
    />
  );
}

function ComboboxInputGroup({ appearance = "default", width = "content", ...props }: ComboboxInputGroupProps) {
  const [focusVisible, setFocusVisible] = useState(false);
  const stateStyles = createStateStyleProps<BaseCombobox.InputGroup.State>((state) => [
    comboboxStyles.inputGroup,
    width === "full" && comboboxStyles.inputGroupWidthFull,
    appearance === "bare" && comboboxStyles.inputGroupBare,
    focusVisible === true && comboboxStyles.inputGroupFocusVisible,
    state.valid === false && comboboxStyles.inputGroupInvalid,
    state.disabled === true && comboboxStyles.inputGroupDisabled,
  ]);
  return (
    <BaseCombobox.InputGroup
      {...props}
      {...stateStyles}
      data-slot="combobox-input-group"
      data-focus-visible={focusVisible === true ? "" : undefined}
      onFocusCapture={(event) => {
        props.onFocusCapture?.(event);
        if (event.defaultPrevented === false && event.baseUIHandlerPrevented !== true) {
          setFocusVisible(
            event.target instanceof HTMLElement && event.target.matches(":focus-visible"),
          );
        }
      }}
      onBlurCapture={(event) => {
        props.onBlurCapture?.(event);
        if (event.defaultPrevented === true || event.baseUIHandlerPrevented === true) {
          return;
        }
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        setFocusVisible(false);
      }}
    />
  );
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
  return (
    <BaseCombobox.Trigger
      aria-label="Open options"
      {...props}
      disabled={disabled}
      {...stateStyles}
      render={(triggerProps, state) => (
        <button {...triggerProps}>
          <ComboboxChevron open={state.open} />
        </button>
      )}
    />
  );
}

function ComboboxTrigger({
  children,
  variant = "ghost",
  size = "m",
  width = "content",
  disabled = false,
  ...props
}: ComboboxTriggerProps) {
  const triggerWidthStyles = {
    content: comboboxStyles.triggerWidthContent,
    s: comboboxStyles.triggerWidthS,
    m: comboboxStyles.triggerWidthM,
    full: comboboxStyles.triggerWidthFull,
  } satisfies Record<ComboboxTriggerWidth, unknown>;
  const triggerStyles = createStateStyleProps<BaseCombobox.Trigger.State>(() => [
    comboboxStyles.trigger,
    triggerWidthStyles[width],
  ]);
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={width === "full"}
      justify="start"
      disabled={disabled}
      render={
        <BaseCombobox.Trigger
          {...props}
          disabled={disabled}
          {...triggerStyles}
          render={(triggerProps) => <button {...triggerProps}>{triggerProps.children}</button>}
        />
      }
    >
      {children}
    </Button>
  );
}

function ComboboxChevron({ open }: { open: boolean }) {
  const iconStyles = stylex.props(comboboxStyles.icon, open === true && comboboxStyles.iconOpen);

  return (
    <svg
      aria-hidden="true"
      data-slot="combobox-chevron"
      fill="currentColor"
      viewBox="0 0 16 16"
      {...iconStyles}
    >
      <path d="m14.06 5.5-.53.53-4.82 4.82a1 1 0 0 1-1.42 0L2.47 6.03l-.53-.53L3 4.44l.53.53L8 9.44l4.47-4.47.53-.53z" />
    </svg>
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

function ComboboxPositioner({
  sideOffset = 4,
  align = "start",
  ...props
}: ComboboxPositionerProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Positioner.State>(() => [
    comboboxStyles.positioner,
  ]);
  return (
    <BaseCombobox.Positioner {...props} sideOffset={sideOffset} align={align} {...stateStyles} />
  );
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

function ComboboxContent({
  children,
  width = "anchor",
  keepMounted = false,
  sideOffset = 4,
  align = "start",
}: ComboboxContentProps) {
  return (
    <ComboboxPortal keepMounted={keepMounted}>
      <ComboboxPositioner sideOffset={sideOffset} align={align}>
        <ComboboxPopup width={width} data-slot="combobox-content">
          {children}
        </ComboboxPopup>
      </ComboboxPositioner>
    </ComboboxPortal>
  );
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

function ComboboxClear({
  label = "Clear selection",
  keepMounted = false,
  disabled = false,
  ...props
}: ComboboxClearProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.Clear.State>((state) => [
    comboboxStyles.action,
    state.disabled === true && comboboxStyles.actionDisabled,
  ]);
  const iconStyles = stylex.props(comboboxStyles.icon);

  return (
    <BaseCombobox.Clear
      aria-label={label}
      {...props}
      keepMounted={keepMounted}
      disabled={disabled}
      {...stateStyles}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        {...iconStyles}
      >
        <path d="m4 4 8 8M12 4l-8 8" />
      </svg>
    </BaseCombobox.Clear>
  );
}

function ComboboxEmpty({ children, ...props }: ComboboxEmptyProps) {
  const styles = stylex.props(comboboxStyles.empty);
  return (
    <BaseCombobox.Empty {...props} {...styles}>
      {children}
    </BaseCombobox.Empty>
  );
}

function ComboboxStatus({ children, ...props }: ComboboxStatusProps) {
  const styles = stylex.props(comboboxStyles.status);
  return (
    <BaseCombobox.Status {...props} {...styles}>
      {children}
    </BaseCombobox.Status>
  );
}

function ComboboxList(props: ComboboxListProps) {
  const stateStyles = createStateStyleProps<BaseCombobox.List.State>((state) => [
    comboboxStyles.list,
    state.empty === true && comboboxStyles.listEmpty,
  ]);
  return <BaseCombobox.List {...props} {...stateStyles} />;
}

function ComboboxGroup(props: ComboboxGroupProps) {
  const styles = stylex.props(comboboxStyles.group);
  return <BaseCombobox.Group {...props} {...styles} />;
}

function ComboboxGroupLabel(props: ComboboxGroupLabelProps) {
  const styles = stylex.props(comboboxStyles.groupLabel);
  return <BaseCombobox.GroupLabel {...props} {...styles} />;
}

function ComboboxItem<Value>({
  value,
  indicator = "check",
  children,
  ...props
}: ComboboxItemProps<Value>) {
  const stateStyles = createStateStyleProps<BaseCombobox.Item.State>((state) => [
    comboboxStyles.item,
    comboboxStyles.itemInteractive,
    state.highlighted === true && comboboxStyles.itemHighlighted,
    state.selected === true && comboboxStyles.itemSelected,
    state.disabled === true && comboboxStyles.itemDisabled,
  ]);
  return (
    <BaseCombobox.Item {...props} value={value} {...stateStyles}>
      {children}
      {indicator === "check" ? <ComboboxItemIndicator /> : null}
    </BaseCombobox.Item>
  );
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
  const stateStyles = createStateStyleProps<BaseCombobox.ItemIndicator.State>(() => [
    comboboxStyles.indicator,
  ]);
  const iconStyles = stylex.props(comboboxStyles.icon);
  return (
    <BaseCombobox.ItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
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
  Content: ComboboxContent,
  PopupHeader: ComboboxPopupHeader,
  PopupFooter: ComboboxPopupFooter,
  Viewport: ComboboxViewport,
  Clear: ComboboxClear,
  Separator: ComboboxSeparator,
  Empty: ComboboxEmpty,
  Status: ComboboxStatus,
  List: ComboboxList,
  Group: ComboboxGroup,
  GroupLabel: ComboboxGroupLabel,
  Item: ComboboxItem,
  ItemText: ComboboxItemText,
  ItemIndicator: ComboboxItemIndicator,
});
