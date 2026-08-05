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
  spacing,
  syntaxPalette,
} from './value.stylex'

export const backgroundColors = stylex.defineVars({
  // Surfaces
  'bg-page': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'bg-layout': `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha100})`,
  'bg-card': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-popover': `light-dark(${palette.gray100}, ${palette.neutral900})`,
  'bg-subtle': `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  'bg-tab': `light-dark(${palette.gray50}, ${palette.neutral950})`,
  'bg-tab-hover': `light-dark(color-mix(in oklch, ${palette.gray100} 35%, ${palette.gray200}), ${palette.neutral900})`,
  'bg-tab-selected': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'bg-table-header': `light-dark(${palette.gray100}, ${palette.neutral900})`,
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
} as const)

export const textColors = stylex.defineVars({
  // Text on neutral surfaces
  'text-default': `light-dark(${palette.gray900}, ${palette.neutral100})`,
  'text-secondary': `light-dark(${palette.grayAlpha900}, ${palette.neutralAlpha900})`,
  'text-muted': `light-dark(${palette.gray600}, ${palette.neutral400})`,
  'text-disabled': `light-dark(${palette.gray400}, ${palette.neutral600})`,
  'text-link': `light-dark(${palette.blue600}, ${palette.blue400})`,
  'text-selected': `light-dark(${palette.blue700}, ${palette.blue400})`,
  'text-success': `light-dark(${palette.green700}, ${palette.green400})`,
  'text-warning': `light-dark(${palette.orange700}, ${palette.orange400})`,
  'text-danger': `light-dark(${palette.red700}, ${palette.red500})`,

  // Text on color-role surfaces
  'text-on-primary': palette.gray50,
  'text-on-inverse': `light-dark(${palette.gray50}, ${palette.neutral950})`,
} as const)

export const borderColors = stylex.defineVars({
  border: `light-dark(${palette.gray300}, ${palette.neutral700})`,
  'border-secondary': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'border-focused': `light-dark(${palette.gray400}, ${palette.neutral500})`,

  'border-table-header-cell': `light-dark(${palette.gray300}, ${palette.neutral700})`,
  'border-table-cell': `light-dark(${palette.gray200}, ${palette.neutral800})`,
  'border-table-column-active': `light-dark(${palette.blue500}, ${palette.blue500})`,
  'outline': `light-dark(${palette.blue500}, ${palette.blue500})`,
  'border-table-cell-active': `light-dark(${palette.blue500}, ${palette.blue500})`,

  'border-warning': `light-dark(${palette.orange600}, ${palette.orange400})`,
  'border-danger': `light-dark(${palette.red500}, ${palette.red400})`,
  'border-danger-subtle': `light-dark(${palette.red200}, ${palette.red900})`,
  'border-success': `light-dark(${palette.green600}, ${palette.green300})`,
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
  'syntax-mark-active-background': `light-dark(${syntaxPalette.syntaxMarkActiveBackgroundLight}, ${syntaxPalette.syntaxMarkActiveBackgroundDark})`,
  'syntax-mark-foreground': `light-dark(${syntaxPalette.syntaxForegroundLight}, ${syntaxPalette.syntaxForegroundDark})`,
} as const)

export const spatial = stylex.defineVars({
  'button-height-xs': dimensions[20],
  'button-height-s': dimensions[22],
  'button-height-m': dimensions[24],
  'control-height-xs': dimensions[20],
  'control-height-s': dimensions[24],
  'control-height-m': dimensions[28],
  'control-height-l': dimensions[32],
  'control-inner-height-s': `calc(${dimensions[24]} - 2px)`,
  'control-inner-height-m': `calc(${dimensions[28]} - 2px)`,
  'control-inner-height-l': `calc(${dimensions[32]} - 2px)`,
  'content-measure': dimensions[680],
  'content-width': dimensions[1220],
  'content-width-wide': dimensions[1440],
  'example-height': dimensions[120],
  'find-bar-status-width': dimensions[72],
  'focus-ring-width': dimensions[2],
  'grid-track-s': dimensions[160],
  'grid-track-m': dimensions[240],
  'icon-size-xs': dimensions[12],
  'icon-size-s': dimensions[14],
  'icon-size-m': dimensions[16],
  'label-width': dimensions[100],
  'menu-min-width': dimensions[140],
  'combobox-min-width': dimensions[200],
  'combobox-trigger-width-s': dimensions[200],
  'combobox-trigger-width-m': dimensions[280],
  'multi-select-width-s': dimensions[240],
  'multi-select-width-m': dimensions[280],
  'multi-select-width-l': dimensions[360],
  'popup-collection-padding': spacing.xxs,
  'popup-item-inline-padding': spacing.s,
  'popup-row-min-height': dimensions[22],
  'popup-row-min-height-m': dimensions[24],
  'popup-row-min-height-l': dimensions[28],
  'popup-width-s': dimensions[240],
  'popup-width-m': dimensions[320],
  'popup-width-l': dimensions[400],
  'panel-height': dimensions[280],
  'panel-bar-height': dimensions[40],
  'panel-handle-size': dimensions[1],
  'panel-gutter-size': spacing.xs,
  'scrollbar-track-size': dimensions[12],
  'scrollbar-thumb-size': spacing.s,
  'select-min-width': dimensions[160],
  'switch-height-s': dimensions[16],
  'switch-height-m': dimensions[20],
  'switch-width-s': dimensions[28],
  'switch-width-m': dimensions[36],
  'switch-thumb-s': dimensions[12],
  'switch-thumb-m': dimensions[14],
  'tab-height': dimensions[26],
  'textarea-height-s': dimensions[72],
  'textarea-height-m': dimensions[112],
  'textarea-height-l': dimensions[160],
  'toast-min-height': dimensions[56],
  'tooltip-width': dimensions[180],
  'tab-view-width': dimensions[180],
  'viewport-height-s': dimensions[160],
  'viewport-height-m': dimensions[240],
  'viewport-height-l': dimensions[320],
  'screen-height-dynamic': '100dvh',
  'screen-height-small': '100svh',
} as const)

export const textRoleStyles = stylex.create({
  default: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[3],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.compact,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
  },
  heading: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[4],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
})

type StyleXTokenKeys<T> = Exclude<
  keyof T,
  '__opaqueId' | '__tokens' | symbol | 'toString' | 'valueOf' | 'description'
>

export type BackgroundColorToken = StyleXTokenKeys<typeof backgroundColors>
export type TextColorToken = StyleXTokenKeys<typeof textColors>
export type BorderColorToken = StyleXTokenKeys<typeof borderColors>
export type SyntaxColorToken = StyleXTokenKeys<typeof syntaxColors>
export type ColorToken = BackgroundColorToken | TextColorToken | BorderColorToken | SyntaxColorToken
