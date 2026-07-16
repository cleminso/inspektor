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
    // Editable controls match :focus-visible after pointer focus, so use :focus without a halo.
    borderColor: {
      default: borderColors.border,
      ":focus": borderColors["border-focused"],
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingBlock: 0,
    paddingInline: spacing.m,
    appearance: "none",
    backgroundColor: backgroundColors["bg-card"],
    boxSizing: "border-box",
    color: textColors["text-default"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    outlineColor: borderColors["border-focused"],
    outlineStyle: "solid",
    outlineWidth: 0,
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
  grouped: {
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    flexBasis: "0%",
    flexGrow: "1",
    flexShrink: "1",
    outlineWidth: 0,
    height: "100%",
    minWidth: 0,
  },
  disabled: {
    backgroundColor: backgroundColors["bg-disabled"],
    color: textColors["text-disabled"],
    cursor: "not-allowed",
    "::placeholder": {
      color: textColors["text-disabled"],
    },
  },
  readOnly: {
    backgroundColor: backgroundColors["bg-secondary"],
    cursor: "default",
  },
  invalid: {
    borderColor: {
      default: borderColors["border-danger"],
      ":focus-visible": borderColors["border-danger"],
    },
    outlineColor: borderColors["border-danger-subtle"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: 2,
  },
});
