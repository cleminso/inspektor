import * as stylex from '@stylexjs/stylex'
import type React from 'react'

import {
  accentElementColors,
  borderColors,
  dangerElementColors,
  elementColors,
  ghostElementColors,
  selectionColors,
  surfaceColors,
  textColors,
} from '../tokens/semantics.stylex'
import type { BackgroundColorToken } from '../tokens/semantics.stylex'
import { layerIndexes } from '../tokens/layers.stylex'
import { breakpointValues } from '../tokens/breakpoints.stylex'
import { spatial } from '../tokens/semantics.stylex'
import { borderRadii, shadows, spacing } from '../tokens/value.stylex'
import {
  alignContentStyles,
  alignItemsStyles,
  alignSelfStyles,
  backgroundColorStyles,
  borderBottomLeftRadiusStyles,
  borderBottomRightRadiusStyles,
  borderColorStyles,
  borderRadiusStyles,
  borderStyleStyles,
  borderTopLeftRadiusStyles,
  borderTopRightRadiusStyles,
  boxShadowStyles,
  colorStyles,
  columnGapStyles,
  cursorStyles,
  displayStyles,
  flexDirectionStyles,
  flexWrapStyles,
  gapStyles,
  gridAutoFlowStyles,
  justifyContentStyles,
  marginBlockStyles,
  marginBottomStyles,
  marginInlineStyles,
  marginLeftStyles,
  marginRightStyles,
  marginStyles,
  marginTopStyles,
  overflowStyles,
  overflowXStyles,
  overflowYStyles,
  paddingBlockStyles,
  paddingBottomStyles,
  paddingInlineStyles,
  paddingLeftStyles,
  paddingRightStyles,
  paddingStyles,
  paddingTopStyles,
  pointerEventsStyles,
  positionStyles,
  rowGapStyles,
  userSelectStyles,
  visibilityStyles,
} from '../components/box/box-styles'
import { textAlignStyles } from '../components/text/text-styles'
import type { BoxStyleProps, PseudoState, ResponsiveValue } from './types'

const PSEUDO_SELECTOR_MAP: Record<PseudoState, string> = {
  hover: ':hover',
  focus: ':focus',
  active: ':active',
  focusVisible: ':focus-visible',
  focusWithin: ':focus-within',
}

const DECLARATION_ORDER = [
  'padding',
  'margin',
  'gap',
  'padding-inline',
  'margin-inline',
  'padding-block',
  'margin-block',
  'row-gap',
  'column-gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'overflow',
  'overflow-x',
  'overflow-y',
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
] as const

const BOX_STYLE_PROP_MAP: Record<keyof BoxStyleProps, true> = {
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingHorizontal: true,
  paddingVertical: true,
  p: true,
  pt: true,
  pr: true,
  pb: true,
  pl: true,
  px: true,
  py: true,
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  marginHorizontal: true,
  marginVertical: true,
  m: true,
  mt: true,
  mr: true,
  mb: true,
  ml: true,
  mx: true,
  my: true,
  gap: true,
  rowGap: true,
  columnGap: true,
  g: true,
  backgroundColor: true,
  color: true,
  borderColor: true,
  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderStyle: true,
  boxShadow: true,
  display: true,
  overflow: true,
  overflowX: true,
  overflowY: true,
  width: true,
  height: true,
  minWidth: true,
  maxWidth: true,
  minHeight: true,
  maxHeight: true,
  aspectRatio: true,
  flex: true,
  flexDirection: true,
  flexWrap: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  alignItems: true,
  alignSelf: true,
  justifyContent: true,
  alignContent: true,
  gridTemplateColumns: true,
  gridTemplateRows: true,
  gridColumn: true,
  gridRow: true,
  gridAutoFlow: true,
  position: true,
  top: true,
  right: true,
  bottom: true,
  left: true,
  inset: true,
  zIndex: true,
  opacity: true,
  cursor: true,
  pointerEvents: true,
  visibility: true,
  userSelect: true,
  textAlign: true,
}

export const BOX_STYLE_PROP_KEYS = new Set<string>(Object.keys(BOX_STYLE_PROP_MAP))

type StyleMap = Readonly<Record<string, stylex.StyleXStyles>>
type CSSRecord = Record<string, string | number>

export interface ResolvedStyles {
  stylexStyles: stylex.StyleXStyles[]
  inlineStyle: React.CSSProperties
  responsiveCSS: string | null
}

function isPseudoState(key: string): key is PseudoState {
  return key in PSEUDO_SELECTOR_MAP
}

