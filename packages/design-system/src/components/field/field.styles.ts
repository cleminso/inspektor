import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, spatial, textColors } from "../../tokens/semantics.stylex";
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { inputGroupVars } from "../inputGroup/inputGroupVars.stylex";

export const fieldStyles = stylex.create({
  root: {
    gap: spacing.xs,
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    width: "100%",
  },
  label: {
    gap: spacing.s,
    alignItems: "center",
    color: textColors["text-default"],
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.compact,
  },
  message: {
    margin: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
  },
  description: {
    color: textColors["text-muted"],
  },
  error: {
    color: textColors["text-danger"],
  },
  disabled: {
    color: textColors["text-disabled"],
    cursor: "not-allowed",
  },
  inputGroupInvalid: {
    [inputGroupVars.borderColor]: borderColors["border-danger"],
    [inputGroupVars.focusedBorderColor]: borderColors["border-danger"],
    [inputGroupVars.outlineColor]: borderColors["border-danger-subtle"],
    [inputGroupVars.outlineWidth]: spatial["focus-ring-width"],
  },
  inputGroupDisabled: {
    [inputGroupVars.backgroundColor]: backgroundColors["bg-disabled"],
    [inputGroupVars.textColor]: textColors["text-disabled"],
  },
});
