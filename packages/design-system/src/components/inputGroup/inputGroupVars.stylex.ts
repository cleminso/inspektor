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
