import * as stylex from '@stylexjs/stylex'

import { borderColors, surfaceColors } from '../../tokens/semantics.stylex'

export const scrollAreaColors = stylex.defineVars({
  railBackground: surfaceColors.default,
  railBorder: borderColors.subtle,
} as const)
