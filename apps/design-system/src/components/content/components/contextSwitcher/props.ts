export const contextSwitcherRootPropNames = [
  "items",
  "value",
  "defaultValue",
  "onValueChange",
  "defaultOpen",
  "open",
  "onOpenChange",
  "itemToStringLabel",
  "itemToStringValue",
  "isItemEqualToValue",
  "filter",
  "disabled",
] as const;

export const contextSwitcherTriggerPropNames = [
  "label",
  "size",
  "width",
  "disabled",
  "title",
] as const;

export const contextSwitcherPopupPropNames = ["width"] as const;
export const contextSwitcherSearchPropNames = ["label", "placeholder"] as const;
export const contextSwitcherContentPropNames = ["maxHeight"] as const;
export const contextSwitcherItemPropNames = ["value", "indicator"] as const;
export const contextSwitcherItemTextPropNames = ["label", "description"] as const;
