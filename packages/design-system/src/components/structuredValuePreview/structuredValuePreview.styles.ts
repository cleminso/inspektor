import * as stylex from "@stylexjs/stylex";

import {
  backgroundColors,
  borderColors,
  syntaxColors,
  spatial,
  textColors,
} from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";

export const structuredValuePreviewStyles = stylex.create({
  root: {
    gap: spacing.s,
    alignItems: "baseline",
    display: "inline-flex",
    maxWidth: "100%",
    minWidth: 0,
  },
  typedMarker: {
    borderColor: borderColors["border-secondary"],
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    backgroundColor: backgroundColors["bg-subtle"],
    color: textColors["text-secondary"],
    flexShrink: 0,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.compact,
  },
  value: {
    alignItems: "baseline",
    color: syntaxColors["syntax-property"],
    columnGap: spacing.s,
    display: "inline-flex",
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    maxWidth: "100%",
    minWidth: 0,
  },
  markerRail: {
    overflow: "hidden",
    flexShrink: 0,
    textOverflow: "ellipsis",
    width: spatial["control-height-l"],
  },
  preview: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});
