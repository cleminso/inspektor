import * as stylex from "@stylexjs/stylex";

import { borderColors } from "../../tokens/semantics.stylex";

export const contextMenuStyles = stylex.create({
  trigger: {
    outlineColor: borderColors["border-focused"],
    outlineOffset: 2,
    outlineStyle: "solid",
    outlineWidth: { default: 0, ":focus-visible": 2 },
  },
});
