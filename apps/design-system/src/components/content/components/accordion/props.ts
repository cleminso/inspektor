export const accordionRootPropNames = [
  'defaultValue',
  'value',
  'onValueChange',
  'layout',
  'multiple',
  'disabled',
] as const

export const accordionItemPropNames = ['value', 'disabled'] as const
export const accordionHeaderPropNames = ['level', 'render'] as const
export const accordionTriggerPropNames = ['suffix'] as const
export const accordionPanelPropNames = ['keepMounted', 'hiddenUntilFound'] as const
