export const contextSwitcherRootPropNames = [
  'items',
  'value',
  'defaultValue',
  'onValueChange',
  'defaultOpen',
  'open',
  'onOpenChange',
  'itemToStringLabel',
  'itemToStringValue',
  'isItemEqualToValue',
  'filter',
  'disabled',
] as const

export const contextSwitcherTriggerPropNames = [
  'label',
  'size',
  'width',
  'disabled',
  'tooltip',
] as const

export const contextSwitcherSearchPropNames = ['label', 'placeholder'] as const
export const contextSwitcherContentPropNames = ['width', 'keepMounted', 'align'] as const
export const contextSwitcherViewportPropNames = ['maxHeight'] as const
export const contextSwitcherItemPropNames = ['value', 'indicator'] as const
export const contextSwitcherItemTextPropNames = ['label', 'description'] as const
