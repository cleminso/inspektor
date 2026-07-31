import * as stylex from "@stylexjs/stylex";

import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { spatial } from "../../tokens/semantics.stylex";
import { keyboardInputVars } from "./keyboardInputVars.stylex";

export const keyboardInputStyles = stylex.create({
  root: {
    // borderRadius: borderRadii.xs,
    paddingInline: spacing.s,
    alignItems: "center",
    // backgroundColor: keyboardInputVars.backgroundColor,
    // boxShadow: keyboardInputVars.boxShadow,
    // boxSizing: "border-box",
    color: keyboardInputVars.textColor,
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    justifyContent: "center",
    lineHeight: lineHeights.relaxed,
    userSelect: "none",
    whiteSpace: "nowrap",
    minHeight: spatial["control-height-s"],
    minWidth: spatial["control-height-s"],
  },
  glyph: {
    display: "inline-block",
    textAlign: "center",
    minWidth: "1em",
  },
  small: {
    paddingInline: spacing.xs,
    fontSize: fontSizes[1],
    height: spatial["icon-size-m"],
    minHeight: spatial["icon-size-m"],
    minWidth: spatial["icon-size-m"],
  },
});
