import * as stylex from "@stylexjs/stylex";

import { backgroundColors, borderColors, spatial, textColors } from "../../tokens/semantics.stylex";
import { borderRadii, fontFamilies, fontSizes, lineHeights, spacing } from "../../tokens/value.stylex";
import { codeEditorVars } from "./codeEditorVars.stylex";

export const codeEditorStyles = stylex.create({
  root: {
    [codeEditorVars.backgroundColor]: backgroundColors["bg-card"],
    borderColor: {
      default: borderColors.border,
      ":focus-within": borderColors["border-focused"],
    },
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: codeEditorVars.backgroundColor,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    minWidth: 0,
    width: "100%",
  },
  rootFill: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  invalid: {
    borderColor: {
      default: borderColors["border-danger"],
      ":focus-within": borderColors["border-danger"],
    },
    outlineColor: borderColors["border-danger-subtle"],
    outlineOffset: 0,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  disabled: {
    [codeEditorVars.backgroundColor]: backgroundColors["bg-disabled"],
    color: textColors["text-disabled"],
    cursor: "not-allowed",
  },
  readOnly: {
    [codeEditorVars.backgroundColor]: backgroundColors["bg-secondary"],
  },
  viewport: {
    minHeight: 0,
    minWidth: 0,
    width: "100%",
  },
  viewportExpandedFill: {
    overflow: "hidden",
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  fallbackInput: {
    padding: spacing.m,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    outlineWidth: 0,
    resize: "none",
    minHeight: spatial["viewport-height-s"],
    width: "100%",
  },
  loadError: {
    padding: spacing.xs,
    borderColor: borderColors.border,
    borderStyle: "solid",
    color: textColors["text-danger"],
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    borderTopWidth: 1,
  },
  toolbar: {
    padding: spacing.xs,
    borderColor: borderColors.border,
    borderStyle: "solid",
    borderWidth: 0,
    gap: spacing.xxs,
    alignItems: "center",
    backgroundColor: backgroundColors["bg-secondary"],
    display: "flex",
    justifyContent: "flex-end",
    borderTopWidth: 1,
  },
  icon: {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    display: "block",
    height: spatial["icon-size-s"],
    width: spatial["icon-size-s"],
  },
});
