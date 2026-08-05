import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import {
  type ComponentRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  forwardRef,
  useState,
} from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { scrollbarStyles } from "../../styles/scrollbar.styles";
import { ButtonContent, getButtonVisualStyles } from "../button/buttonVisuals";
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
export interface ComboboxInputProps extends Omit<
  WithoutStyles<BaseCombobox.Input.Props>,
  "size" | "value"
> {
  /** Composes input behavior onto another input component. */
  render?: BaseCombobox.Input.Props["render"];
}
export interface ComboboxInputTriggerProps extends Omit<
  WithoutStyles<BaseCombobox.Trigger.Props>,
  "children" | "nativeButton"
> {
  /** Disables the input action trigger. */
  disabled?: boolean;
}

export type ComboboxTriggerSize = "s" | "m";
export type ComboboxTriggerWidth = "content" | "s" | "m" | "full";

export interface ComboboxTriggerProps extends Omit<
  WithoutStyles<BaseCombobox.Trigger.Props>,
  "children"
> {
  /** Content displayed by the trigger. */
  children: ReactNode;
  /** Controls the trigger height and padding. */
  size?: ComboboxTriggerSize;
  /** Constrains the trigger width. */
  width?: ComboboxTriggerWidth;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Composes trigger behavior onto another button component. */
  render?: BaseCombobox.Trigger.Props["render"];
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

export type ComboboxPositionerProps = Pick<
  WithoutStyles<BaseCombobox.Positioner.Props>,
  "align" | "children" | "ref" | "side"
>;

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
  /** Aligns the popup along the control. */
  align?: ComboboxPositionerProps["align"];
  /** Places the popup on this side of the control. */
  side?: ComboboxPositionerProps["side"];
}

export interface ComboboxPopupHeaderProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "render" | "style"
> {}

export interface ComboboxPopupFooterProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "render" | "style"
> {}

export type ComboboxViewportHeight = "s" | "m" | "l" | "available";

export interface ComboboxViewportProps extends Omit<
  useRender.ComponentProps<"div">,
  "className" | "render" | "style"
> {
  /** Controls the maximum height of the scrolling results region. */
  maxHeight?: ComboboxViewportHeight;
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
  /** Composes clear behavior onto another button component. */
  render?: BaseCombobox.Clear.Props["render"];
}

