import * as stylex from "@stylexjs/stylex";

import { focusColors, spatial } from "../../tokens/semantics.stylex";

export const contextMenuStyles = stylex.create({
  trigger: {
    outlineColor: focusColors.ring,
    outlineOffset: 2,
    outlineStyle: "solid",
    outlineWidth: { default: 0, ":focus-visible": spatial["focus-ring-width"] },
  },
  triggerOpen: {},
  triggerPressed: {},
});
