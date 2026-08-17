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

/** Structural colors for application surfaces and overlays. */
export const surfaceColors = stylex.defineVars({
  background: `light-dark(${palette.gray50}, ${palette.neutral950})`,
  default: `light-dark(${palette.gray100}, ${palette.neutral900})`,
  raised: `light-dark(${palette.gray100}, ${palette.neutral900})`,
  canvas: `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha100})`,
  subtle: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha200})`,
  overlay: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  backdrop: `light-dark(${palette.grayAlpha500}, ${palette.neutralAlpha500})`,
  inverse: `light-dark(${palette.gray900}, ${palette.neutral100})`,
} as const)

/** Neutral filled-element colors for interactive states. */
export const elementColors = stylex.defineVars({
  default: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha200})`,
  hover: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  pressed: `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200})`,
  selected: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  disabled: `light-dark(${palette.gray100}, ${palette.neutral900})`,
} as const)

/** Transparent element colors for low-emphasis interactions. */
export const ghostElementColors = stylex.defineVars({
  default: 'transparent',
  hover: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  pressed: `light-dark(${palette.grayAlpha200}, ${palette.neutralAlpha200})`,
  selected: `light-dark(${palette.grayAlpha100}, ${palette.neutralAlpha100})`,
  disabled: `light-dark(${palette.gray100}, ${palette.neutral900})`,
} as const)

/** Accent element colors for primary interactions. */
export const accentElementColors = stylex.defineVars({
  default: `light-dark(${palette.blue600}, ${palette.blue700})`,
  hover: `light-dark(${palette.blue700}, ${palette.blue600})`,
  pressed: `light-dark(${palette.blue700}, ${palette.blue600})`,
  disabled: `light-dark(${palette.gray100}, ${palette.neutral900})`,
} as const)

/** Danger element colors for destructive interactions. */
export const dangerElementColors = stylex.defineVars({
  default: `light-dark(${palette.red500}, ${palette.red500})`,
  hover: `light-dark(${palette.red600}, ${palette.red600})`,
  pressed: `light-dark(${palette.red700}, ${palette.red700})`,
  disabled: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  subtle: `light-dark(${palette.red200}, ${palette.red950})`,
} as const)

/** Colors that communicate selected content and controls. */
export const selectionColors = stylex.defineVars({
  background: `light-dark(${palette.blue100}, ${palette.blue950})`,
  strongBackground: `light-dark(${palette.blue200}, ${palette.blue900})`,
  border: `light-dark(${palette.blue500}, ${palette.blue500})`,
  text: `light-dark(${palette.blue700}, ${palette.blue400})`,
} as const)

/** Colors that identify pending mutations without implying validation severity. */
export const stagedChangeColors = stylex.defineVars({
  background: `light-dark(${palette.yellow100}, ${palette.yellow800})`,
  border: `light-dark(${palette.orange600}, ${palette.yellow400})`,
} as const)

/** Semantic foreground colors for text and icons. */
export const textColors = stylex.defineVars({
  default: `light-dark(${palette.gray900}, ${palette.neutral100})`,
  secondary: `light-dark(${palette.grayAlpha900}, ${palette.neutralAlpha900})`,
  muted: `light-dark(${palette.gray600}, ${palette.neutral400})`,
  placeholder: `light-dark(${palette.gray600}, ${palette.neutral400})`,
  disabled: `light-dark(${palette.gray400}, ${palette.neutral600})`,
  accent: `light-dark(${palette.blue700}, ${palette.yellow400})`,
  link: `light-dark(${palette.blue600}, ${palette.blue400})`,
  success: `light-dark(${palette.green700}, ${palette.green400})`,
  warning: `light-dark(${palette.orange700}, ${palette.orange400})`,
  danger: `light-dark(${palette.red700}, ${palette.red500})`,
  onAccent: palette.gray50,
  onInverse: `light-dark(${palette.gray50}, ${palette.neutral950})`,
  onDanger: `light-dark(${palette.gray100}, ${palette.gray100})`,
} as const)

