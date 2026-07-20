import * as stylex from "@stylexjs/stylex";

import { spacing } from "../../tokens/value.stylex";

// TODO: when switcher open, the trigger should be styled
export const contextSwitcherStyles = stylex.create({
  triggerContent: {
    flex: "1",
    gap: spacing.s,
    overflow: "hidden",
    alignItems: "center",
    display: "inline-flex",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});
