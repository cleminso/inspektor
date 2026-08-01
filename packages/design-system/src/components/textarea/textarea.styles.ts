import * as stylex from "@stylexjs/stylex";

import {
  backgroundColors,
  borderColors,
  spatial,
  textColors,
} from "../../tokens/semantics.stylex";
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
    outlineColor: borderColors["outline"],
    outlineStyle: "solid",
    outlineWidth: 0,
    resize: "vertical",
    minWidth: 0,
    "::placeholder": {
      color: textColors["text-subtle"],
    },
  },
  heightS: {
    minHeight: spatial["textarea-height-s"],
  },
  heightM: {
    minHeight: spatial["textarea-height-m"],
  },
  heightL: {
    minHeight: spatial["textarea-height-l"],
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
      ":focus": borderColors["border-danger"],
    },
    outlineColor: borderColors["border-danger-subtle"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  disabled: {
    backgroundColor: {
      default: backgroundColors["bg-disabled"],
      ":hover": backgroundColors["bg-disabled"],
    },
    color: textColors["text-disabled"],
    cursor: "not-allowed",
    "::placeholder": {
      color: textColors["text-disabled"],
    },
  },
  readOnly: {
    backgroundColor: {
      default: backgroundColors["bg-secondary"],
      ":hover": backgroundColors["bg-secondary"],
    },
    cursor: "default",
  },
});
