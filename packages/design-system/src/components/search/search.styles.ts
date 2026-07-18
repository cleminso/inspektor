import * as stylex from "@stylexjs/stylex";

import { spatial, textColors } from "../../tokens/semantics.stylex";
import { spacing } from "../../tokens/value.stylex";

export const searchStyles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-grid",
  },
  fullWidth: {
    width: "100%",
  },
  input: {
    gridColumnStart: '1',
    gridRowStart: '1',
    paddingInlineStart: spacing["2xl"],
  },
  icon: {
    alignSelf: "center",
    color: textColors["text-subtle"],
    gridColumnStart: "1",
    gridRowStart: "1",
    marginInlineStart: spacing.m,
    pointerEvents: "none",
    height: spatial["icon-size-s"],
    width: spatial["icon-size-s"],
  },
  iconDisabled: {
    color: textColors["text-disabled"],
  },
});
