import * as stylex from '@stylexjs/stylex'

import { palette } from '../tokens/value.stylex'

export const brandColors = stylex.defineVars({
  canvas: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  description: `light-dark(${palette.gray500}, ${palette.neutral400})`,
  actionHover: `light-dark(${palette.black}, ${palette.white})`,
  actionPressed: `light-dark(${palette.gray800}, ${palette.neutral100})`,
  selectionBackground: `light-dark(${palette.gray300}, ${palette.neutral700})`,
  selectionText: `light-dark(${palette.gray900}, ${palette.neutral50})`,
  surface: `light-dark(${palette.gray50}, ${palette.neutral950})`,
} as const)