function isResponsive<T>(value: ResponsiveValue<T>): value is Partial<Record<string, T>> {
  return typeof value === 'object' && value !== null && Array.isArray(value) === false
}

function toKebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function normalizedCssKey(key: string): string {
  return key.includes('-') === true ? key : toKebab(key)
}

function sortedDeclarationEntries(record: CSSRecord): [string, string | number][] {
  return Object.entries(record).sort(([a], [b]) => {
    const normalizedA = normalizedCssKey(a)
    const normalizedB = normalizedCssKey(b)
    const indexA = DECLARATION_ORDER.indexOf(normalizedA as (typeof DECLARATION_ORDER)[number])
    const indexB = DECLARATION_ORDER.indexOf(normalizedB as (typeof DECLARATION_ORDER)[number])
    const priorityA = indexA === -1 ? 10_000 : indexA
    const priorityB = indexB === -1 ? 10_000 : indexB

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return normalizedA.localeCompare(normalizedB)
  })
}

function px(value: number): string {
  return value === 0 ? '0' : `${value}px`
}

function spacingCss(token: keyof typeof spacing): string {
  return spacing[token] as string
}

function marginCss(token: keyof typeof spacing | 'auto'): string {
  return token === 'auto' ? 'auto' : (spacing[token] as string)
}

const backgroundColorValues = {
  'surface-background': surfaceColors.background,
  'surface-default': surfaceColors.default,
  'surface-raised': surfaceColors.raised,
  'surface-canvas': surfaceColors.canvas,
  'surface-subtle': surfaceColors.subtle,
  'surface-overlay': surfaceColors.overlay,
  'surface-backdrop': surfaceColors.backdrop,
  'surface-inverse': surfaceColors.inverse,
  'element-default': elementColors.default,
  'element-hover': elementColors.hover,
  'element-pressed': elementColors.pressed,
  'element-selected': elementColors.selected,
  'element-disabled': elementColors.disabled,
  'ghost-element-default': ghostElementColors.default,
  'ghost-element-hover': ghostElementColors.hover,
  'ghost-element-pressed': ghostElementColors.pressed,
  'ghost-element-selected': ghostElementColors.selected,
  'ghost-element-disabled': ghostElementColors.disabled,
  'accent-element-default': accentElementColors.default,
  'accent-element-hover': accentElementColors.hover,
  'accent-element-pressed': accentElementColors.pressed,
  'accent-element-disabled': accentElementColors.disabled,
  'danger-element-default': dangerElementColors.default,
  'danger-element-hover': dangerElementColors.hover,
  'danger-element-pressed': dangerElementColors.pressed,
  'danger-element-disabled': dangerElementColors.disabled,
  'danger-element-subtle': dangerElementColors.subtle,
  'selection-background': selectionColors.background,
  'selection-strong-background': selectionColors.strongBackground,
} satisfies Record<BackgroundColorToken, string>

function backgroundColorCss(token: BackgroundColorToken): string {
  return backgroundColorValues[token] as string
}

function textColorCss(token: keyof typeof textColors): string {
  return textColors[token] as string
}

function borderColorCss(token: keyof typeof borderColors): string {
  return borderColors[token] as string
}

function radiusCss(token: keyof typeof borderRadii): string {
  return borderRadii[token] as string
}

function shadowCss(token: keyof typeof shadows): string {
  return shadows[token] as string
}

function layoutSizeCss(token: keyof typeof spatial | 'full'): string {
  return token === 'full' ? '100%' : (spatial[token] as string)
}

function layerIndexCss(token: keyof typeof layerIndexes): number {
  return layerIndexes[token]
}

const FLEX_KEYWORD_MAP: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

const ASPECT_RATIO_MAP = {
  square: '1 / 1',
  landscape: '4 / 3',
  portrait: '3 / 4',
  video: '16 / 9',
} as const

const GRID_TEMPLATE_COLUMNS_MAP = {
  one: 'minmax(0, 1fr)',
  two: 'repeat(2, minmax(0, 1fr))',
  three: 'repeat(3, minmax(0, 1fr))',
  four: 'repeat(4, minmax(0, 1fr))',
  'three-one': 'minmax(0, 3fr) minmax(0, 1fr)',
  'auto-fit-s': `repeat(auto-fit, minmax(${spatial['grid-track-s']}, 1fr))`,
  'auto-fit-m': `repeat(auto-fit, minmax(${spatial['grid-track-m']}, 1fr))`,
  'label-content': `${spatial['label-width']} minmax(0, 1fr)`,
} as const

