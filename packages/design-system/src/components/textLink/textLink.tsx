import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import {
  textBaseStyles,
  textUtilityStyles,
} from '../text/text-styles'
import { textRoleStyles } from '../../tokens/semantics.stylex'
import type { TextVariant } from '../../primitives/createText'
import { textLinkStyles } from './textLink.styles'

export interface TextLinkProps
  extends Omit<
    useRender.ComponentProps<'a'>,
    'className' | 'color' | 'style'
  > {
  /** Controls the typography role used by the link label. */
  variant?: TextVariant
  /** Keeps a decorative icon attached to the final line of link text. */
  trailingIcon?: ReactNode
  /** Identifies the native anchor destination when render composition is not used. */
  href?: useRender.ComponentProps<'a'>['href']
  /** Composes link semantics and styles onto a router link component. */
  render?: useRender.ComponentProps<'a'>['render']
}

export function TextLink({
  variant = 'default',
  trailingIcon,
  render,
  children,
  ...props
}: TextLinkProps) {
  const styleProps = stylex.props(
    textBaseStyles.base,
    textRoleStyles[variant],
    textLinkStyles.base,
    trailingIcon !== undefined && textUtilityStyles.withTrailingIcon,
  )
  const content = trailingIcon === undefined ? children : (
    <>
      {children}
      <span
        data-slot="text-link-trailing-icon"
        aria-hidden="true"
        {...stylex.props(textUtilityStyles.trailingIcon)}
      >
        {trailingIcon}
      </span>
    </>
  )
  const defaultProps = {
    ...styleProps,
    children: content,
    'data-slot': 'text-link',
  } as useRender.ElementProps<'a'>
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as useRender.ComponentProps<'a'>

  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(defaultProps, domProps),
  })
}
