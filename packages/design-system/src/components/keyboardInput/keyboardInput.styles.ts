import * as stylex from "@stylexjs/stylex";

import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { keyboardInputVars } from "./keyboardInputVars.stylex";

export const keyboardInputStyles = stylex.create({
  root: {
    borderRadius: borderRadii.s,
    paddingInline: spacing.xs,
    alignItems: "center",
    backgroundColor: keyboardInputVars.backgroundColor,
    boxShadow: keyboardInputVars.boxShadow,
    boxSizing: "border-box",
    color: keyboardInputVars.textColor,
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.medium,
    justifyContent: "center",
    lineHeight: lineHeights.none,
    userSelect: "none",
    whiteSpace: "nowrap",
    minHeight: 24,
    minWidth: 24,
  },
  glyph: {
    display: "inline-block",
    textAlign: "center",
    minWidth: "1em",
  },
  small: {
    paddingInline: spacing.xs,
    fontSize: fontSizes[1],
    minHeight: 20,
    minWidth: 20,
  },
});
