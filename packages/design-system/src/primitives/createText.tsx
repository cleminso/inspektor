import React, {
  type ComponentRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ForwardedRef,
  type JSX,
  type ReactNode,
} from 'react'
import * as stylex from '@stylexjs/stylex'

import { textRoleStyles } from '../tokens/semantics.stylex'
import {
  textAlignStyles,
  textBaseStyles,
  textColorStyles,
  textLoadingStyles,
  textUtilityStyles,
  textWrapStyles,
} from '../components/text/text-styles'

export type TextTag =
  | 'p'
  | 'span'
  | 'label'
  | 'strong'
  | 'em'
  | 'small'
  | 'code'
  | 'pre'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'a'

export type TextVariant = 'default' | 'title' | 'body' | 'label' | 'caption' | 'heading'

export type TextColor = 'default' | 'muted' | 'disabled' | 'link' | 'danger' | 'error' | 'inherit'

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
  heading: 'h2',
}

const VARIANT_DEFAULT_WRAP: Partial<Record<TextVariant, TextWrap>> = {
  body: 'pretty',
  heading: 'balance',
}

const numberFormatter = new Intl.NumberFormat('en-US')
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
})

export type TextFormatter = 'number' | 'compact' | ((value: string | number) => string)

function applyFormatter(formatter: TextFormatter, value: string | number): string {
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

export type TextProps<E extends TextTag = 'p'> = TextStyleProps & {
  as?: E
  children?: ReactNode
  /** Replaces content with a text-shaped loading placeholder. */
  loading?: boolean
  /** Sizes a single-line loading placeholder without exposing loaded content. */
  placeholderText?: string
  /** Controls how many placeholder lines are rendered while loading. */
  placeholderNumberOfLines?: number
  /** Provides the accessible name announced while content is loading. */
  loadingLabel?: string
  /** Keeps a trailing icon attached to the final line of text. */
  trailingIcon?: ReactNode
  /** Applies a semantic line-through treatment. */
  lineThrough?: boolean
  monospace?: boolean
  tabularNums?: boolean
  truncate?: boolean | number
  formatter?: TextFormatter
} & Omit<
    ComponentPropsWithoutRef<E>,
    keyof TextStyleProps | 'as' | 'className' | 'style' | 'children'
  >

function TextInner<E extends TextTag = 'p'>(
  {
    as,
    variant,
    color,
    align,
    wrap,
    children,
    loading = false,
    placeholderText,
    placeholderNumberOfLines = 1,
    loadingLabel,
    trailingIcon,
    lineThrough = false,
    monospace,
    tabularNums,
    truncate,
    formatter,
    ...props
  }: TextProps<E>,
  ref: ForwardedRef<HTMLElement>,
): JSX.Element {
  const resolvedVariant = variant ?? 'default'
  const Tag = (as ?? VARIANT_DEFAULT_TAG[resolvedVariant]) as ElementType
  const isHeading = resolvedVariant === 'heading'
  const loadingLineCount = Number.isFinite(placeholderNumberOfLines)
    ? Math.max(1, Math.floor(placeholderNumberOfLines))
    : 1
  const resolvedWrap =
    wrap ??
    (truncate === true || typeof truncate === 'number'
      ? undefined
      : VARIANT_DEFAULT_WRAP[resolvedVariant])

  const formattedContent =
    formatter !== undefined && (typeof children === 'string' || typeof children === 'number')
      ? applyFormatter(formatter, children)
      : children

  const loadingPlaceholder = placeholderText ?? formattedContent ?? 'Loading...'
  const loadingAccessibleLabel =
    loadingLabel ??
    placeholderText ??
    (typeof formattedContent === 'string' || typeof formattedContent === 'number'
      ? String(formattedContent)
      : 'Loading')
  const content =
    loading === false ? (
      formattedContent
    ) : loadingLineCount > 1 ? (
      <span data-slot="text-skeleton" aria-hidden="true" {...stylex.props(textLoadingStyles.lines)}>
        {Array.from({ length: loadingLineCount }, (_, index) => (
          <span
            key={index}
            {...stylex.props(
              textLoadingStyles.line,
              index === loadingLineCount - 1 && textLoadingStyles.lastLine,
            )}
          />
        ))}
      </span>
    ) : (
      <span {...stylex.props(textLoadingStyles.inline)}>
        <span {...stylex.props(textLoadingStyles.placeholder)}>{loadingPlaceholder}</span>
        <span
          data-slot="text-skeleton"
          aria-hidden="true"
          {...stylex.props(textLoadingStyles.skeleton)}
        />
      </span>
    )
  const contentWithTrailingIcon =
    trailingIcon !== undefined && loading === false ? (
      <>
        {content}
        <span
          data-slot="text-trailing-icon"
          aria-hidden="true"
          {...stylex.props(textUtilityStyles.trailingIcon)}
        >
          {trailingIcon}
        </span>
      </>
    ) : (
      content
    )

  const stylexProps = stylex.props(
    textBaseStyles.base,
    textRoleStyles[resolvedVariant],
    textColorStyles[color ?? 'default'],
    isHeading === true && textUtilityStyles.heading,
    align !== undefined && textAlignStyles[align],
    resolvedWrap !== undefined && textWrapStyles[resolvedWrap],
    lineThrough === true && textUtilityStyles.lineThrough,
    monospace === true && textUtilityStyles.monospace,
    tabularNums === true && textUtilityStyles.tabularNums,
    truncate === true && textUtilityStyles.truncate,
    trailingIcon !== undefined && textUtilityStyles.withTrailingIcon,
  )

  const inlineStyle = {
    ...stylexProps.style,
    ...(typeof truncate === 'number'
      ? {
          display: '-webkit-box',
          WebkitLineClamp: truncate,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {}),
  }

  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  )
  const consumerAriaBusy = props['aria-busy']

  return (
    <Tag
      ref={ref}
      className={stylexProps.className}
      style={inlineStyle}
      {...domProps}
      aria-busy={loading === true ? true : consumerAriaBusy}
      aria-label={loading === true ? loadingAccessibleLabel : props['aria-label']}
    >
      {contentWithTrailingIcon}
    </Tag>
  )
}

const TextBase = React.forwardRef(TextInner)
TextBase.displayName = 'Text'

const Text = TextBase as <E extends TextTag = 'p'>(
  props: TextProps<E> & { ref?: ForwardedRef<ComponentRef<E>> },
) => JSX.Element

export function createText() {
  return Text
}

export { Text }
