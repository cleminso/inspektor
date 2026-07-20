export const tabViewRootPropNames = ['value', 'defaultValue', 'onValueChange'] as const

export const tabViewListPropNames = [
  'aria-label',
  'aria-labelledby',
  'activateOnFocus',
  'loopFocus',
] as const

export const tabViewItemPropNames = [
  'value',
  'prefix',
  'disabled',
  'onClose',
  'closeLabel',
] as const

export const tabViewPanelPropNames = ['value', 'keepMounted'] as const
