import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'

import { brandButtonLinkStyles } from './buttonLink.styles'

export interface BrandButtonLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'children' | 'className' | 'dangerouslySetInnerHTML' | 'style'
> {
  /** Label displayed inside the brand navigation link. */
  children: ReactNode
}

/** Renders the single primary navigation treatment for brand surfaces. */
export const BrandButtonLink = forwardRef<HTMLAnchorElement, BrandButtonLinkProps>(
  function BrandButtonLink({ children, ...props }, forwardedRef) {
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
        {...stylex.props(brandButtonLinkStyles.root)}
      >
        {children}
      </a>
    )
  },
)
