import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { brandProductPreviewStyles } from './productPreview.styles'

export interface BrandProductPreviewProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'aria-label' | 'children' | 'className' | 'dangerouslySetInnerHTML' | 'style' | 'title'
> {
  /** Source URL for the product screenshot. */
  src: string
  /** Accessible description of the product screenshot. */
  alt: string
  /** Intrinsic image width used to reserve the correct aspect ratio. */
  width: number
  /** Intrinsic image height used to reserve the correct aspect ratio. */
  height: number
}

/** Presents a responsive product screenshot on the public brand surface. */
export const BrandProductPreview = forwardRef<HTMLElement, BrandProductPreviewProps>(
  function BrandProductPreview({ alt, height, src, width, ...props }, forwardedRef) {
    const {
      children: _children,
      className: _className,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      style: _style,
      ...sectionProps
    } = props as ComponentPropsWithRef<'section'>

    return (
      <section
        {...sectionProps}
        ref={forwardedRef}
        aria-label="Inspektor Studio preview"
        data-slot="brand-product-preview"
        {...stylex.props(brandProductPreviewStyles.root)}
      >
        <div
          data-slot="brand-product-preview-content"
          {...stylex.props(brandProductPreviewStyles.content)}
        >
          <img
            alt={alt}
            decoding="async"
            height={height}
            loading="lazy"
            src={src}
            width={width}
            {...stylex.props(brandProductPreviewStyles.image)}
          />
        </div>
      </section>
    )
  },
)
