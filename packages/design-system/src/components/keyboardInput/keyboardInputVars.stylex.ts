/**
 * Inherited variables for KeyboardInput. StyleX requires files that export
 * `stylex.defineVars()` to export nothing else, so this module is separate from
 * `keyboardInput.styles.ts`. Ancestors such as danger-highlighted menu items
 * override these variables to adapt keycap color without prop drilling.
 */
import * as stylex from "@stylexjs/stylex";

import { backgroundColors, textColors } from "../../tokens/semantics.stylex";
import { shadows } from "../../tokens/value.stylex";

export const keyboardInputVars = stylex.defineVars({
  backgroundColor: backgroundColors["bg-subtle"],
  boxShadow: shadows.border,
  textColor: textColors["text-muted"],
});
