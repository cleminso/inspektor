// react rendering and DOM prop handling
import * as stylex from '@stylexjs/stylex'
import React, { useId } from 'react'

import { BOX_STYLE_PROP_KEYS, resolveBoxStyles } from '../../utils/resolvers'
import type { BoxStyleProps } from '../../utils/types'

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
  className?: string
  children?: React.ReactNode
}

export type BoxProps<E extends BoxElement = 'div'> = BoxOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof BoxOwnProps<E>>

function BoxInner<E extends BoxElement = 'div'>(
  {
    as,
    className,
    children,
    style: styleProp,
    ...rest
  }: BoxProps<E> & { style?: React.CSSProperties },
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
    } else {
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

  const stylexProps =
    stylexStyles.length > 0 ? stylex.props(...stylexStyles) : null

  const mergedStyle = {
    ...(stylexProps?.style ?? {}),
    ...inlineStyle,
    ...styleProp,
  }

  const hasStyle = Object.keys(mergedStyle).length > 0

  const classes =
    [
      stylexProps?.className ?? null,
      responsiveCSS !== null ? scopeClass : null,
      className,
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
        {...domProps}
      >
        {children}
      </Component>
    </>
  )
}

export const Box = React.forwardRef(BoxInner) as <E extends BoxElement = 'div'>(
  props: BoxProps<E> & { ref?: React.ForwardedRef<HTMLElement> },
) => React.ReactElement | null
