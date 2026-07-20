// Primitive tokens value
import * as stylex from "@stylexjs/stylex";


export const paletteValues = stylex.defineConsts({
  white: 'oklch(1 0 0)',
  black: 'oklch(0 0 0)',

  gray50:  'oklch(0.985 0 none)',
  gray100: 'oklch(0.97 0 none)',
  gray200: 'oklch(0.922 0 none)',
  gray300: 'oklch(0.87 0 none)',
  gray400: 'oklch(0.708 0 none)',
  gray500: 'oklch(0.556 0 none)',
  gray600: 'oklch(0.439 0 none)',
  gray700: 'oklch(0.371 0 none)',
  gray800: 'oklch(0.269 0 none)',
  gray900: 'oklch(0.205 0 none)',
  gray950: 'oklch(0.145 0 none)',

  // Dark tint on light surfaces
  grayAlpha50:  'oklch(0.145 0 none / 0.03)',
  grayAlpha100: 'oklch(0.145 0 none / 0.06)',
  grayAlpha200: 'oklch(0.145 0 none / 0.10)',
  grayAlpha300: 'oklch(0.145 0 none / 0.16)',
  grayAlpha400: 'oklch(0.145 0 none / 0.24)',
  grayAlpha500: 'oklch(0.145 0 none / 0.36)',
  grayAlpha600: 'oklch(0.145 0 none / 0.48)',
  grayAlpha700: 'oklch(0.145 0 none / 0.60)',
  grayAlpha800: 'oklch(0.145 0 none / 0.72)',
  grayAlpha900: 'oklch(0.145 0 none / 0.84)',
  grayAlpha950: 'oklch(0.145 0 none / 0.92)',

  neutral50:  'oklch(0.985 0 none)',
  neutral100: 'oklch(0.97 0 none)',
  neutral200: 'oklch(0.922 0 none)',
  neutral300: 'oklch(0.87 0 none)',
  neutral400: 'oklch(0.708 0 none)',
  neutral500: 'oklch(0.556 0 none)',
  neutral600: 'oklch(0.439 0 none)',
  neutral700: 'oklch(0.371 0 none)',
  neutral800: 'oklch(0.269 0 none)',
  neutral900: 'oklch(0.205 0 none)',
  neutral950: 'oklch(0.145 0 none)',

  // Light tint on dark surfaces
  neutralAlpha50:  'oklch(0.985 0 none / 0.03)',
  neutralAlpha100: 'oklch(0.985 0 none / 0.06)',
  neutralAlpha200: 'oklch(0.985 0 none / 0.10)',
  neutralAlpha300: 'oklch(0.985 0 none / 0.16)',
  neutralAlpha400: 'oklch(0.985 0 none / 0.24)',
  neutralAlpha500: 'oklch(0.985 0 none / 0.36)',
  neutralAlpha600: 'oklch(0.985 0 none / 0.48)',
  neutralAlpha700: 'oklch(0.985 0 none / 0.60)',
  neutralAlpha800: 'oklch(0.985 0 none / 0.72)',
  neutralAlpha900: 'oklch(0.985 0 none / 0.84)',
  neutralAlpha950: 'oklch(0.985 0 none / 0.92)',

  /* from blue (100%) @ shade 600 */
  blue50: 'oklch(0.971 0.014 266.435)',
  blue100: 'oklch(0.933 0.032 266.52)',
  blue200: 'oklch(0.884 0.056 265.85)',
  blue300: 'oklch(0.81 0.095 265.027)',
  blue400: 'oklch(0.707 0.152 265.695)',
  blue500: 'oklch(0.624 0.202 266.274)',
  blue600: 'oklch(0.555 0.245 266.681)',
  blue700: 'oklch(0.496 0.243 266.681)',
  blue800: 'oklch(0.431 0.199 266.681)',
  blue900: 'oklch(0.385 0.146 266.681)',
  blue950: 'oklch(0.287 0.091 266.681)',

  /* from red (100%) shade at 400 */
  red50: 'oklch(0.971 0.013 22.22)',
  red100: 'oklch(0.936 0.032 22.22)',
  red200: 'oklch(0.884 0.061 22.263)',
  red300: 'oklch(0.805 0.111 22.219)',
  red400: 'oklch(0.702 0.189 22.166)',
  red500: 'oklch(0.637 0.237 22.22)',
  red600: 'oklch(0.585 0.236 23.699)',
  red700: 'oklch(0.511 0.207 23.511)',
  red800: 'oklch(0.444 0.177 22.22)',
  red900: 'oklch(0.396 0.141 22.22)',
  red950: 'oklch(0.258 0.092 22.22)',

  /* blend from green (74%) + lime (26%) at shade 400 */
  green50: 'oklch(0.983 0.021 145.1)',
  green100: 'oklch(0.963 0.048 145.1)',
  green200: 'oklch(0.928 0.093 145.1)',
  green300: 'oklch(0.877 0.159 145.1)',
  green400: 'oklch(0.803 0.215 145.1)',
  green500: 'oklch(0.733 0.222 145.1)',
  green600: 'oklch(0.631 0.196 145.1)',
  green700: 'oklch(0.527 0.155 145.1)',
  green800: 'oklch(0.448 0.12 145.1)',
  green900: 'oklch(0.395 0.096 145.1)',
  green950: 'oklch(0.267 0.067 145.1)',

  /* from orange (100%) at shade 400 */
  orange50: 'oklch(0.978 0.014 62.743)',
  orange100: 'oklch(0.949 0.033 62.889)',
  orange200: 'oklch(0.894 0.069 60.341)',
  orange300: 'oklch(0.826 0.119 59.519)',
  orange400: 'oklch(0.746 0.18 56.712)',
  orange500: 'oklch(0.707 0.185 50.806)',
  orange600: 'oklch(0.648 0.17 50.36)',
  orange700: 'oklch(0.555 0.148 49.5)',
  orange800: 'oklch(0.472 0.128 48.476)',
  orange900: 'oklch(0.41 0.112 47.49)',
  orange950: 'oklch(0.267 0.073 47.925)',

  /* from yellow (100%) at shade 400 */
  yellow50: 'oklch(0.985 0.025 96.531)',
  yellow100: 'oklch(0.966 0.069 99.177)',
  yellow200: 'oklch(0.934 0.127 98.365)',
  yellow300: 'oklch(0.893 0.181 96.386)',
  yellow400: 'oklch(0.854 0.174 89.626)',
  yellow500: 'oklch(0.797 0.163 89.461)',
  yellow600: 'oklch(0.683 0.14 89.057)',
  yellow700: 'oklch(0.556 0.114 88.375)',
  yellow800: 'oklch(0.478 0.098 88.263)',
  yellow900: 'oklch(0.422 0.086 89.751)',
  yellow950: 'oklch(0.287 0.059 89.208)',
} as const)

