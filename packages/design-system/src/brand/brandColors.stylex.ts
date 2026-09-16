import * as stylex from '@stylexjs/stylex'

import { borderColors } from '../tokens/semantics.stylex'
import { palette } from '../tokens/value.stylex'

export const brandColors = stylex.defineVars({
  canvas: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  description: `light-dark(${palette.gray500}, ${palette.neutral400})`,
  section: `light-dark(${palette.gray50}, ${palette.neutral950})`,
  sectionBorder: borderColors.default,
} as const)
