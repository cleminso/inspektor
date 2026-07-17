import * as stylex from "@stylexjs/stylex";

export const contextSwitcherStyles = stylex.create({
  triggerContent: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});
