import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import * as stylex from "@stylexjs/stylex";
import { forwardRef, type ComponentPropsWithRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { checkboxStyles } from "./checkbox.styles";

export type CheckboxSize = "s" | "m";
export type CheckboxLabelLayout = "content" | "row";

const sizeStyles = {
  s: checkboxStyles.sizeS,
  m: checkboxStyles.sizeM,
} satisfies Record<CheckboxSize, unknown>;

export interface CheckboxProps
  extends Omit<BaseCheckbox.Root.Props, "children" | "className" | "style"> {
  /** Controls the checkbox dimensions. */
  size?: CheckboxSize;
  /** Controls whether the checkbox is checked. */
  checked?: BaseCheckbox.Root.Props["checked"];
  /** Sets the initial checked state when uncontrolled. */
  defaultChecked?: BaseCheckbox.Root.Props["defaultChecked"];
  /** Runs when the checked state changes. */
  onCheckedChange?: BaseCheckbox.Root.Props["onCheckedChange"];
  /** Displays a mixed state. */
  indeterminate?: BaseCheckbox.Root.Props["indeterminate"];
  /** Identifies the checkbox during form submission. */
  name?: BaseCheckbox.Root.Props["name"];
  /** Sets the submitted value when checked. */
  value?: BaseCheckbox.Root.Props["value"];
  /** Sets the submitted value when unchecked. */
  uncheckedValue?: BaseCheckbox.Root.Props["uncheckedValue"];
  /** Disables interaction. */
  disabled?: BaseCheckbox.Root.Props["disabled"];
  /** Prevents changes while preserving interaction semantics. */
  readOnly?: BaseCheckbox.Root.Props["readOnly"];
  /** Requires the checkbox to be checked for valid form submission. */
  required?: BaseCheckbox.Root.Props["required"];
  /** Indicates that a composed root renders a native button. */
  nativeButton?: BaseCheckbox.Root.Props["nativeButton"];
  /** Provides access to the hidden native input. */
  inputRef?: BaseCheckbox.Root.Props["inputRef"];
  /** Composes Checkbox behavior and styles onto another element. */
  render?: BaseCheckbox.Root.Props["render"];
}

export interface CheckboxLabelProps
  extends Omit<ComponentPropsWithRef<"label">, "className" | "style"> {
  /** Controls whether the label sizes to its content or fills a selectable row. */
  layout?: CheckboxLabelLayout;
}

const CheckboxRoot = forwardRef<HTMLElement, CheckboxProps>(function CheckboxRoot(
  {
    size = "m",
    disabled = false,
    readOnly = false,
    required = false,
    indeterminate = false,
    nativeButton = false,
    ...props
  },
  forwardedRef,
) {
  const stateStyleProps = createStateStyleProps<BaseCheckbox.Root.State>((state) => [
    checkboxStyles.root,
    sizeStyles[size],
    state.checked === false &&
      state.indeterminate === false &&
      state.disabled === false &&
      state.readOnly === false &&
      state.valid !== false &&
      checkboxStyles.hoverable,
    (state.checked === true || state.indeterminate === true) && checkboxStyles.selected,
    state.valid === false && checkboxStyles.invalid,
    state.disabled === true && checkboxStyles.disabled,
    state.disabled === true &&
      (state.checked === true || state.indeterminate === true) &&
      checkboxStyles.selectedDisabled,
    state.readOnly === true && checkboxStyles.readOnly,
  ]);
  const indicatorStylexProps = stylex.props(checkboxStyles.indicator);
  const iconStylexProps = stylex.props(checkboxStyles.icon);

  return (
    <BaseCheckbox.Root
      {...props}
      ref={forwardedRef}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      indeterminate={indeterminate}
      nativeButton={nativeButton}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      data-slot="checkbox"
    >
      <BaseCheckbox.Indicator
        className={indicatorStylexProps.className}
        style={indicatorStylexProps.style}
        data-slot="checkbox-indicator"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <svg
              aria-hidden="true"
              className={iconStylexProps.className}
              style={iconStylexProps.style}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d={state.indeterminate === true ? "M4 8h8" : "m3 8 3 3 7-7"} />
            </svg>
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
});

const CheckboxLabel = forwardRef<HTMLLabelElement, CheckboxLabelProps>(function CheckboxLabel(
  { layout = "content", ...props },
  forwardedRef,
) {
  const labelStylexProps = stylex.props(
    checkboxStyles.label,
    layout === "row" && checkboxStyles.labelRow,
  );

  return (
    <label
      {...props}
      ref={forwardedRef}
      className={labelStylexProps.className}
      style={labelStylexProps.style}
      data-slot="checkbox-label"
      data-layout={layout}
    />
  );
});

export const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Label: CheckboxLabel,
});
