import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'

import { brandTextLinkStyles } from './textLink.styles'

export interface BrandTextLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'children' | 'className' | 'dangerouslySetInnerHTML' | 'style'
> {
  /** Label or artwork displayed inside the brand link. */
  children: ReactNode
  /** Provides a minimum interaction target for links whose content is icon-only. */
  iconOnly?: boolean
}

/** Renders a neutral text link for Inspektor brand surfaces. */
export const BrandTextLink = forwardRef<HTMLAnchorElement, BrandTextLinkProps>(
  function BrandTextLink({ children, iconOnly = false, ...props }, forwardedRef) {
    const {
      className: _className,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      style: _style,
      ...linkProps
    } = props as ComponentPropsWithRef<'a'>

    return (
      <a
        {...linkProps}
        ref={forwardedRef}
        {...stylex.props(brandTextLinkStyles.root, iconOnly && brandTextLinkStyles.iconOnly)}
      >
        {children}
      </a>
    )
  },
)
