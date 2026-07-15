export const resizablePanelGroupPropNames = [
  "orientation",
  "defaultLayout",
  "disabled",
  "disableCursor",
  "id",
  "onLayoutChange",
  "onLayoutChanged",
  "groupRef",
  "elementRef",
] as const;

export const resizablePanelPropNames = [
  "id",
  "defaultSize",
  "minSize",
  "maxSize",
  "collapsedSize",
  "collapsible",
  "disabled",
  "groupResizeBehavior",
  "onResize",
  "panelRef",
  "elementRef",
] as const;

export const resizableHandlePropNames = [
  "appearance",
  "id",
  "disabled",
  "disableDoubleClick",
  "elementRef",
] as const;
