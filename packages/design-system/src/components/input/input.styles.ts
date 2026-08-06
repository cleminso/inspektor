import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, spatial, textColors } from "../../tokens/semantics.stylex";
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
      ":focus": borderColors["border-input"],
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingBlock: 0,
    paddingInline: spacing.xs,
    appearance: "none",
    backgroundColor: backgroundColors["bg-card"],
    boxSizing: "border-box",
    color: textColors["text-default"],
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    outlineColor: borderColors["border-input-ring"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus": spatial["focus-ring-width"],
    },
    minWidth: 0,
    "::placeholder": {
      color: textColors["text-muted"],
    },
  },
  sizeS: {
    height: spatial["control-height-s"],
  },
  sizeM: {
    height: spatial["control-height-m"],
  },
  sizeL: {
    height: spatial["control-height-l"],
  },
  fontSans: {
    fontFamily: fontFamilies.sans,
  },
  fontMono: {
    fontFamily: fontFamilies.mono,
  },
  subtle: {
    borderColor: {
      default: "transparent",
      ":hover": borderColors.border,
      ":focus": borderColors["border-focused"],
    },
    backgroundColor: backgroundColors["bg-subtle"],
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
  invalid: {
    borderColor: {
      default: borderColors["border-danger"],
      ":focus-visible": borderColors["border-danger"],
      ":focus": borderColors["border-danger"],
    },
    outlineColor: borderColors["border-danger-subtle"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: spatial["focus-ring-width"],
      ":focus-visible": spatial["focus-ring-width"],
    },
  },
  valid: {},
  touched: {},
  dirty: {},
  filled: {},
  focused: {},
});