/** Semantic border colors for hierarchy, state, and feedback. */
export const borderColors = stylex.defineVars({
  default: `light-dark(${palette.gray300}, ${palette.neutral700})`,
  subtle: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  strong: `light-dark(${palette.gray400}, ${palette.neutral500})`,
  focused: `light-dark(${palette.blue500}, ${palette.blue500})`,
  selected: `light-dark(${palette.blue500}, ${palette.blue500})`,
  disabled: `light-dark(${palette.gray200}, ${palette.neutral800})`,
  warning: `light-dark(${palette.orange600}, ${palette.orange400})`,
  danger: `light-dark(${palette.red500}, ${palette.red400})`,
  dangerSubtle: `light-dark(${palette.red200}, ${palette.red900})`,
  success: `light-dark(${palette.green600}, ${palette.green300})`,
} as const)

/** Focus-ring colors for keyboard focus affordances. */
export const focusColors = stylex.defineVars({
  ring: `light-dark(${palette.blue500}, ${palette.blue500})`,
  ringSubtle: `light-dark(${palette.blue200}, ${palette.blue900})`,
  ringDanger: `light-dark(${palette.red200}, ${palette.red900})`,
} as const)

/** Semantic colors used by syntax-highlighted content. */
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

/** Semantic dimensions and spacing for shared interface patterns. */
export const spatial = stylex.defineVars({
  'control-height-xs': dimensions[20],
  'control-height-s': dimensions[22],
  'control-height-m': dimensions[24],
  'control-height-l': dimensions[28],
  'collection-row-height-s': dimensions[22],
  'collection-row-height-m': dimensions[24],
  'collection-row-height-l': dimensions[28],
  'collection-row-height-xl': dimensions[32],
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
  'interaction-target-min': dimensions[28],
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
  'popup-width-s': dimensions[240],
  'popup-width-m': dimensions[320],
  'popup-width-l': dimensions[400],
  'panel-height': dimensions[280],
  'panel-bar-height': dimensions[40],
  'panel-handle-size': dimensions[1],
  'panel-gutter-size': spacing.xs,
  'scrollbar-track-size': dimensions[12],
  'scrollbar-thumb-size': spacing.s,
  'switch-height-s': dimensions[16],
  'switch-height-m': '1.125rem',
  'switch-width-s': dimensions[32],
  'switch-width-m': dimensions[36],
  'switch-thumb-s': dimensions[16],
  'switch-thumb-m': '1.125rem',
  'tab-height': dimensions[26],
  'textarea-height-s': dimensions[72],
  'textarea-height-m': dimensions[112],
  'textarea-height-l': dimensions[160],
  'toast-min-height': dimensions[56],
  'tooltip-width': dimensions[180],
  'viewport-height-s': dimensions[160],
  'viewport-height-m': dimensions[240],
  'viewport-height-l': dimensions[320],
  'screen-height-dynamic': '100dvh',
  'screen-height-small': '100svh',
} as const)

/** Typography styles for shared interface text roles. */
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

export type SurfaceColorToken = StyleXTokenKeys<typeof surfaceColors>
export type ElementColorToken = StyleXTokenKeys<typeof elementColors>
export type GhostElementColorToken = StyleXTokenKeys<typeof ghostElementColors>
export type AccentElementColorToken = StyleXTokenKeys<typeof accentElementColors>
export type DangerElementColorToken = StyleXTokenKeys<typeof dangerElementColors>
export type SelectionColorToken = StyleXTokenKeys<typeof selectionColors>
export type StagedChangeColorToken = StyleXTokenKeys<typeof stagedChangeColors>
export type BackgroundColorToken =
  | `surface-${SurfaceColorToken}`
  | `element-${ElementColorToken}`
  | `ghost-element-${GhostElementColorToken}`
  | `accent-element-${AccentElementColorToken}`
  | `danger-element-${DangerElementColorToken}`
  | 'selection-background'
  | 'selection-strong-background'
export type TextColorToken = StyleXTokenKeys<typeof textColors>
export type BorderColorToken = StyleXTokenKeys<typeof borderColors>
export type FocusColorToken = StyleXTokenKeys<typeof focusColors>
export type SyntaxColorToken = StyleXTokenKeys<typeof syntaxColors>
export type ColorToken =
  | BackgroundColorToken
  | TextColorToken
  | BorderColorToken
  | FocusColorToken
  | SyntaxColorToken
