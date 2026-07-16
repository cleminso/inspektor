import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, textColors } from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

export const inputStyles = stylex.create({
  base: {
    margin: 0,
    borderColor: {
      default: borderColors.border,
      ":focus": borderColors["border-focused"],
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    outline: "none",
    paddingBlock: 0,
    paddingInline: spacing.m,
    appearance: "none",
    backgroundColor: backgroundColors["bg-card"],
    boxSizing: "border-box",
    color: textColors["text-default"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    minWidth: 0,
    "::placeholder": {
      color: textColors["text-subtle"],
    },
  },
  sizeS: {
    height: 24,
  },
  sizeM: {
    height: 28,
  },
  sizeL: {
    height: 32,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    backgroundColor: backgroundColors["bg-disabled"],
    color: textColors["text-disabled"],
    cursor: "not-allowed",
  },
  invalid: {
    borderColor: borderColors["border-danger"],
  },
});
