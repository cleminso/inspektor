export const menuRootPropNames = ["defaultOpen", "open", "onOpenChange", "disabled"] as const;
export const menuTriggerPropNames = ["disabled", "render"] as const;
export const menuContentPropNames = [
  "align",
  "keepMounted",
  "side",
  "width",
] as const;
export const menuPositionerPropNames = ["side", "align"] as const;
export const menuItemPropNames = ["variant", "disabled", "closeOnClick"] as const;
export const menuLinkItemPropNames = ["closeOnClick"] as const;
export const menuCheckboxItemPropNames = [
  "checked",
  "defaultChecked",
  "onCheckedChange",
  "disabled",
  "closeOnClick",
] as const;
export const menuRadioItemPropNames = ["value", "disabled", "closeOnClick"] as const;
