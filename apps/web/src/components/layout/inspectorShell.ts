import type { CSSProperties } from "react";

export const inspectorShellStyle = {
  "--inspector-detail-pane-width": "25rem",
  "--inspector-rail-width": "3.5rem",
} as CSSProperties;

export const inspectorRailWidthClassName = "w-(--inspector-rail-width)";
export const inspectorContentMaxWidthClassName = "max-w-(--inspector-detail-pane-width)";