export const palette = stylex.defineVars(paletteValues)

export const fontSizes = stylex.defineVars({
  1: '0.75rem', // 12
  2: '0.875rem', // 14
  3: '1rem', // 16
  4: '1.25rem', // 20
  5: '1.5rem', // 24
  6: '1.875rem', // 30
  7: '2.25rem', // 36
} as const)

export const lineHeights = stylex.defineVars({
  none: '1',
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.625',
} as const)

export const fontWeights = stylex.defineVars({
  regular: '400',
  medium: '500',
} as const)

export const letterSpacings = stylex.defineVars({
  tight: '-0.02em',
  normal: '0',
} as const)

export const fontFamilies = stylex.defineVars({
  sans: "'Geist', 'Inter', sans-serif",
  mono: "'GeistMono', monospace",
} as const)

export const spacing = stylex.defineVars({
  none: '0',
  xxs: '2px',
  xs: '4px',
  s: '6px',
  m: '8px',
  l: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
  '5xl': '64px',
} as const)

export const dimensions = stylex.defineVars({
  1: '1px',
  2: '2px',
  12: '12px',
  14: '14px',
  16: '16px',
  20: '20px',
  24: '24px',
  28: '28px',
  32: '32px',
  100: '100px',
  120: '120px',
  160: '160px',
  180: '180px',
  224: '224px',
  240: '240px',
  280: '280px',
  320: '320px',
  400: '400px',
  680: '680px',
  1220: '1220px',
  1440: '1440px',
} as const)

export const borderRadii = stylex.defineVars({
  none: '0',
  xs: '2px',
  s: '3px',
  m: '4px',
  l: '6px',
  xl: '8px',
} as const)

export const shadows = stylex.defineVars({
  none: 'none',
  border: `0 0 0 1px light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200})`,
  small: `0 0 0 1px light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200}), 0 2px 2px ${palette.grayAlpha100}`,
  medium: `0 0 0 1px light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200}), 0 2px 2px ${palette.grayAlpha100}, 0 8px 8px -8px ${palette.grayAlpha200}`,
} as const)

export const breakpoints = stylex.defineConsts({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const)

// Remove keys that are not actual design tokens
type StyleXTokenKeys<T> = Exclude<
  keyof T,
  '__opaqueId' | '__tokens' | symbol | 'toString' | 'valueOf' | 'description'
>

export type PaletteToken = StyleXTokenKeys<typeof palette>
export type FontSizeToken = StyleXTokenKeys<typeof fontSizes>
export type LineHeightToken = StyleXTokenKeys<typeof lineHeights>
export type FontWeightToken = StyleXTokenKeys<typeof fontWeights>
export type LetterSpacingToken = StyleXTokenKeys<typeof letterSpacings>
export type FontFamilyToken = StyleXTokenKeys<typeof fontFamilies>
export type SpacingToken = StyleXTokenKeys<typeof spacing>
export type BorderRadiusToken = StyleXTokenKeys<typeof borderRadii>
export type ShadowToken = StyleXTokenKeys<typeof shadows>
export type BreakpointKey = keyof typeof breakpoints
