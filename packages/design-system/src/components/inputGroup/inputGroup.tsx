import { Button as BaseButton } from "@base-ui/react/button";
import { Field as BaseField } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { useContext, useState, type MouseEventHandler, type ReactNode } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { Checkbox } from "../checkbox/checkbox";
import type { CheckboxProps } from "../checkbox/checkbox";
import type { InputSize } from "../input/input";
import { InputGroupContext } from "./inputGroupContext";
import { inputGroupStyles } from "./inputGroup.styles";

export interface InputGroupRootProps
  extends Pick<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** Controls the height of the compound input. */
  size?: InputSize;
  /** Stretches the group to the width of its container. */
  fullWidth?: boolean;
  /** Marks the compound input as invalid. Field.Root supplies this automatically. */
  invalid?: boolean;
  /** Disables the input and every interactive group member. */
  disabled?: boolean;
}

export interface InputGroupPrefixProps
  extends Pick<React.ComponentPropsWithoutRef<"span">, "children"> {
  /** Static content displayed before the editable value. */
  children: ReactNode;
}

export interface InputGroupSuffixProps
  extends Pick<React.ComponentPropsWithoutRef<"span">, "children"> {
  /** Static content displayed after the editable value. */
  children: ReactNode;
}

export interface InputGroupActionProps {
  /** Accessible name for the action. */
  label: string;
  /** Identifies the input controlled by the action. */
  controls?: string;
  /** Exposes toggle state for actions such as password visibility. */
  pressed?: boolean;
  /** Disables the action. */
  disabled?: boolean;
  /** Runs when the action is activated. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Decorative action content. */
  children: ReactNode;
}

export interface InputGroupCheckboxProps {
  /** Accessible name that identifies the value controlled by the checkbox. */
  label: string;
  /** Controls whether the option is checked. */
  checked?: CheckboxProps["checked"];
  /** Sets the initial checked state when uncontrolled. */
  defaultChecked?: CheckboxProps["defaultChecked"];
  /** Runs when checked state changes. */
  onCheckedChange?: CheckboxProps["onCheckedChange"];
  /** Disables the checkbox. */
  disabled?: CheckboxProps["disabled"];
  /** Prevents changes while preserving focus. */
  readOnly?: CheckboxProps["readOnly"];
  /** Visible checkbox label. */
  children: ReactNode;
}

const sizeStyles = {
  s: inputGroupStyles.sizeS,
  m: inputGroupStyles.sizeM,
  l: inputGroupStyles.sizeL,
} satisfies Record<InputSize, unknown>;

const actionSizeStyles = {
  s: inputGroupStyles.actionS,
  m: inputGroupStyles.actionM,
  l: inputGroupStyles.actionL,
} satisfies Record<InputSize, unknown>;

function InputGroupRoot({
  size = "m",
  fullWidth = false,
  invalid = false,
  disabled = false,
  children,
}: InputGroupRootProps) {
  const [focusVisible, setFocusVisible] = useState(false);
  const rootStyleProps = stylex.props(
    inputGroupStyles.root,
    focusVisible === true && inputGroupStyles.focusVisible,
    sizeStyles[size],
    fullWidth === true && inputGroupStyles.fullWidth,
    invalid === true && inputGroupStyles.invalid,
    disabled === true && inputGroupStyles.disabled,
  );

  return (
    <InputGroupContext.Provider value={{ disabled, size }}>
      <div
        {...rootStyleProps}
        data-slot="input-group"
        data-invalid={invalid === true ? "" : undefined}
        data-focus-visible={focusVisible === true ? "" : undefined}
        onFocusCapture={(event) => {
          setFocusVisible(event.target instanceof HTMLElement && event.target.matches(":focus-visible"));
        }}
        onBlurCapture={(event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
            return;
          }

          setFocusVisible(false);
        }}
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  );
}

function InputGroupPrefix({ children }: InputGroupPrefixProps) {
  return (
    <span {...stylex.props(inputGroupStyles.text, inputGroupStyles.prefix)} data-slot="input-group-prefix">
      {children}
    </span>
  );
}

function InputGroupSuffix({ children }: InputGroupSuffixProps) {
  return (
    <span {...stylex.props(inputGroupStyles.text, inputGroupStyles.suffix)} data-slot="input-group-suffix">
      {children}
    </span>
  );
}

function InputGroupAction({
  label,
  controls,
  pressed,
  disabled = false,
  onClick,
  children,
}: InputGroupActionProps) {
  const context = useContext(InputGroupContext);
  const effectiveDisabled = disabled === true || context?.disabled === true;
  const size = context?.size ?? "m";
  const stateStyleProps = createStateStyleProps<BaseButton.State>(() => [
    inputGroupStyles.action,
    actionSizeStyles[size],
    effectiveDisabled === true && inputGroupStyles.memberDisabled,
  ]);

  return (
    <BaseButton
      type="button"
      aria-label={label}
      aria-controls={controls}
      aria-pressed={pressed}
      disabled={effectiveDisabled}
      onClick={onClick}
      {...stateStyleProps}
      data-slot="input-group-action"
    >
      {children}
    </BaseButton>
  );
}

function InputGroupCheckbox({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  readOnly = false,
  children,
}: InputGroupCheckboxProps) {
  const context = useContext(InputGroupContext);
  const effectiveDisabled = disabled === true || context?.disabled === true;
  const fieldStyleProps = stylex.props(
    inputGroupStyles.checkboxField,
    effectiveDisabled === true && inputGroupStyles.memberDisabled,
  );

  return (
    <BaseField.Root
      disabled={effectiveDisabled}
      render={<label {...fieldStyleProps} aria-label={label} data-slot="input-group-checkbox" />}
    >
      <Checkbox
        size="s"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={effectiveDisabled}
        readOnly={readOnly}
      />
      <span>{children}</span>
    </BaseField.Root>
  );
}

export const InputGroup = Object.assign(InputGroupRoot, {
  Root: InputGroupRoot,
  Prefix: InputGroupPrefix,
  Suffix: InputGroupSuffix,
  Action: InputGroupAction,
  Checkbox: InputGroupCheckbox,
});