const GRID_TEMPLATE_ROWS_MAP = {
  one: 'minmax(0, 1fr)',
  two: 'repeat(2, minmax(0, 1fr))',
  three: 'repeat(3, minmax(0, 1fr))',
  four: 'repeat(4, minmax(0, 1fr))',
} as const

const GRID_PLACEMENT_MAP = {
  auto: 'auto',
  'span-1': 'span 1 / span 1',
  'span-2': 'span 2 / span 2',
  'span-3': 'span 3 / span 3',
  'span-4': 'span 4 / span 4',
  full: '1 / -1',
} as const

function flexKeyword(value: string): string {
  return FLEX_KEYWORD_MAP[value] ?? value
}

export function resolveBoxStyles(props: BoxStyleProps, scopeClass: string): ResolvedStyles {
  const stylexStyles: stylex.StyleXStyles[] = []
  const inlineStyle: CSSRecord = {}
  const breakpointStyles: Record<number, CSSRecord> = {}
  const pseudoStyles: Record<string, CSSRecord> = {}

  function addBreakpointStyle(bp: number, cssProp: string, cssValue: string | number) {
    breakpointStyles[bp] = {
      ...breakpointStyles[bp],
      [cssProp]: cssValue,
    }
  }

  function addPseudoStyle(selector: string, cssProp: string, cssValue: string | number) {
    pseudoStyles[selector] = {
      ...pseudoStyles[selector],
      [cssProp]: cssValue,
    }
  }

  function addTokenProp<T extends string>(
    styleMap: StyleMap,
    cssProp: string,
    value: ResponsiveValue<T> | undefined,
    transform: (nextValue: T) => string,
  ) {
    if (value === undefined) {
      return
    }

    if (isResponsive(value) === true) {
      for (const [key, nextValue] of Object.entries(value)) {
        if (nextValue === undefined) {
          continue
        }

        if (key === 'base') {
          const style = styleMap[nextValue]
          if (style !== undefined) {
            stylexStyles.push(style)
          }
          continue
        }

        if (isPseudoState(key) === true) {
          addPseudoStyle(PSEUDO_SELECTOR_MAP[key], cssProp, transform(nextValue))
          continue
        }

        const breakpoint = breakpointValues[key as keyof typeof breakpointValues]
        if (breakpoint !== undefined) {
          addBreakpointStyle(breakpoint, cssProp, transform(nextValue))
        }
      }

      return
    }

    const tokenValue = value as T
    const style = styleMap[tokenValue]
    if (style !== undefined) {
      stylexStyles.push(style)
    }
  }

  function addArbitraryProp<T>(
    cssProp: string,
    value: ResponsiveValue<T> | undefined,
    transform: (nextValue: T) => string | number,
  ) {
    if (value === undefined) {
      return
    }

    if (isResponsive(value) === true) {
      for (const [key, nextValue] of Object.entries(value)) {
        if (nextValue === undefined) {
          continue
        }

        const cssValue = transform(nextValue)

        if (key === 'base') {
          addBreakpointStyle(0, cssProp, cssValue)
          continue
        }

        if (isPseudoState(key) === true) {
          addPseudoStyle(PSEUDO_SELECTOR_MAP[key], cssProp, cssValue)
          continue
        }

        const breakpoint = breakpointValues[key as keyof typeof breakpointValues]
        if (breakpoint !== undefined) {
          addBreakpointStyle(breakpoint, cssProp, cssValue)
        }
      }

      return
    }

    inlineStyle[cssProp] = transform(value as T)
  }

  addTokenProp(paddingStyles as StyleMap, 'padding', props.padding ?? props.p, spacingCss)
  addTokenProp(
    paddingTopStyles as StyleMap,
    'padding-top',
    props.paddingTop ?? props.pt,
    spacingCss,
  )
  addTokenProp(
    paddingRightStyles as StyleMap,
    'padding-right',
    props.paddingRight ?? props.pr,
    spacingCss,
  )
  addTokenProp(
    paddingBottomStyles as StyleMap,
    'padding-bottom',
    props.paddingBottom ?? props.pb,
    spacingCss,
  )
  addTokenProp(
    paddingLeftStyles as StyleMap,
    'padding-left',
    props.paddingLeft ?? props.pl,
    spacingCss,
  )
  addTokenProp(
    paddingInlineStyles as StyleMap,
    'padding-inline',
    props.paddingHorizontal ?? props.px,
    spacingCss,
  )
  addTokenProp(
    paddingBlockStyles as StyleMap,
    'padding-block',
    props.paddingVertical ?? props.py,
    spacingCss,
  )

  addTokenProp(marginStyles as StyleMap, 'margin', props.margin ?? props.m, marginCss)
  addTokenProp(marginTopStyles as StyleMap, 'margin-top', props.marginTop ?? props.mt, marginCss)
  addTokenProp(
    marginRightStyles as StyleMap,
    'margin-right',
    props.marginRight ?? props.mr,
    marginCss,
  )
  addTokenProp(
    marginBottomStyles as StyleMap,
    'margin-bottom',
    props.marginBottom ?? props.mb,
    marginCss,
  )
  addTokenProp(marginLeftStyles as StyleMap, 'margin-left', props.marginLeft ?? props.ml, marginCss)
  addTokenProp(
    marginInlineStyles as StyleMap,
    'margin-inline',
    props.marginHorizontal ?? props.mx,
    marginCss,
  )
  addTokenProp(
    marginBlockStyles as StyleMap,
    'margin-block',
    props.marginVertical ?? props.my,
    marginCss,
  )

  addTokenProp(gapStyles as StyleMap, 'gap', props.gap ?? props.g, spacingCss)
  addTokenProp(rowGapStyles as StyleMap, 'row-gap', props.rowGap, spacingCss)
  addTokenProp(columnGapStyles as StyleMap, 'column-gap', props.columnGap, spacingCss)

  addTokenProp(
    backgroundColorStyles as StyleMap,
    'background-color',
    props.backgroundColor,
    backgroundColorCss,
  )
  addTokenProp(colorStyles as StyleMap, 'color', props.color, textColorCss)
  addTokenProp(borderColorStyles as StyleMap, 'border-color', props.borderColor, borderColorCss)

  addTokenProp(borderRadiusStyles as StyleMap, 'border-radius', props.borderRadius, radiusCss)
  addTokenProp(
    borderTopLeftRadiusStyles as StyleMap,
    'border-top-left-radius',
    props.borderTopLeftRadius,
    radiusCss,
  )
  addTokenProp(
    borderTopRightRadiusStyles as StyleMap,
    'border-top-right-radius',
    props.borderTopRightRadius,
    radiusCss,
  )
  addTokenProp(
    borderBottomLeftRadiusStyles as StyleMap,
    'border-bottom-left-radius',
    props.borderBottomLeftRadius,
    radiusCss,
  )
  addTokenProp(
    borderBottomRightRadiusStyles as StyleMap,
    'border-bottom-right-radius',
    props.borderBottomRightRadius,
    radiusCss,
  )

  // Border styles and side-specific widths should not activate the browser's medium border width.
  if (
    props.borderWidth === undefined &&
    (props.borderStyle !== undefined ||
      props.borderTopWidth !== undefined ||
      props.borderRightWidth !== undefined ||
      props.borderBottomWidth !== undefined ||
      props.borderLeftWidth !== undefined)
  ) {
    inlineStyle.borderWidth = 0
  }

  addArbitraryProp('borderWidth', props.borderWidth, px)
  addArbitraryProp('borderTopWidth', props.borderTopWidth, px)
  addArbitraryProp('borderRightWidth', props.borderRightWidth, px)
  addArbitraryProp('borderBottomWidth', props.borderBottomWidth, px)
  addArbitraryProp('borderLeftWidth', props.borderLeftWidth, px)
  addTokenProp(borderStyleStyles as StyleMap, 'border-style', props.borderStyle, (value) => value)

  addTokenProp(boxShadowStyles as StyleMap, 'box-shadow', props.boxShadow, shadowCss)

  addTokenProp(displayStyles as StyleMap, 'display', props.display, (value) => value)
  addTokenProp(overflowStyles as StyleMap, 'overflow', props.overflow, (value) => value)
  addTokenProp(overflowXStyles as StyleMap, 'overflow-x', props.overflowX, (value) => value)
  addTokenProp(overflowYStyles as StyleMap, 'overflow-y', props.overflowY, (value) => value)

  addArbitraryProp('width', props.width, layoutSizeCss)
  addArbitraryProp('height', props.height, layoutSizeCss)
  addArbitraryProp('minWidth', props.minWidth, (value) =>
    value === 0 ? '0' : layoutSizeCss(value),
  )
  addArbitraryProp('maxWidth', props.maxWidth, layoutSizeCss)
  addArbitraryProp('minHeight', props.minHeight, (value) =>
    value === 0 ? '0' : layoutSizeCss(value),
  )
  addArbitraryProp('maxHeight', props.maxHeight, layoutSizeCss)
  addArbitraryProp('aspectRatio', props.aspectRatio, (value) => ASPECT_RATIO_MAP[value])

  addArbitraryProp('flex', props.flex, (value) =>
    typeof value === 'number' ? `${value} ${value} 0%` : value,
  )
  addTokenProp(
    flexDirectionStyles as StyleMap,
    'flex-direction',
    props.flexDirection,
    (value) => value,
  )
  addTokenProp(flexWrapStyles as StyleMap, 'flex-wrap', props.flexWrap, (value) => value)
  addArbitraryProp('flexGrow', props.flexGrow, (value) => value)
  addArbitraryProp('flexShrink', props.flexShrink, (value) => value)
  addArbitraryProp('flexBasis', props.flexBasis, (value) => (value === 0 ? '0' : value))
  addTokenProp(alignItemsStyles as StyleMap, 'align-items', props.alignItems, flexKeyword)
  addTokenProp(alignSelfStyles as StyleMap, 'align-self', props.alignSelf, flexKeyword)
  addTokenProp(
    justifyContentStyles as StyleMap,
    'justify-content',
    props.justifyContent,
    flexKeyword,
  )
  addTokenProp(alignContentStyles as StyleMap, 'align-content', props.alignContent, flexKeyword)

  addArbitraryProp(
    'gridTemplateColumns',
    props.gridTemplateColumns,
    (value) => GRID_TEMPLATE_COLUMNS_MAP[value],
  )
  addArbitraryProp(
    'gridTemplateRows',
    props.gridTemplateRows,
    (value) => GRID_TEMPLATE_ROWS_MAP[value],
  )
  addArbitraryProp('gridColumn', props.gridColumn, (value) => GRID_PLACEMENT_MAP[value])
  addArbitraryProp('gridRow', props.gridRow, (value) => GRID_PLACEMENT_MAP[value])
  addTokenProp(
    gridAutoFlowStyles as StyleMap,
    'grid-auto-flow',
    props.gridAutoFlow,
    (value) => value,
  )

  addTokenProp(positionStyles as StyleMap, 'position', props.position, (value) => value)
  addArbitraryProp('top', props.top, spacingCss)
  addArbitraryProp('right', props.right, spacingCss)
  addArbitraryProp('bottom', props.bottom, spacingCss)
  addArbitraryProp('left', props.left, spacingCss)
  addArbitraryProp('inset', props.inset, spacingCss)
  addArbitraryProp('zIndex', props.zIndex, layerIndexCss)

  addArbitraryProp('opacity', props.opacity, (value) => value)
  addTokenProp(cursorStyles as StyleMap, 'cursor', props.cursor, (value) => value)
  addTokenProp(
    pointerEventsStyles as StyleMap,
    'pointer-events',
    props.pointerEvents,
    (value) => value,
  )
  addTokenProp(visibilityStyles as StyleMap, 'visibility', props.visibility, (value) => value)
  addTokenProp(userSelectStyles as StyleMap, 'user-select', props.userSelect, (value) => value)
  addTokenProp(textAlignStyles as StyleMap, 'text-align', props.textAlign, (value) => value)

  const breakpointKeys = Object.keys(breakpointStyles)
    .map(Number)
    .sort((a, b) => a - b)
  const pseudoKeys = Object.keys(pseudoStyles)
  let responsiveCSS: string | null = null

  if (breakpointKeys.length > 0 || pseudoKeys.length > 0) {
    const selector = `.${scopeClass}:not(#\\#):not(#\\#):not(#\\#):not(#\\#)`
    const cssParts: string[] = []

    for (const breakpoint of breakpointKeys) {
      const entries = sortedDeclarationEntries(breakpointStyles[breakpoint] ?? {})
        .map(([key, value]) => `${normalizedCssKey(key)}: ${value}`)
        .join('; ')

      if (breakpoint === 0) {
        cssParts.push(`${selector} { ${entries} }`)
      } else {
        cssParts.push(`@media (min-width: ${breakpoint}px) { ${selector} { ${entries} } }`)
      }
    }

    for (const pseudo of pseudoKeys) {
      const entries = sortedDeclarationEntries(pseudoStyles[pseudo] ?? {})
        .map(([key, value]) => `${normalizedCssKey(key)}: ${value}`)
        .join('; ')
      cssParts.push(`${selector}${pseudo} { ${entries} }`)
    }

    responsiveCSS = cssParts.join(' ')
  }

  return {
    stylexStyles,
    inlineStyle: inlineStyle as React.CSSProperties,
    responsiveCSS,
  }
}
