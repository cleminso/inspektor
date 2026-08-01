import * as stylex from "@stylexjs/stylex";

import { borderColors, spatial } from "../../tokens/semantics.stylex";

export const contextMenuStyles = stylex.create({
  trigger: {
    outlineColor: borderColors["outline"],
    outlineOffset: 2,
    outlineStyle: "solid",
    outlineWidth: { default: 0, ":focus-visible": spatial["focus-ring-width"] },
  },
});
