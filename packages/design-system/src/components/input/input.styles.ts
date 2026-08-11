import * as stylex from "@stylexjs/stylex";

import {
  borderColors,
  elementColors,
  focusColors,
  spatial,
  surfaceColors,
  textColors,
} from "../../tokens/semantics.stylex";
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
      default: borderColors.default,
      ":focus": borderColors.focused,
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingBlock: 0,
    paddingInline: spacing.xs,
    appearance: "none",
    backgroundColor: surfaceColors.default,
    boxSizing: "border-box",
    color: textColors.default,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    outlineColor: focusColors.ringSubtle,
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus": spatial["focus-ring-width"],
    },
    minWidth: 0,
    "::placeholder": {
      color: textColors.muted,
    },
  },
  sizeXS: {
    height: spatial["control-height-xs"],
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
      ":hover": borderColors.default,
      ":focus": borderColors.focused,
    },
    backgroundColor: surfaceColors.subtle,
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
      default: elementColors.disabled,
      ":hover": elementColors.disabled,
    },
    color: textColors.disabled,
    cursor: "not-allowed",
    "::placeholder": {
      color: textColors.disabled,
    },
  },
  readOnly: {
    backgroundColor: {
      default: elementColors.default,
      ":hover": elementColors.default,
    },
    cursor: "default",
  },
  invalid: {
    borderColor: {
      default: borderColors.danger,
      ":focus-visible": borderColors.danger,
      ":focus": borderColors.danger,
    },
    outlineColor: focusColors.ringDanger,
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
