// Semantic tokens. Creates design decisions/intent.
// Themes follow: https://stylexjs.com/docs/learn/recipes/light-dark-themes
import * as stylex from '@stylexjs/stylex'

import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  palette,
} from './value.stylex'


export const backgroundColors = stylex.defineVars({
  'bg-surface-1': `light-dark(${palette.gray50}, ${palette.neutral900})`,
  'bg-primary': `light-dark(${palette.gray100}, ${palette.neutral850})`,
  'bg-secondary': `light-dark(${palette.gray200}, ${palette.neutral750})`,
  'bg-surface-hover': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'bg-surface-selected': `light-dark(${palette.gray200}, ${palette.neutral850})`,
  'bg-surface-highlight': `light-dark(${palette.gray250}, ${palette.neutral725})`,
  'bg-danger': `light-dark(${palette.red500}, ${palette.red600})`,
  'bg-danger-hover': `light-dark(${palette.red400}, ${palette.red500})`,
  'bg-inverse': `light-dark(${palette.gray800}, ${palette.neutral50})`,
} as const)


export const textColors = stylex.defineVars({
  'text-primary': `light-dark(${palette.gray800}, ${palette.neutral50})`,
  'text-secondary': `light-dark(${palette.gray600}, ${palette.neutral400})`,
  'text-tertiary': `light-dark(${palette.gray500}, ${palette.neutral500})`,
  'text-disabled': `light-dark(${palette.gray400}, ${palette.neutral600})`,

  'text-accent': `light-dark(${palette.yellow600}, ${palette.yellow400})`,
  'text-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'text-success': `light-dark(${palette.green600}, ${palette.green300})`,
  'text-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'text-info': `light-dark(${palette.yellow400}, ${palette.yellow400})`,
  'text-constant': `light-dark(${palette.purple500}, ${palette.purple300})`,
  'text-type': `light-dark(${palette.cyan600}, ${palette.cyan300})`,
  'text-inverse': `light-dark(${palette.gray50}, ${palette.neutral900})`,
  'text-light': `light-dark(${palette.gray50}, ${palette.gray50})`
} as const)


export const borderColors = stylex.defineVars({
  'border': `light-dark(${palette.gray350}, ${palette.neutral700})`,
  'border-secondary': `light-dark(${palette.gray250}, ${palette.neutral700})`,
  'border-focused': `light-dark(${palette.gray500}, ${palette.neutral800})`,

  'border-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'border-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'border-success': `light-dark(${palette.green600}, ${palette.green300})`,
} as const)

const md = '@media (min-width: 768px)'

export const textRoleStyles = stylex.create({
  default: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.medium,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.tight,
  },
  'heading-l': {
    fontFamily: fontFamilies.sans,
    fontSize: { default: fontSizes[7], [md]: fontSizes[7] },
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.medium,
    letterSpacing: '0em',
  },
  'heading-m': {
    fontFamily: fontFamilies.sans,
    fontSize: { default: fontSizes[6], [md]: fontSizes[7] },
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.medium,
    letterSpacing: '0em',
  },
  'heading-s': {
    fontFamily: fontFamilies.sans,
    fontSize: { default: fontSizes[5], [md]: fontSizes[6] },
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: '0em',
  },
  'heading-xs': {
    fontFamily: fontFamilies.sans,
    fontSize: { default: fontSizes[4], [md]: fontSizes[5] },
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
  },
})

export const textColorStyles = stylex.create({
  default: { color: textColors['text-primary'] },
  muted: { color: textColors['text-secondary'] },
  subtle: { color: textColors['text-tertiary'] },
  disabled: { color: textColors['text-disabled'] },

  accent: { color: textColors['text-accent'] },
  danger: { color: textColors['text-danger'] },
  error: { color: textColors['text-danger'] },
  warning: { color: textColors['text-warning'] },
  success: { color: textColors['text-success'] },
  info: { color: textColors['text-info'] },

  type: { color: textColors['text-type'] },
  constant: { color: textColors['text-constant'] },

  inverse: { color: `light-dark(${palette.neutral50}, ${palette.gray800})` },
  inherit: {}, // inherit color from its parent. Usefull inside components where parents has controls color.
})

type StyleXTokenKeys<T> = Exclude<
  keyof T,
  '__opaqueId' | '__tokens' | symbol | 'toString' | 'valueOf' | 'description'
>

export type BackgroundColorToken = StyleXTokenKeys<typeof backgroundColors>
export type TextColorToken = StyleXTokenKeys<typeof textColors>
export type BorderColorToken = StyleXTokenKeys<typeof borderColors>
export type ColorToken =
  | BackgroundColorToken
  | TextColorToken
  | BorderColorToken
