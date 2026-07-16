import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentPropsWithoutRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { textareaStyles } from "./textarea.styles";

export type TextareaHeight = "s" | "m" | "l";
export type TextareaFont = "sans" | "mono";

export interface TextareaProps
  extends Omit<
    ComponentPropsWithoutRef<"textarea">,
    "className" | "style" | "rows" | "cols" | "onChange"
  > {
  /** Controls the minimum editor height. */
  height?: TextareaHeight;
  /** Selects proportional or code-oriented typography. */
  font?: TextareaFont;
  /** Stretches the textarea to the width of its container. */
  fullWidth?: boolean;
  /** Marks the textarea as invalid and exposes that state to assistive technology. */
  invalid?: boolean;
  /** Disables editing and focus. */
  disabled?: boolean;
  /** Prevents editing while preserving focus and text selection. */
  readOnly?: boolean;
  /** Sets the initial value when uncontrolled. */
  defaultValue?: string;
  /** Sets the current value when controlled. */
  value?: string;
  /** Runs when the textarea value changes. */
  onValueChange?: (value: string) => void;
}

const heightStyles = {
  s: textareaStyles.heightS,
  m: textareaStyles.heightM,
  l: textareaStyles.heightL,
} satisfies Record<TextareaHeight, unknown>;

const fontStyles = {
  sans: textareaStyles.fontSans,
  mono: textareaStyles.fontMono,
} satisfies Record<TextareaFont, unknown>;

export function Textarea({
  height = "m",
  font = "sans",
  fullWidth = true,
  invalid = false,
  disabled = false,
  readOnly = false,
  defaultValue,
  value,
  onValueChange,
  ...props
}: TextareaProps) {
  const stateStyleProps = createStateStyleProps<BaseField.Control.State>((state) => [
    textareaStyles.base,
    heightStyles[height],
    fontStyles[font],
    fullWidth === true && textareaStyles.fullWidth,
    state.disabled === true && textareaStyles.disabled,
    readOnly === true && textareaStyles.readOnly,
    (invalid === true || state.valid === false) && textareaStyles.invalid,
  ]);
  const controlProps = props as Omit<BaseField.Control.Props, "className" | "style">;

  return (
    <BaseField.Control
      {...controlProps}
      render={<textarea />}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid === true ? true : props["aria-invalid"]}
      {...stateStyleProps}
      data-slot="textarea"
      data-height={height}
      data-font={font}
    />
  );
}
