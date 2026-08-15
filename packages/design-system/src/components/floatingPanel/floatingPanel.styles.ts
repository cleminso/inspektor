import * as stylex from "@stylexjs/stylex";

import { layerIndexes } from "../../tokens/layers.stylex";
import { borderColors, spatial, surfaceColors } from "../../tokens/semantics.stylex";
import { borderRadii, shadows, spacing } from "../../tokens/value.stylex";

export const floatingPanelStyles = stylex.create({
  root: {
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
    position: "fixed",
    zIndex: layerIndexes.floating,
    bottom: spacing["3xl"],
    left: spacing.xl,
    right: spacing.xl,
  },
  content: {
    borderColor: borderColors.default,
    borderRadius: borderRadii.xs,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: surfaceColors.raised,
    boxShadow: shadows.medium,
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    maxHeight: "min(70vh, 42.5rem)",
    maxWidth: spatial["content-measure"],
    minWidth: 0,
    width: "100%",
  },
  summary: {
    gap: spacing.s,
    paddingBlock: spacing.s,
    paddingInline: spacing.m,
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    minWidth: 0,
  },
  actions: {
    gap: spacing.xs,
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    minWidth: 0,
  },
});
