import * as stylex from "@stylexjs/stylex";

import { interactiveControlVars } from "../../primitives/interactiveControlVars.stylex";
import {
  backgroundColors,
  borderColors,
  textColors,
  spatial,
} from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

export const checkboxStyles = stylex.create({
  label: {
    [interactiveControlVars.hoverBorderColor]: {
      default: borderColors.border,
      ":hover": borderColors["border-focused"],
    },
    gap: spacing.s,
    alignItems: "center",
    color: textColors["text-default"],
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    userSelect: "none",
  },
  labelRow: {
    boxSizing: "border-box",
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    width: "100%",
  },
  root: {
    margin: 0,
    padding: 0,
    borderColor: {
      default: borderColors.border,
      ":focus-visible": borderColors["border-focused"],
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    alignItems: "center",
    appearance: "none",
    backgroundColor: backgroundColors["bg-card"],
    color: "transparent",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    justifyContent: "center",
    outlineColor: borderColors["border-focused"],
    outlineOffset: 2,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus-visible": spatial["focus-ring-width"],
    },
    position: "relative",
    "::before": {
      content: "",
      position: "absolute",
      transform: "translate(-50%, -50%)",
      height: spatial["control-height-m"],
      left: "50%",
      top: "50%",
      width: spatial["control-height-m"],
    },
  },
  hoverable: {
    borderColor: {
      default: interactiveControlVars.hoverBorderColor,
      ":hover": borderColors["border-focused"],
    },
  },
  sizeS: {
    height: 14,
    width: 14,
  },
  sizeM: {
    height: 16,
    width: 16,
  },
  selected: {
    borderColor: backgroundColors["bg-inverse"],
    backgroundColor: backgroundColors["bg-inverse"],
    color: textColors["fg-inverse"],
  },
  invalid: {
    borderColor: borderColors["border-danger"],
  },
  disabled: {
    borderColor: borderColors["border-secondary"],
    backgroundColor: backgroundColors["bg-disabled"],
    color: textColors["text-disabled"],
    cursor: "not-allowed",
  },
  selectedDisabled: {
    borderColor: borderColors["border-secondary"],
  },
  readOnly: {
    cursor: "default",
  },
  indicator: {
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  icon: {
    display: "block",
    height: "100%",
    width: "100%",
  },
});
