import * as stylex from "@stylexjs/stylex";

import { textColors } from "../../tokens/semantics.stylex";
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

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
    lineHeight: lineHeights.tight,
  },
  message: {
    margin: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.tight,
  },
  description: {
    color: textColors["text-muted"],
  },
  error: {
    color: textColors["fg-danger"],
  },
  disabled: {
    color: textColors["text-disabled"],
    cursor: "not-allowed",
  },
});
