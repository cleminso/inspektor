/**
 * Inherited variables for InputGroup. StyleX requires files that export
 * `stylex.defineVars()` to export nothing else, so this module is separate from
 * `inputGroup.styles.ts`. `Field` and `InputGroup` override these variables to
 * express invalid and disabled states without prop drilling.
 */
import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, textColors } from "../../tokens/semantics.stylex";

export const inputGroupVars = stylex.defineVars({
  backgroundColor: backgroundColors["bg-card"],
  borderColor: borderColors.border,
  focusedBorderColor: borderColors["border-focused"],
  outlineColor: borderColors["border-danger-subtle"],
  outlineWidth: "0px",
  textColor: textColors["text-default"],
});
