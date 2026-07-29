// Semantic tokens. Creates design decisions/intent.
// Themes follow: https://stylexjs.com/docs/learn/recipes/light-dark-themes
import * as stylex from '@stylexjs/stylex'

import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  palette,
  dimensions,
  syntaxPalette,
} from './value.stylex'


export const backgroundColors = stylex.defineVars({
  // Surfaces
  'bg-page': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'bg-card': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-popover': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-subtle': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-tab': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'bg-tab-hover': `light-dark(color-mix(in oklch, ${palette.gray100} 35%, ${palette.gray200}), ${palette.neutral900})`,
  'bg-tab-selected': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'bg-table-header': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha200})`,
  'bg-table-header-cell-active': `light-dark(${palette.blue200}, ${palette.blue900})`,
  'bg-table-column-cell-active': `light-dark(${palette.blue100}, ${palette.blue950})`,
  'bg-table-row-cell-active': `light-dark(${palette.blue100}, ${palette.blue950})`,
  'bg-table-row-cell-selected': `light-dark(${palette.blue100}, ${palette.blue950})`,
  'bg-table-cell-active': `light-dark(${palette.blue100}, ${palette.blue950})`,
  'bg-overlay': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-backdrop': `light-dark(${palette.grayAlpha500}, ${palette.neutralAlpha500})`,
  'bg-inverse': `light-dark(${palette.gray900}, ${palette.neutral100})`,

  // Interaction
  'bg-hover': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-pressed': `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200})`,
  'bg-selected': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-disabled': `light-dark(${palette.gray100}, ${palette.neutral900})`,

  // Color roles
  'bg-primary': `light-dark(${palette.blue600}, ${palette.blue700})`,
  'bg-primary-hover': `light-dark(${palette.blue700}, ${palette.blue600})`,
  'bg-secondary': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha200})`,
  'bg-secondary-hover': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'bg-danger': `light-dark(${palette.red100}, ${palette.red950})`,
  'bg-danger-hover': `light-dark(${palette.red200}, ${palette.red900})`,
  'bg-success': `light-dark(${palette.green200}, ${palette.green900})`,
  'bg-warning': `light-dark(${palette.orange100}, ${palette.orange900})`,
  'bg-accent': `light-dark(${palette.yellow400}, ${palette.yellow500})`,

  // Notifications
  'bg-notification-warning': `light-dark(${palette.orange100}, ${palette.orange900})`,
  'bg-notification-error': `light-dark(${palette.red100}, ${palette.red900})`,
  'bg-notification-info': `light-dark(${palette.blue100}, ${palette.blue900})`,
  'bg-notification-loading': `light-dark(${palette.gray100}, ${palette.neutral900})`,
} as const)

export const textColors = stylex.defineVars({
  // Text on neutral surfaces
  'text-default': `light-dark(${palette.gray900}, ${palette.neutral100})`,
  'text-secondary': `light-dark(${palette.grayAlpha900}, ${palette.neutralAlpha900})`,
  'text-muted': `light-dark(${palette.gray600}, ${palette.neutral400})`,
  'text-subtle': `light-dark(${palette.gray500}, ${palette.neutral500})`,
  'text-disabled': `light-dark(${palette.gray400}, ${palette.neutral600})`,
  'text-link': `light-dark(${palette.blue600}, ${palette.blue400})`,
  'text-danger': `light-dark(${palette.red600}, ${palette.red500})`,

  // Text on color-role surfaces
  'fg-primary': `light-dark(${palette.gray50}, ${palette.gray50})`,
  'fg-secondary': `light-dark(${palette.gray900}, ${palette.neutral50})`,
  'fg-danger': `light-dark(${palette.red600}, ${palette.red500})`,
  'fg-success': `light-dark(${palette.green700}, ${palette.green400})`,
  'fg-warning': `light-dark(${palette.orange700}, ${palette.orange400})`,
  'fg-accent': `light-dark(${palette.gray900}, ${palette.neutral50})`,
  'fg-inverse': `light-dark(${palette.gray50}, ${palette.neutral950})`,

  // Notifications
  'fg-notification-warning': `light-dark(${palette.orange700}, ${palette.orange300})`,
  'fg-notification-error': `light-dark(${palette.red700}, ${palette.red300})`,
  'fg-notification-info': `light-dark(${palette.blue700}, ${palette.blue300})`,
  'fg-notification-loading': `light-dark(${palette.gray700}, ${palette.neutral300})`,
} as const)


