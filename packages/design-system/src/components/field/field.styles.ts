import * as stylex from "@stylexjs/stylex";

import {
  borderColors,
  elementColors,
  focusColors,
  spatial,
  textColors,
} from "../../tokens/semantics.stylex";
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
  hidden: {
    display: "none",
  },
  label: {
    gap: spacing.s,
    alignItems: "center",
    color: textColors.default,
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.compact,
  },
  message: {
    margin: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
  },
  description: {
    color: textColors.muted,
  },
  error: {
    color: textColors.danger,
  },
  disabled: {
    color: textColors.disabled,
    cursor: "not-allowed",
  },
  inputGroupInvalid: {
    [inputGroupVars.borderColor]: borderColors.danger,
    [inputGroupVars.focusedBorderColor]: borderColors.danger,
    [inputGroupVars.outlineColor]: focusColors.ringDanger,
    [inputGroupVars.outlineWidth]: spatial["focus-ring-width"],
  },
  inputGroupDisabled: {
    [inputGroupVars.backgroundColor]: elementColors.disabled,
    [inputGroupVars.textColor]: textColors.disabled,
  },
  rootDisabled: {},
  rootValid: {},
  rootInvalid: {},
  rootTouched: {},
  rootDirty: {},
  rootFilled: {},
  rootFocused: {},
  labelDisabled: {},
  labelValid: {},
  labelInvalid: {},
  labelTouched: {},
  labelDirty: {},
  labelFilled: {},
  labelFocused: {},
  descriptionDisabled: {},
  descriptionValid: {},
  descriptionInvalid: {},
  descriptionTouched: {},
  descriptionDirty: {},
  descriptionFilled: {},
  descriptionFocused: {},
  errorDisabled: {},
  errorValid: {},
  errorInvalid: {},
  errorTouched: {},
  errorDirty: {},
  errorFilled: {},
  errorFocused: {},
  errorStarting: {},
  errorEnding: {},
});
