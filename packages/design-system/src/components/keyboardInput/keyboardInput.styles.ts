import * as stylex from "@stylexjs/stylex";

import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { borderColors, spatial } from "../../tokens/semantics.stylex";
import { keyboardInputVars } from "./keyboardInputVars.stylex";

export const keyboardInputStyles = stylex.create({
  root: {
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingInline: spacing.s,
    alignItems: "center",
    boxSizing: "border-box",
    color: keyboardInputVars.textColor,
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    justifyContent: "center",
    lineHeight: lineHeights.ui,
    userSelect: "none",
    whiteSpace: "nowrap",
    minHeight: spatial["control-height-m"],
    minWidth: spatial["control-height-m"],
  },
  default: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: borderColors.default,
  },
  glyph: {
    display: "inline-block",
    textAlign: "center",
    minWidth: "1em",
  },
  small: {
    paddingInline: spacing.xs,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    height: spatial["icon-size-m"],
    minHeight: spatial["icon-size-m"],
    minWidth: spatial["icon-size-m"],
  },
});
