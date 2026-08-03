'use client'

// react rendering and DOM prop handling
import * as stylex from '@stylexjs/stylex'
import React, { useId } from 'react'

import { BOX_STYLE_PROP_KEYS, resolveBoxStyles } from '../../utils/resolvers'
import type { BoxStyleProps } from '../../utils/types'
import { boxStyles } from './box.styles'

type BoxElement =
  | 'div'
  | 'span'
  | 'section'
  | 'article'
  | 'aside'
  | 'main'
  | 'nav'
  | 'header'
  | 'footer'
  | 'form'
  | 'fieldset'
  | 'label'
  | 'ul'
  | 'ol'
  | 'li'

const NON_FLEX_DEFAULT_ELEMENTS = new Set<BoxElement>([
  'span',
  'label',
  'ul',
  'ol',
  'li',
])

type BoxOwnProps<E extends BoxElement = 'div'> = BoxStyleProps & {
  as?: E
  children?: React.ReactNode
  /** Uses the design-system treatment for a compact scrollbar. */
  scrollbar?: 'thin'
}

export type BoxProps<E extends BoxElement = 'div'> = BoxOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof BoxOwnProps<E> | 'className' | 'style'>

function BoxInner<E extends BoxElement = 'div'>(
  {
    as,
    children,
    scrollbar,
    ...rest
  }: BoxProps<E>,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const id = useId()
  const scopeClass = `ds${id.replace(/:/g, '')}`
  const Component = (as ?? 'div') as React.ElementType

  const styleProps: Record<string, unknown> = {}
  const domProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rest)) {
    if (BOX_STYLE_PROP_KEYS.has(key)) {
      styleProps[key] = value
    } else if (key !== 'className' && key !== 'style') {
      domProps[key] = value
    }
  }

  if (
    styleProps.display === undefined &&
    NON_FLEX_DEFAULT_ELEMENTS.has((as ?? 'div') as BoxElement) === false
  ) {
    styleProps.display = 'flex'
  }

  const { stylexStyles, inlineStyle, responsiveCSS } = resolveBoxStyles(
    styleProps as BoxStyleProps,
    scopeClass,
  )

  const stylexProps = stylex.props(
    ...stylexStyles,
    scrollbar === 'thin' && boxStyles.scrollbarThin,
  )

  const mergedStyle = {
    ...stylexProps.style,
    ...inlineStyle,
  }

  const hasStyle = Object.keys(mergedStyle).length > 0

  const classes =
    [
      stylexProps.className ?? null,
      responsiveCSS !== null ? scopeClass : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <>
      {responsiveCSS !== null ? (
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      ) : null}
      <Component
        ref={ref}
        className={classes}
        style={hasStyle === true ? mergedStyle : undefined}
        data-scrollbar={scrollbar}
        {...domProps}
      >
        {children}
      </Component>
    </>
  )
}

export const Box = React.forwardRef(BoxInner) as <E extends BoxElement = 'div'>(
  props: BoxProps<E> & { ref?: React.ForwardedRef<React.ComponentRef<E>> },
) => React.ReactElement | null