export const borderColors = stylex.defineVars({
  'border': `light-dark(${palette.gray300}, ${palette.neutral700})`,
  'border-secondary': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'border-focused': `light-dark(${palette.gray400}, ${palette.neutral500})`,

  'border-table-header-cell': `light-dark(${palette.gray300}, ${palette.neutral700})`,
  'border-table-cell': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'border-table-column-active': `light-dark(${palette.blue500}, ${palette.blue500})`,
  'border-table-cell-active': `light-dark(${palette.blue500}, ${palette.blue500})`,

  'border-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'border-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'border-danger-subtle': `light-dark(${palette.red200}, ${palette.red900})`,
  'border-success': `light-dark(${palette.green600}, ${palette.green300})`,

  // Notifications
  'border-notification-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'border-notification-error': `light-dark(${palette.red500}, ${palette.red400})`,
  'border-notification-info': `light-dark(${palette.blue600}, ${palette.blue400})`,
  'border-notification-loading': `light-dark(${palette.gray300}, ${palette.neutral700})`,
} as const)

export const syntaxColors = stylex.defineVars({
  'syntax-attribute': `light-dark(${syntaxPalette.syntaxCyanLight}, ${syntaxPalette.syntaxCyanDark})`,
  'syntax-boolean': `light-dark(${syntaxPalette.syntaxPurpleLight}, ${syntaxPalette.syntaxPurpleDark})`,
  'syntax-comment': `light-dark(${syntaxPalette.syntaxCommentLight}, ${syntaxPalette.syntaxCommentDark})`,
  'syntax-constant': `light-dark(${syntaxPalette.syntaxPurpleLight}, ${syntaxPalette.syntaxPurpleDark})`,
  'syntax-function': `light-dark(${syntaxPalette.syntaxGreenLight}, ${syntaxPalette.syntaxGreenDark})`,
  'syntax-keyword': `light-dark(${syntaxPalette.syntaxPinkLight}, ${syntaxPalette.syntaxPinkDark})`,
  'syntax-number': `light-dark(${syntaxPalette.syntaxPurpleLight}, ${syntaxPalette.syntaxPurpleDark})`,
  'syntax-operator': `light-dark(${syntaxPalette.syntaxPinkLight}, ${syntaxPalette.syntaxPinkDark})`,
  'syntax-property': `light-dark(${syntaxPalette.syntaxForegroundLight}, ${syntaxPalette.syntaxForegroundDark})`,
  'syntax-punctuation': `light-dark(${syntaxPalette.syntaxMutedLight}, ${syntaxPalette.syntaxMutedDark})`,
  'syntax-string': `light-dark(${syntaxPalette.syntaxYellowLight}, ${syntaxPalette.syntaxYellowDark})`,
  'syntax-string-special': `light-dark(${syntaxPalette.syntaxOrangeLight}, ${syntaxPalette.syntaxOrangeDark})`,
  'syntax-tag': `light-dark(${syntaxPalette.syntaxPinkLight}, ${syntaxPalette.syntaxPinkDark})`,
  'syntax-type': `light-dark(${syntaxPalette.syntaxCyanLight}, ${syntaxPalette.syntaxCyanDark})`,
  'syntax-variable': `light-dark(${syntaxPalette.syntaxForegroundLight}, ${syntaxPalette.syntaxForegroundDark})`,
  'syntax-mark-background': `light-dark(${syntaxPalette.syntaxMarkBackgroundLight}, ${syntaxPalette.syntaxMarkBackgroundDark})`,
  'syntax-mark-foreground': `light-dark(${syntaxPalette.syntaxForegroundLight}, ${syntaxPalette.syntaxForegroundDark})`,
} as const)

export const spatial = stylex.defineVars({
  'control-height-xs': dimensions[20],
  'control-height-s': dimensions[24],
  'control-height-m': dimensions[28],
  'control-height-l': dimensions[32],
  'icon-size-xs': dimensions[12],
  'icon-size-s': dimensions[14],
  'icon-size-m': dimensions[16],
  'icon-size-l': dimensions[20],
  'focus-ring-width': dimensions[2],
  'popup-width-s': dimensions[240],
  'popup-width-m': dimensions[320],
  'popup-width-l': dimensions[400],
  'label-width': dimensions[100],
  'tooltip-width': dimensions[180],
  'tab-view-width': dimensions[180],
  'content-measure': dimensions[680],
  'content-width': dimensions[1220],
  'content-width-wide': dimensions[1440],
  'grid-track-s': dimensions[160],
  'grid-track-m': dimensions[240],
  'example-height': dimensions[120],
  'panel-height': dimensions[280],
  'viewport-height-s': dimensions[160],
  'viewport-height-m': dimensions[240],
  'viewport-height-l': dimensions[320],
  'panel-handle-size': dimensions[1],
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
    fontSize: fontSizes[3],
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
export type SyntaxColorToken = StyleXTokenKeys<typeof syntaxColors>
export type ColorToken =
  | BackgroundColorToken
  | TextColorToken
  | BorderColorToken
  | SyntaxColorToken
