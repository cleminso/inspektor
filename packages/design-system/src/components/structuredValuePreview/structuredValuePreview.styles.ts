import * as stylex from "@stylexjs/stylex";

import {
  backgroundColors,
  borderColors,
  syntaxColors,
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
  marker: {
    borderColor: borderColors["border-secondary"],
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    backgroundColor: backgroundColors["bg-subtle"],
    color: textColors["text-secondary"],
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.compact,
  },
  preview: {
    overflow: "hidden",
    color: syntaxColors["syntax-property"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});
