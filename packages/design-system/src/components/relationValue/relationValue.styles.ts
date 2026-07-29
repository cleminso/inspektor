import * as stylex from "@stylexjs/stylex";

import { textColors } from "../../tokens/semantics.stylex";
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

export const relationValueStyles = stylex.create({
  compact: {
    gap: spacing.xs,
    alignItems: "center",
    display: "inline-flex",
    minWidth: 0,
  },
  compactId: {
    color: textColors["text-default"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    overflowWrap: "anywhere",
  },
  compactMissing: {
    color: textColors["text-danger"],
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
  arrow: {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.25,
    display: "block",
    height: 12,
    width: 12,
  },
  details: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  fields: {
    margin: 0,
    gap: spacing.m,
    display: "grid",
    minWidth: 0,
  },
  field: {
    margin: 0,
    gap: spacing.xs,
    display: "grid",
    minWidth: 0,
  },
  label: {
    color: textColors["text-muted"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
  value: {
    margin: 0,
    color: textColors["text-default"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    overflowWrap: "anywhere",
  },
  displayValue: {
    margin: 0,
    gap: spacing.s,
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minWidth: 0,
  },
  groupValue: {
    margin: 0,
    minWidth: 0,
  },
  groupActions: {
    gap: spacing.s,
    alignItems: "center",
    display: "flex",
  },
});
