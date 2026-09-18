import * as stylex from '@stylexjs/stylex'

import { palette } from '../../tokens/value.stylex'

export const badgeColors = stylex.defineVars({
  background: `light-dark(${palette.blue100}, ${palette.yellow950})`,
  text: `light-dark(${palette.blue600}, ${palette.yellow400})`,
} as const)
