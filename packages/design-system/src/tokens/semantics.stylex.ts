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
  // Surfaces
  'bg-page': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'bg-card': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-popover': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-subtle': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-overlay': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-backdrop': `light-dark(${palette.grayAlpha500}, ${palette.neutralAlpha500})`,
  'bg-inverse': `light-dark(${palette.gray900}, ${palette.neutral100})`,

  // Interaction
  'bg-hover': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-pressed': `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200})`,
  'bg-selected': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-disabled': `light-dark(${palette.gray100}, ${palette.neutral900})`,

  // Color roles
  'bg-primary': `light-dark(${palette.blue600}, ${palette.blue400})`,
  'bg-primary-hover': `light-dark(${palette.blue700}, ${palette.blue300})`,
  'bg-secondary': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'bg-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'bg-danger-hover': `light-dark(${palette.red600}, ${palette.red300})`,
  'bg-success': `light-dark(${palette.green600}, ${palette.green400})`,
  'bg-accent': `light-dark(${palette.yellow500}, ${palette.yellow400})`,
} as const)

export const textColors = stylex.defineVars({
  // Text on neutral surfaces
  'text-default': `light-dark(${palette.gray900}, ${palette.neutral50})`,
  'text-muted': `light-dark(${palette.gray600}, ${palette.neutral400})`,
  'text-subtle': `light-dark(${palette.gray500}, ${palette.neutral500})`,
  'text-disabled': `light-dark(${palette.gray400}, ${palette.neutral600})`,
  'text-link': `light-dark(${palette.blue600}, ${palette.blue400})`,
  'text-danger': `light-dark(${palette.red600}, ${palette.red400})`,

  // Text on color-role surfaces
  'fg-primary': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'fg-secondary': `light-dark(${palette.gray900}, ${palette.neutral50})`,
  'fg-danger': `light-dark(${palette.gray50}, ${palette.gray50})`,
  'fg-success': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'fg-accent': `light-dark(${palette.gray900}, ${palette.neutral50})`,
  'fg-inverse': `light-dark(${palette.gray50}, ${palette.neutral950})`,
} as const)


export const borderColors = stylex.defineVars({
  'border': `light-dark(${palette.gray300}, ${palette.neutral700})`,
  'border-secondary': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'border-focused': `light-dark(${palette.gray400}, ${palette.neutral500})`,

  'border-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'border-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'border-danger-subtle': `light-dark(${palette.red200}, ${palette.red900})`,
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
  default: { color: textColors['text-default'] },
  muted: { color: textColors['text-muted'] },
  subtle: { color: textColors['text-subtle'] },
  disabled: { color: textColors['text-disabled'] },

  primary: { color: textColors['fg-primary'] },
  secondary: { color: textColors['fg-secondary'] },
  danger: { color: textColors['text-danger'] },
  error: { color: textColors['text-danger'] },
  success: { color: textColors['fg-success'] },
  accent: { color: textColors['fg-accent'] },
  inverse: { color: textColors['fg-inverse'] },
  inherit: {},
 // inherit color from its parent. Usefull inside components where parents has controls color.
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
