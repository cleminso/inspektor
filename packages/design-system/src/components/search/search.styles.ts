import * as stylex from "@stylexjs/stylex";

import { spatial, textColors } from "../../tokens/semantics.stylex";
import { spacing } from "../../tokens/value.stylex";
import { keyboardInputVars } from "../keyboardInput/keyboardInputVars.stylex";

export const searchStyles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-grid",
  },
  fullWidth: {
    width: "100%",
  },
  input: {
    gridColumnStart: "1",
    gridRowStart: "1",
    paddingInlineStart: spacing["2xl"],
  },
  inputWithShortcut: {
    paddingInlineEnd: spacing["3xl"],
  },
  icon: {
    alignSelf: "center",
    color: textColors["text-muted"],
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
  shortcut: {
    alignItems: "center",
    alignSelf: "center",
    display: "flex",
    gridColumnStart: "1",
    gridRowStart: "1",
    justifySelf: "end",
    marginInlineEnd: spacing.xs,
    pointerEvents: "none",
  },
  shortcutDisabled: {
    [keyboardInputVars.textColor]: textColors["text-disabled"],
  },
});
