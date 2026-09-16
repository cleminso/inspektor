import * as stylex from '@stylexjs/stylex'

import { palette } from '../tokens/value.stylex'

export const brandColors = stylex.defineVars({
  canvas: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  description: `light-dark(${palette.gray500}, ${palette.neutral400})`,
  surface: `light-dark(${palette.gray50}, ${palette.neutral950})`,
} as const)
