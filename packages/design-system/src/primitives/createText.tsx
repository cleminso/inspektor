import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type JSX,
  type ReactNode,
} from 'react'
import * as stylex from '@stylexjs/stylex'

import { textColorStyles, textRoleStyles } from '../tokens/semantics.stylex'
import {
  textAlignStyles,
  textUtilityStyles,
  textWrapStyles,
} from '../components/text/text-styles'

type TextTag =
  | 'p'
  | 'span'
  | 'label'
  | 'strong'
  | 'em'
  | 'small'
  | 'code'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'

export type TextVariant =
  | 'default'
  | 'title'
  | 'body'
  | 'label'
  | 'caption'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'heading-xs'

export type TextColor =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'disabled'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'error'
  | 'success'
  | 'accent'
  | 'inverse'
  | 'inherit'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type TextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty'

export type TextStyleProps = {
  variant?: TextVariant
  color?: TextColor
  align?: TextAlign
  wrap?: TextWrap
}

const VARIANT_DEFAULT_TAG: Record<TextVariant, TextTag> = {
  default: 'p',
  title: 'p',
  body: 'p',
  label: 'p',
  caption: 'p',
  'heading-l': 'h2',
  'heading-m': 'h3',
  'heading-s': 'h4',
  'heading-xs': 'h5',
}

const VARIANT_DEFAULT_WRAP: Partial<Record<TextVariant, TextWrap>> = {
  body: 'pretty',
  'heading-l': 'balance',
  'heading-m': 'balance',
  'heading-s': 'balance',
  'heading-xs': 'balance',
}

const numberFormatter = new Intl.NumberFormat('en-US')
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
})

export type TextFormatter =
  | 'number'
  | 'compact'
  | ((value: string | number) => string)

function applyFormatter(
  formatter: TextFormatter,
  value: string | number,
): string {
  if (typeof formatter === 'function') {
    return formatter(value)
  }

  const numberValue = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(numberValue)) {
    return String(value)
  }

  return formatter === 'compact'
    ? compactFormatter.format(numberValue)
    : numberFormatter.format(numberValue)
}

type TextProps<E extends TextTag = 'p'> = TextStyleProps & {
  as?: E
  children?: ReactNode
  monospace?: boolean
  tabularNums?: boolean
  truncate?: boolean | number
  formatter?: TextFormatter
} & Omit<
    ComponentPropsWithoutRef<E>,
    keyof TextStyleProps | 'as' | 'className' | 'children'
  >

function Text<E extends TextTag = 'p'>({
  as,
  variant,
  color,
  align,
  wrap,
  children,
  style,
  monospace,
  tabularNums,
  truncate,
  formatter,
  ...props
}: TextProps<E> & { style?: CSSProperties }): JSX.Element {
  const resolvedVariant = variant ?? 'default'
  const Tag = (as ?? VARIANT_DEFAULT_TAG[resolvedVariant]) as ElementType
  const resolvedWrap =
    wrap ?? (truncate === true || typeof truncate === 'number'
      ? undefined
      : VARIANT_DEFAULT_WRAP[resolvedVariant])

  const formattedContent =
    formatter !== undefined &&
    (typeof children === 'string' || typeof children === 'number')
      ? applyFormatter(formatter, children)
      : children

  const stylexProps = stylex.props(
    textRoleStyles[resolvedVariant],
    textColorStyles[color ?? 'default'],
    align !== undefined && textAlignStyles[align],
    resolvedWrap !== undefined && textWrapStyles[resolvedWrap],
    monospace === true && textUtilityStyles.monospace,
    tabularNums === true && textUtilityStyles.tabularNums,
    truncate === true && textUtilityStyles.truncate,
  )

  const mergedStyle: CSSProperties = {
    ...stylexProps.style,
    ...(typeof truncate === 'number'
      ? {
          display: '-webkit-box',
          WebkitLineClamp: truncate,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {}),
    ...style,
  }

  return (
    <Tag
      className={stylexProps.className}
      style={mergedStyle}
      {...(props as object)}
    >
      {formattedContent}
    </Tag>
  )
}

Text.displayName = 'Text'

export function createText() {
  return Text
}

export { Text }
