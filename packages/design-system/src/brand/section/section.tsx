import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { brandSectionStyles } from './section.styles'

export type BrandSectionProps = Omit<ComponentPropsWithRef<'section'>, 'className' | 'style'>

/** Groups related brand content on the central page surface. */
export const BrandSection = forwardRef<HTMLElement, BrandSectionProps>(
  function BrandSection(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...sectionProps
    } = props as ComponentPropsWithRef<'section'>

    return (
      <section
        {...sectionProps}
        ref={forwardedRef}
        data-slot="brand-section"
        {...stylex.props(brandSectionStyles.root)}
      />
    )
  },
)
