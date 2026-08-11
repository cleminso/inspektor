import * as stylex from "@stylexjs/stylex";

import {
  borderColors,
  elementColors,
  focusColors,
  ghostElementColors,
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
  focused: {
    borderColor: inputGroupVars.focusedBorderColor,
    outlineWidth: spatial["focus-ring-width"],
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
  fullWidth: {
    width: "100%",
  },
  invalid: {
    [inputGroupVars.borderColor]: borderColors.danger,
    [inputGroupVars.focusedBorderColor]: borderColors.danger,
    [inputGroupVars.outlineColor]: focusColors.ringDanger,
    [inputGroupVars.outlineWidth]: spatial["focus-ring-width"],
  },
  disabled: {
    [inputGroupVars.backgroundColor]: elementColors.disabled,
    [inputGroupVars.textColor]: textColors.disabled,
  },
  text: {
    paddingInline: spacing.m,
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    whiteSpace: "nowrap",
  },
  prefix: {
    borderInlineEndColor: borderColors.subtle,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: textColors.muted,
  },
  suffix: {
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors.muted,
  },
  action: {
    margin: 0,
    padding: 0,
    alignItems: "center",
    appearance: "none",
    backgroundColor: {
      default: "transparent",
      ":hover": ghostElementColors.hover,
      ":active": ghostElementColors.pressed,
    },
    borderBlockEndWidth: 0,
    borderBlockStartWidth: 0,
    borderInlineEndWidth: 0,
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors.muted,
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    justifyContent: "center",
    outlineColor: focusColors.ring,
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus-visible": spatial["focus-ring-width"],
    },
  },
  actionPressed: {
    backgroundColor: {
      default: ghostElementColors.selected,
      ":hover": ghostElementColors.hover,
      ":active": ghostElementColors.pressed,
    },
  },
  actionXS: {
    width: `calc(${spatial["control-height-xs"]} - 2px)`,
  },
  actionS: {
    width: `calc(${spatial["control-height-s"]} - 2px)`,
  },
  actionM: {
    width: `calc(${spatial["control-height-m"]} - 2px)`,
  },
  actionL: {
    width: `calc(${spatial["control-height-l"]} - 2px)`,
  },
  checkboxField: {
    gap: spacing.s,
    paddingInline: spacing.m,
    alignItems: "center",
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    color: textColors.muted,
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    whiteSpace: "nowrap",
  },
  memberDisabled: {
    backgroundColor: {
      default: "transparent",
      ":hover": "transparent",
      ":active": "transparent",
    },
    color: textColors.disabled,
    cursor: "not-allowed",
    outlineWidth: 0,
  },
  actionDisabled: {},
  checkboxDisabled: {},
  checkboxValid: {},
  checkboxInvalid: {},
  checkboxTouched: {},
  checkboxDirty: {},
  checkboxFilled: {},
  checkboxFocused: {},
});
