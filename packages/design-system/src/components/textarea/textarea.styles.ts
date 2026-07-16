import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, textColors } from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

export const textareaStyles = stylex.create({
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
    paddingBlock: spacing.s,
    paddingInline: spacing.m,
    appearance: "none",
    backgroundColor: backgroundColors["bg-card"],
    boxSizing: "border-box",
    color: textColors["text-default"],
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    outlineColor: borderColors["border-focused"],
    outlineStyle: "solid",
    outlineWidth: 0,
    resize: "vertical",
    minWidth: 0,
    "::placeholder": {
      color: textColors["text-subtle"],
    },
  },
  heightS: {
    minHeight: 72,
  },
  heightM: {
    minHeight: 112,
  },
  heightL: {
    minHeight: 160,
  },
  fontSans: {
    fontFamily: fontFamilies.sans,
  },
  fontMono: {
    fontFamily: fontFamilies.mono,
  },
  fullWidth: {
    width: "100%",
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
});
