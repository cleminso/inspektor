import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, spatial, textColors } from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { inputGroupVars } from "./inputGroupVars.stylex";

export const inputGroupStyles = stylex.create({
  root: {
    borderColor: inputGroupVars.borderColor,
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "stretch",
    backgroundColor: inputGroupVars.backgroundColor,
    boxSizing: "border-box",
    color: inputGroupVars.textColor,
    display: "flex",
    outlineColor: inputGroupVars.outlineColor,
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: inputGroupVars.outlineWidth,
    minWidth: 0,
  },
  focusVisible: {
    borderColor: inputGroupVars.focusedBorderColor,
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
  fullWidth: {
    width: "100%",
  },
  invalid: {
    [inputGroupVars.borderColor]: borderColors["border-danger"],
    [inputGroupVars.focusedBorderColor]: borderColors["border-danger"],
    [inputGroupVars.outlineColor]: borderColors["border-danger-subtle"],
    [inputGroupVars.outlineWidth]: spatial["focus-ring-width"],
  },
  disabled: {
    [inputGroupVars.backgroundColor]: backgroundColors["bg-disabled"],
    [inputGroupVars.textColor]: textColors["text-disabled"],
  },
  text: {
    paddingInline: spacing.m,
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    whiteSpace: "nowrap",
  },
  prefix: {
    borderInlineEndColor: borderColors["border-secondary"],
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: textColors["text-muted"],
  },
  suffix: {
    borderInlineStartColor: borderColors["border-secondary"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors["text-muted"],
  },
  action: {
    margin: 0,
    padding: 0,
    alignItems: "center",
    appearance: "none",
    backgroundColor: {
      default: "transparent",
      ":hover": backgroundColors["bg-hover"],
      ":active": backgroundColors["bg-pressed"],
    },
    borderBlockEndWidth: 0,
    borderBlockStartWidth: 0,
    borderInlineEndWidth: 0,
    borderInlineStartColor: borderColors["border-secondary"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors["text-muted"],
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    justifyContent: "center",
    outlineColor: borderColors["border-focused"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus-visible": spatial["focus-ring-width"],
    },
  },
  actionPressed: {
    backgroundColor: {
      default: backgroundColors["bg-selected"],
      ":hover": backgroundColors["bg-hover"],
      ":active": backgroundColors["bg-pressed"],
    },
  },
  actionS: {
    width: 22,
  },
  actionM: {
    width: 26,
  },
  actionL: {
    width: 30,
  },
  checkboxField: {
    gap: spacing.s,
    paddingInline: spacing.m,
    alignItems: "center",
    borderInlineStartColor: borderColors["border-secondary"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors["text-muted"],
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.tight,
    whiteSpace: "nowrap",
  },
  memberDisabled: {
    backgroundColor: {
      default: "transparent",
      ":hover": "transparent",
      ":active": "transparent",
    },
    color: textColors["text-disabled"],
    cursor: "not-allowed",
    outlineWidth: 0,
  },
});
