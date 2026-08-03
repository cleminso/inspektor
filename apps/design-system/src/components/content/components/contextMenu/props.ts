export const contextMenuRootPropNames = [
  "defaultOpen",
  "open",
  "onOpenChange",
  "disabled",
] as const;
export const contextMenuContentPropNames = [
  "align",
  "keepMounted",
  "side",
] as const;
export const contextMenuItemPropNames = ["variant", "disabled", "closeOnClick", "render"] as const;
export const contextMenuLinkItemPropNames = ["closeOnClick", "render"] as const;
export const contextMenuCheckboxItemPropNames = ["disabled", "closeOnClick", "render"] as const;
export const contextMenuRadioItemPropNames = ["value", "disabled", "closeOnClick", "render"] as const;
