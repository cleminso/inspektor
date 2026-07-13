import * as stylex from "@stylexjs/stylex";

import {
  backgroundColors,
  borderColors,
  textColors,
} from "../../tokens/semantics.stylex";
import { borderRadii } from "../../tokens/value.stylex";

export const checkboxStyles = stylex.create({
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
    backgroundColor: backgroundColors["bg-surface-1"],
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
      ":focus-visible": 2,
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
    color: textColors["text-inverse"],
  },
  invalid: {
    borderColor: borderColors["border-danger"],
  },
  disabled: {
    backgroundColor: backgroundColors["bg-primary"],
    color: textColors["text-disabled"],
    cursor: "not-allowed",
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
