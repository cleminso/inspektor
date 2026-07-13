// Primitive tokens value
import * as stylex from "@stylexjs/stylex";


export const paletteValues = stylex.defineConsts({
  // Base
  white: 'oklch(1 0 0)',
  black: 'oklch(0 0 0)',

  // Light-mode gray (Zedokai-light)
  gray50: 'oklch(0.988 0 180)', // lightest surface background
  gray100: 'oklch(0.977 0 171.87)', // main background
  gray150: 'oklch(0.95 0 171.254)', // panel/subheader/status/tab background
  gray200: 'oklch(0.94 0 171.254)', // title bar background
  gray250: 'oklch(0.9 0 171.254)', // highlight/search match surface
  gray300: 'oklch(0.887 0 180)', // selected/disabled border, element background
  gray325: 'oklch(0.875 0 180)', // terminal black
  gray350: 'oklch(0.850 0 180)', // border
  gray400: 'oklch(0.722 0 180)', // line number
  gray500: 'oklch(0.567 0 194.036)', // comment/focused foreground
  gray600: 'oklch(0.448 0 164.055)', // muted/secondary foreground, punctuation
  gray700: 'oklch(0.378 0 180)',
  gray800: 'oklch(0.209 0 201.801)', // primary foreground


  // Dark-mode neutral (Zedokai)
  neutral50: 'oklch(0.991 0.003 106.448)', // primary foreground
  neutral400: 'oklch(0.661 0.002 325.597)', // muted/secondary foreground
  neutral500: 'oklch(0.548 0.004 325.63)', // comment/focused foreground
  neutral600: 'oklch(0.467 0.005 314.771)', // low-emphasis foreground
  neutral700: 'oklch(0.391 0.0077 317.73)', // border
  neutral725: 'oklch(0.3759 0.0078 317.73)', // highlight surface
  neutral750: 'oklch(0.3669 0.0057 314.75)', // raised dark surface
  neutral800: 'oklch(0.314 0.008 317.721)', // panel/subheader background
  neutral850: 'oklch(0.2898 0.0083 317.72)', // main background
  neutral900: 'oklch(0.211 0.0042 308.24)', // disabled/selected border, drop target

  // Red - Danger
  red400: 'oklch(0.664 0.185 18.101)', // danger/error/deleted, keyword/operator/tag
  red500: 'oklch(0.645 0.207 18.268)',
  red550: 'oklch(0.614 0.185 18.101)',
  red600: 'oklch(0.597 0.191 18.101)',

  // Green - Success
  green300: 'oklch(0.836 0.142 130.714)', // success/created, function/label/link uri
  green600: 'oklch(0.619 0.13 159.216)',

  // Orange - Warning
  orange400: 'oklch(0.774 0.136 46.202)', // warning/conflict/modified, string special
  orange600: 'oklch(0.645 0.172 39.135)',

  // Yellow - Info
  yellow400: 'oklch(0.894 0.139 90.467)', // info/accent, string/title
  yellow600: 'oklch(0.654 0.145 64.328)',

  // Purple - Accent
  purple300: 'oklch(0.741 0.121 290.676)', // boolean/constant/number/preproc/variable special
  purple500: 'oklch(0.535 0.154 291.137)',

  // Cyan - Accent
  cyan300: 'oklch(0.838 0.095 205.656)', // type/attribute
  cyan600: 'oklch(0.594 0.102 219.889)',

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