export type ComboboxItemProps<Value> = Omit<WithoutStyles<BaseCombobox.Item.Props>, "value"> & {
  /** The item represented by this option. */
  value: Value;
  /** Controls whether the standard selected indicator is displayed. */
  indicator?: "check" | "none";
  /** Composes option behavior onto another compatible element. */
  render?: BaseCombobox.Item.Props["render"];
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

const ComboboxInputGroup = forwardRef<
  ComponentRef<typeof BaseCombobox.InputGroup>,
  ComboboxInputGroupProps
>(function ComboboxInputGroup(
  { appearance = "default", width = "content", ...props },
  forwardedRef,
) {
  const [focusVisible, setFocusVisible] = useState(false);
  const stateStyles = createStateStyleProps<BaseCombobox.InputGroup.State>((state) => [
    comboboxStyles.inputGroup,
    width === "full" && comboboxStyles.inputGroupWidthFull,
    appearance === "bare" && comboboxStyles.inputGroupBare,
    focusVisible === true && comboboxStyles.inputGroupFocusVisible,
    state.valid === false && comboboxStyles.inputGroupInvalid,
    state.disabled === true && comboboxStyles.inputGroupDisabled,
    state.open === true && comboboxStyles.inputGroupOpen,
    state.open === true && comboboxStyles.inputGroupPressed,
    state.readOnly === true && comboboxStyles.inputGroupReadOnly,
    state.valid === true && comboboxStyles.inputGroupValid,
    state.touched === true && comboboxStyles.inputGroupTouched,
    state.dirty === true && comboboxStyles.inputGroupDirty,
    state.filled === true && comboboxStyles.inputGroupFilled,
    state.focused === true && comboboxStyles.inputGroupFocused,
    state.listEmpty === true && comboboxStyles.inputGroupListEmpty,
    state.placeholder === true && comboboxStyles.inputGroupPlaceholder,
    state.popupSide === "top" && comboboxStyles.inputGroupSideTop,
    state.popupSide === "bottom" && comboboxStyles.inputGroupSideBottom,
    state.popupSide === "left" && comboboxStyles.inputGroupSideLeft,
    state.popupSide === "right" && comboboxStyles.inputGroupSideRight,
    state.popupSide === "inline-start" && comboboxStyles.inputGroupSideInlineStart,
    state.popupSide === "inline-end" && comboboxStyles.inputGroupSideInlineEnd,
  ]);
  return (
    <BaseCombobox.InputGroup
      {...props}
      ref={forwardedRef}
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
});

const ComboboxInput = forwardRef<ComponentRef<typeof BaseCombobox.Input>, ComboboxInputProps>(
  function ComboboxInput(props, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseCombobox.Input.State>((state) => [
      comboboxStyles.input,
      state.disabled === true && comboboxStyles.inputDisabled,
      state.open === true && comboboxStyles.inputOpen,
      state.open === true && comboboxStyles.inputPressed,
      state.readOnly === true && comboboxStyles.inputReadOnly,
      state.valid === true && comboboxStyles.inputValid,
      state.valid === false && comboboxStyles.inputInvalid,
      state.touched === true && comboboxStyles.inputTouched,
      state.dirty === true && comboboxStyles.inputDirty,
      state.filled === true && comboboxStyles.inputFilled,
      state.focused === true && comboboxStyles.inputFocused,
      state.listEmpty === true && comboboxStyles.inputListEmpty,
      state.popupSide === "top" && comboboxStyles.inputSideTop,
      state.popupSide === "bottom" && comboboxStyles.inputSideBottom,
      state.popupSide === "left" && comboboxStyles.inputSideLeft,
      state.popupSide === "right" && comboboxStyles.inputSideRight,
      state.popupSide === "inline-start" && comboboxStyles.inputSideInlineStart,
      state.popupSide === "inline-end" && comboboxStyles.inputSideInlineEnd,
    ]);
    return (
      <BaseCombobox.Input
        {...props}
        ref={forwardedRef}
        {...stateStyles}
        data-slot="combobox-input"
      />
    );
  },
);

const ComboboxInputTrigger = forwardRef<
  ComponentRef<typeof BaseCombobox.Trigger>,
  ComboboxInputTriggerProps
>(function ComboboxInputTrigger({ disabled = false, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseCombobox.Trigger.State>((state) => [
    comboboxStyles.action,
    state.disabled === true && comboboxStyles.actionDisabled,
    state.open === true && comboboxStyles.inputTriggerOpen,
    state.open === true && comboboxStyles.inputTriggerPressed,
    state.valid === true && comboboxStyles.inputTriggerValid,
    state.valid === false && comboboxStyles.inputTriggerInvalid,
    state.touched === true && comboboxStyles.inputTriggerTouched,
    state.dirty === true && comboboxStyles.inputTriggerDirty,
    state.filled === true && comboboxStyles.inputTriggerFilled,
    state.focused === true && comboboxStyles.inputTriggerFocused,
    state.listEmpty === true && comboboxStyles.inputTriggerListEmpty,
    state.placeholder === true && comboboxStyles.inputTriggerPlaceholder,
    state.popupSide === "top" && comboboxStyles.inputTriggerSideTop,
    state.popupSide === "bottom" && comboboxStyles.inputTriggerSideBottom,
    state.popupSide === "left" && comboboxStyles.inputTriggerSideLeft,
    state.popupSide === "right" && comboboxStyles.inputTriggerSideRight,
    state.popupSide === "inline-start" && comboboxStyles.inputTriggerSideInlineStart,
    state.popupSide === "inline-end" && comboboxStyles.inputTriggerSideInlineEnd,
  ]);
  return (
    <BaseCombobox.Trigger
      aria-label="Open options"
      {...props}
      ref={forwardedRef}
      disabled={disabled}
      {...stateStyles}
      render={(triggerProps, state) => (
        <button {...triggerProps}>
          <ComboboxChevron open={state.open} />
        </button>
      )}
    />
  );
});

const ComboboxTrigger = forwardRef<ComponentRef<typeof BaseCombobox.Trigger>, ComboboxTriggerProps>(
  function ComboboxTrigger(
    { children, size = "m", width = "content", disabled = false, ...props },
    forwardedRef,
  ) {
    const triggerWidthStyles = {
      content: comboboxStyles.triggerWidthContent,
      s: comboboxStyles.triggerWidthS,
      m: comboboxStyles.triggerWidthM,
      full: comboboxStyles.triggerWidthFull,
    } satisfies Record<ComboboxTriggerWidth, unknown>;
    const triggerStyles = createStateStyleProps<BaseCombobox.Trigger.State>((state) => [
      ...getButtonVisualStyles({
        variant: "ghost",
        size,
        square: false,
        pressed: false,
        radius: "xs",
        fill: width === "full",
        alignment: "start",
        orientation: null,
        disabled: state.disabled,
        hasPrefix: false,
        hasSuffix: false,
      }),
      comboboxStyles.trigger,
      triggerWidthStyles[width],
      state.open === true && comboboxStyles.triggerOpen,
      state.open === true && comboboxStyles.triggerPressed,
      state.disabled === true && comboboxStyles.triggerDisabled,
      state.valid === true && comboboxStyles.triggerValid,
      state.valid === false && comboboxStyles.triggerInvalid,
      state.touched === true && comboboxStyles.triggerTouched,
      state.dirty === true && comboboxStyles.triggerDirty,
      state.filled === true && comboboxStyles.triggerFilled,
      state.focused === true && comboboxStyles.triggerFocused,
      state.listEmpty === true && comboboxStyles.triggerListEmpty,
      state.placeholder === true && comboboxStyles.triggerPlaceholder,
      state.popupSide === "top" && comboboxStyles.triggerSideTop,
      state.popupSide === "bottom" && comboboxStyles.triggerSideBottom,
      state.popupSide === "left" && comboboxStyles.triggerSideLeft,
      state.popupSide === "right" && comboboxStyles.triggerSideRight,
      state.popupSide === "inline-start" && comboboxStyles.triggerSideInlineStart,
      state.popupSide === "inline-end" && comboboxStyles.triggerSideInlineEnd,
    ]);
    return (
      <BaseCombobox.Trigger
        {...props}
        ref={forwardedRef}
        disabled={disabled}
        {...triggerStyles}
        data-full-width={width === "full" ? "" : undefined}
        data-radius="xs"
        data-size={size}
        data-slot="button"
        data-variant="ghost"
      >
        <ButtonContent size={size}>
          {children}
        </ButtonContent>
      </BaseCombobox.Trigger>
    );
  },
);

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

const ComboboxLabel = forwardRef<ComponentRef<typeof BaseCombobox.Label>, ComboboxLabelProps>(
  function ComboboxLabel(props, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseCombobox.Label.State>((state) => [
      comboboxStyles.label,
      state.disabled === true && comboboxStyles.labelDisabled,
      state.valid === true && comboboxStyles.labelValid,
      state.valid === false && comboboxStyles.labelInvalid,
      state.touched === true && comboboxStyles.labelTouched,
      state.dirty === true && comboboxStyles.labelDirty,
      state.filled === true && comboboxStyles.labelFilled,
      state.focused === true && comboboxStyles.labelFocused,
    ]);
    return <BaseCombobox.Label {...props} ref={forwardedRef} {...stateStyles} />;
  },
);

function ComboboxValue(props: ComboboxValueProps) {
  return <BaseCombobox.Value {...props} />;
}

const ComboboxPortal = forwardRef<ComponentRef<typeof BaseCombobox.Portal>, ComboboxPortalProps>(
  function ComboboxPortal({ keepMounted = false, ...props }, forwardedRef) {
    return <BaseCombobox.Portal {...props} ref={forwardedRef} keepMounted={keepMounted} />;
  },
);

const ComboboxPositioner = forwardRef<
  ComponentRef<typeof BaseCombobox.Positioner>,
  ComboboxPositionerProps
>(function ComboboxPositioner({ align = "start", side = "bottom", ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseCombobox.Positioner.State>((state) => [
    comboboxStyles.positioner,
    state.open === true && comboboxStyles.positionerOpen,
    state.open === false && comboboxStyles.positionerClosed,
    state.anchorHidden === true && comboboxStyles.positionerAnchorHidden,
    state.empty === true && comboboxStyles.positionerEmpty,
    state.side === "top" && comboboxStyles.positionerSideTop,
    state.side === "bottom" && comboboxStyles.positionerSideBottom,
    state.side === "left" && comboboxStyles.positionerSideLeft,
    state.side === "right" && comboboxStyles.positionerSideRight,
    state.side === "inline-start" && comboboxStyles.positionerSideInlineStart,
    state.side === "inline-end" && comboboxStyles.positionerSideInlineEnd,
    state.align === "start" && comboboxStyles.positionerAlignStart,
    state.align === "center" && comboboxStyles.positionerAlignCenter,
    state.align === "end" && comboboxStyles.positionerAlignEnd,
  ]);
  return (
    <BaseCombobox.Positioner
      {...props}
      ref={forwardedRef}
      sideOffset={popupPositioning.dropdownSideOffset}
      align={align}
      side={side}
      {...stateStyles}
    />
  );
});

const popupWidthStyles = {
  anchor: comboboxStyles.popupWidthAnchor,
  content: comboboxStyles.popupWidthContent,
  s: comboboxStyles.popupWidthS,
  m: comboboxStyles.popupWidthM,
  l: comboboxStyles.popupWidthL,
} satisfies Record<ComboboxPopupWidth, unknown>;

const ComboboxPopup = forwardRef<ComponentRef<typeof BaseCombobox.Popup>, ComboboxPopupProps>(
  function ComboboxPopup({ width = "anchor", ...props }, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseCombobox.Popup.State>((state) => [
      comboboxStyles.popup,
      popupWidthStyles[width],
      (state.transitionStatus === "starting" || state.transitionStatus === "ending") &&
        comboboxStyles.popupTransition,
      state.open === true && comboboxStyles.popupOpen,
      state.open === false && comboboxStyles.popupClosed,
      state.anchorHidden === true && comboboxStyles.popupAnchorHidden,
      state.empty === true && comboboxStyles.popupEmpty,
      state.transitionStatus === "starting" && comboboxStyles.popupStarting,
      state.transitionStatus === "ending" && comboboxStyles.popupEnding,
      state.side === "top" && comboboxStyles.popupSideTop,
      state.side === "bottom" && comboboxStyles.popupSideBottom,
      state.side === "left" && comboboxStyles.popupSideLeft,
      state.side === "right" && comboboxStyles.popupSideRight,
      state.side === "inline-start" && comboboxStyles.popupSideInlineStart,
      state.side === "inline-end" && comboboxStyles.popupSideInlineEnd,
      state.align === "start" && comboboxStyles.popupAlignStart,
      state.align === "center" && comboboxStyles.popupAlignCenter,
      state.align === "end" && comboboxStyles.popupAlignEnd,
    ]);
    return <BaseCombobox.Popup {...props} ref={forwardedRef} {...stateStyles} />;
  },
);

function ComboboxContent({
  children,
  width = "anchor",
  keepMounted = false,
  align = "start",
  side = "bottom",
}: ComboboxContentProps) {
  return (
    <ComboboxPortal keepMounted={keepMounted}>
      <ComboboxPositioner align={align} side={side}>
        <ComboboxPopup width={width} data-slot="combobox-content">
          {children}
        </ComboboxPopup>
      </ComboboxPositioner>
    </ComboboxPortal>
  );
}

const ComboboxPopupHeader = forwardRef<HTMLDivElement, ComboboxPopupHeaderProps>(
  function ComboboxPopupHeader(props, forwardedRef) {
    const styles = stylex.props(comboboxStyles.popupSection, comboboxStyles.popupHeader);
    const defaultProps = {
      ...styles,
      "data-slot": "combobox-popup-header",
    } as useRender.ComponentProps<"div">;
    return useRender({
      defaultTagName: "div",
      props: mergeProps<"div">(defaultProps, props),
      ref: forwardedRef,
    });
  },
);

const ComboboxPopupFooter = forwardRef<HTMLDivElement, ComboboxPopupFooterProps>(
  function ComboboxPopupFooter(props, forwardedRef) {
    const styles = stylex.props(comboboxStyles.popupSection, comboboxStyles.popupFooter);
    const defaultProps = {
      ...styles,
      "data-slot": "combobox-popup-footer",
    } as useRender.ComponentProps<"div">;
    return useRender({
      defaultTagName: "div",
      props: mergeProps<"div">(defaultProps, props),
      ref: forwardedRef,
    });
  },
);

const viewportHeightStyles = {
  s: comboboxStyles.viewportHeightS,
  m: comboboxStyles.viewportHeightM,
  l: comboboxStyles.viewportHeightL,
  available: comboboxStyles.viewportHeightAvailable,
} satisfies Record<ComboboxViewportHeight, unknown>;

const ComboboxViewport = forwardRef<HTMLDivElement, ComboboxViewportProps>(
  function ComboboxViewport({ maxHeight = "m", ...props }, forwardedRef) {
    const styles = stylex.props(
      comboboxStyles.viewport,
      viewportHeightStyles[maxHeight],
      scrollbarStyles.standard,
    );
    const defaultProps = {
      ...styles,
      "data-scrollbar": "standard",
      "data-slot": "combobox-viewport",
    } as useRender.ComponentProps<"div">;
    return useRender({
      defaultTagName: "div",
      props: mergeProps<"div">(defaultProps, props),
      ref: forwardedRef,
    });
  },
);

const ComboboxSeparator = forwardRef<
  ComponentRef<typeof BaseCombobox.Separator>,
  ComboboxSeparatorProps
>(function ComboboxSeparator(props, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseCombobox.Separator.State>((state) => [
    comboboxStyles.separator,
    state.orientation === "horizontal" && comboboxStyles.separatorHorizontal,
    state.orientation === "vertical" && comboboxStyles.separatorVertical,
  ]);
  return <BaseCombobox.Separator {...props} ref={forwardedRef} {...stateStyles} />;
});

const ComboboxClear = forwardRef<ComponentRef<typeof BaseCombobox.Clear>, ComboboxClearProps>(
  function ComboboxClear(
    { label = "Clear selection", keepMounted = false, disabled = false, ...props },
    forwardedRef,
  ) {
    const stateStyles = createStateStyleProps<BaseCombobox.Clear.State>((state) => [
      comboboxStyles.action,
      state.disabled === true && comboboxStyles.actionDisabled,
      state.open === true && comboboxStyles.clearOpen,
      state.visible === true && comboboxStyles.clearVisible,
      state.transitionStatus === "starting" && comboboxStyles.clearStarting,
      state.transitionStatus === "ending" && comboboxStyles.clearEnding,
    ]);
    const iconStyles = stylex.props(comboboxStyles.icon);

    return (
      <BaseCombobox.Clear
        aria-label={label}
        {...props}
        ref={forwardedRef}
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
  },
);

const ComboboxEmpty = forwardRef<ComponentRef<typeof BaseCombobox.Empty>, ComboboxEmptyProps>(
  function ComboboxEmpty({ children, ...props }, forwardedRef) {
    const styles = stylex.props(comboboxStyles.empty);
    return (
      <BaseCombobox.Empty {...props} ref={forwardedRef} {...styles}>
        {children}
      </BaseCombobox.Empty>
    );
  },
);

const ComboboxStatus = forwardRef<ComponentRef<typeof BaseCombobox.Status>, ComboboxStatusProps>(
  function ComboboxStatus({ children, ...props }, forwardedRef) {
    const styles = stylex.props(comboboxStyles.status);
    return (
      <BaseCombobox.Status {...props} ref={forwardedRef} {...styles}>
        {children}
      </BaseCombobox.Status>
    );
  },
);

const ComboboxList = forwardRef<ComponentRef<typeof BaseCombobox.List>, ComboboxListProps>(
  function ComboboxList(props, forwardedRef) {
    const stateStyles = createStateStyleProps<BaseCombobox.List.State>((state) => [
      comboboxStyles.list,
      state.empty === true && comboboxStyles.listEmpty,
    ]);
    return <BaseCombobox.List {...props} ref={forwardedRef} {...stateStyles} />;
  },
);

const ComboboxGroup = forwardRef<ComponentRef<typeof BaseCombobox.Group>, ComboboxGroupProps>(
  function ComboboxGroup(props, forwardedRef) {
    const styles = stylex.props(comboboxStyles.group);
    return <BaseCombobox.Group {...props} ref={forwardedRef} {...styles} />;
  },
);

const ComboboxGroupLabel = forwardRef<
  ComponentRef<typeof BaseCombobox.GroupLabel>,
  ComboboxGroupLabelProps
>(function ComboboxGroupLabel(props, forwardedRef) {
  const styles = stylex.props(comboboxStyles.groupLabel);
  return <BaseCombobox.GroupLabel {...props} ref={forwardedRef} {...styles} />;
});

function ComboboxItemInner<Value>(
  { value, indicator = "check", children, ...props }: ComboboxItemProps<Value>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const stateStyles = createStateStyleProps<BaseCombobox.Item.State>((state) => [
    comboboxStyles.item,
    comboboxStyles.itemInteractive,
    state.highlighted === true && comboboxStyles.itemHighlighted,
    state.selected === true && comboboxStyles.itemSelected,
    state.disabled === true && comboboxStyles.itemDisabled,
  ]);
  return (
    <BaseCombobox.Item {...props} ref={forwardedRef} value={value} {...stateStyles}>
      {children}
      {indicator === "check" ? <ComboboxItemIndicator /> : null}
    </BaseCombobox.Item>
  );
}

const ComboboxItem = forwardRef(ComboboxItemInner) as <Value>(
  props: ComboboxItemProps<Value>,
) => ReactElement | null;

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

const ComboboxItemIndicator = forwardRef<
  ComponentRef<typeof BaseCombobox.ItemIndicator>,
  ComboboxItemIndicatorProps
>(function ComboboxItemIndicator({ keepMounted = false, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseCombobox.ItemIndicator.State>((state) => [
    comboboxStyles.indicator,
    state.selected === true && comboboxStyles.indicatorSelected,
    state.transitionStatus === "starting" && comboboxStyles.indicatorStarting,
    state.transitionStatus === "ending" && comboboxStyles.indicatorEnding,
  ]);
  const iconStyles = stylex.props(comboboxStyles.icon);
  return (
    <BaseCombobox.ItemIndicator
      {...props}
      ref={forwardedRef}
      keepMounted={keepMounted}
      {...stateStyles}
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
    </BaseCombobox.ItemIndicator>
  );
});

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
