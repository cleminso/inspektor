import * as stylex from "@stylexjs/stylex";

import { borderColors, focusColors, spatial } from "../tokens/semantics.stylex";

export const editableControlStyles = stylex.create({
  focusVisible: {
    borderColor: {
      default: borderColors.default,
      ":focus-visible": borderColors.focused,
    },
    outlineColor: focusColors.ringSubtle,
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus-visible": spatial["focus-ring-width"],
    },
  },
});
