import * as stylex from '@stylexjs/stylex'

import { palette } from '../../tokens/value.stylex'

export const checkboxColors = stylex.defineVars({
  disabledCheckedBackground: `light-dark(${palette.gray400}, ${palette.neutral600})`,
} as const)
