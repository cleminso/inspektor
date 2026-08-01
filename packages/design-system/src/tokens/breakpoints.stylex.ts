import * as stylex from '@stylexjs/stylex'

export const breakpointValues = stylex.defineConsts({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const)

export const breakpointQueries = stylex.defineConsts({
  belowSm: '@media (max-width: 639px)',
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
} as const)
