import { Input as BaseInput } from "@base-ui/react/input";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
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
  /** Disables editing and exposes the disabled state to assistive technology. */
  disabled?: BaseInput.Props["disabled"];
  /** Sets the initial value when the input is uncontrolled. */
  defaultValue?: BaseInput.Props["defaultValue"];
  /** Sets the current value when the input is controlled. */
  value?: BaseInput.Props["value"];
  /** Runs when the input value changes. */
  onValueChange?: BaseInput.Props["onValueChange"];
  /** Composes Input behavior and styles onto another input element. */
  render?: BaseInput.Props["render"];
}

export function Input({ size = "m", fullWidth = false, disabled = false, ...props }: InputProps) {
  const stateStyleProps = createStateStyleProps<BaseInput.State>((state) => [
    inputStyles.base,
    sizeStyles[size],
    fullWidth === true && inputStyles.fullWidth,
    state.disabled === true && inputStyles.disabled,
    state.valid === false && inputStyles.invalid,
  ]);

  return (
    <BaseInput
      {...props}
      disabled={disabled}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      data-slot="input"
      data-size={size}
      data-full-width={fullWidth === true ? "" : undefined}
    />
  );
}
