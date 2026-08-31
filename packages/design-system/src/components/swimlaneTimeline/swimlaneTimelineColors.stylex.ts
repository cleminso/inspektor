import * as stylex from '@stylexjs/stylex'

import { palette } from '../../tokens/value.stylex'

export const swimlaneTimelineColors = stylex.defineVars({
  activityIndicator: `light-dark(${palette.green500}, ${palette.green400})`,
} as const)
