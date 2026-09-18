import * as stylex from '@stylexjs/stylex'

import {
  elementColors,
  focusColors,
  ghostElementColors,
  surfaceColors,
  textColors,
} from '../../tokens/semantics.stylex'
import { palette } from '../../tokens/value.stylex'

export const workspaceTabsColors = stylex.defineVars({
  background: surfaceColors.background,
  hoverBackground: `light-dark(color-mix(in oklch, ${palette.gray100} 35%, ${palette.gray200}), ${palette.neutral900})`,
  selectedBackground: elementColors.selected,
  disabledBackground: ghostElementColors.default,
  buttonBackground: ghostElementColors.default,
  text: textColors.muted,
  hoverText: textColors.secondary,
  selectedText: textColors.default,
  disabledText: textColors.disabled,
  closeBackdrop: surfaceColors.background,
  closeIcon: textColors.muted,
  closeIconHover: textColors.default,
  focusRing: focusColors.ring,
} as const)
