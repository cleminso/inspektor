import { Input as BaseInput } from "@base-ui/react/input";

import { useContext } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { InputGroupContext } from "../inputGroup/inputGroupContext";
import { inputStyles } from "./input.styles";

export type InputSize = "s" | "m" | "l";

const sizeStyles = {
  s: inputStyles.sizeS,
  m: inputStyles.sizeM,
  l: inputStyles.sizeL,
} satisfies Record<InputSize, unknown>;

export interface InputProps extends Omit<BaseInput.Props, "className" | "style" | "size"> {
  /** Controls the input height. */
  size?: InputSize;
  /** Stretches the input to the width of its container. */
  fullWidth?: boolean;
  /** Marks the input as invalid and exposes that state to assistive technology. */
  invalid?: boolean;
  /** Disables editing and exposes the disabled state to assistive technology. */
  disabled?: BaseInput.Props["disabled"];
  /** Prevents editing while preserving focus and text selection. */
  readOnly?: BaseInput.Props["readOnly"];
  /** Sets the initial value when the input is uncontrolled. */
  defaultValue?: BaseInput.Props["defaultValue"];
  /** Sets the current value when the input is controlled. */
  value?: BaseInput.Props["value"];
  /** Runs when the input value changes. */
  onValueChange?: BaseInput.Props["onValueChange"];
  /** Composes Input behavior and styles onto another input element. */
  render?: BaseInput.Props["render"];
}

export function Input({
  size = "m",
  fullWidth = false,
  invalid = false,
  disabled = false,
  readOnly = false,
  ...props
}: InputProps) {
  const inputGroup = useContext(InputGroupContext);
  const effectiveDisabled = disabled === true || inputGroup?.disabled === true;
  const effectiveSize = inputGroup?.size ?? size;
  const stateStyleProps = createStateStyleProps<BaseInput.State>((state) => [
    inputStyles.base,
    sizeStyles[effectiveSize],
    fullWidth === true && inputStyles.fullWidth,
    inputGroup !== null && inputStyles.grouped,
    state.disabled === true && inputStyles.disabled,
    readOnly === true && inputStyles.readOnly,
    (invalid === true || state.valid === false) && inputStyles.invalid,
  ]);

  return (
    <BaseInput
      {...props}
      disabled={effectiveDisabled}
      readOnly={readOnly}
      aria-invalid={invalid === true ? true : props["aria-invalid"]}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      data-slot="input"
      data-size={size}
      data-full-width={fullWidth === true ? "" : undefined}
      data-grouped={inputGroup !== null ? "" : undefined}
    />
  );
}
