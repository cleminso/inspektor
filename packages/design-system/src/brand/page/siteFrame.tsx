import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'

import { brandSiteFrameStyles } from './siteFrame.styles'

export interface BrandSiteFrameProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'className' | 'dangerouslySetInnerHTML' | 'style'
> {
  /** Content displayed in the site header. */
  header: ReactNode
  /** Sections displayed on the continuous main surface. */
  children?: ReactNode
}

/** Provides the fixed visual frame shared by Inspektor brand pages. */
export const BrandSiteFrame = forwardRef<HTMLDivElement, BrandSiteFrameProps>(
  function BrandSiteFrame({ children, header, ...props }, forwardedRef) {
    const {
      className: _className,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      style: _style,
      ...rootProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...rootProps}
        ref={forwardedRef}
        data-slot="brand-site-frame"
        {...stylex.props(brandSiteFrameStyles.root)}
      >
        <div
          aria-hidden="true"
          data-slot="brand-site-frame-start-rail"
          {...stylex.props(brandSiteFrameStyles.rail, brandSiteFrameStyles.startRail)}
        />
        <div
          data-slot="brand-site-frame-center"
          {...stylex.props(brandSiteFrameStyles.center)}
        >
          <header
            data-slot="brand-site-frame-header"
            {...stylex.props(brandSiteFrameStyles.surface, brandSiteFrameStyles.header)}
          >
            <div
              data-slot="brand-site-frame-header-content"
              {...stylex.props(brandSiteFrameStyles.headerContent)}
            >
              {header}
            </div>
          </header>
          <main
            data-slot="brand-site-frame-main"
            {...stylex.props(brandSiteFrameStyles.surface, brandSiteFrameStyles.main)}
          >
            {children}
          </main>
          <div
            aria-hidden="true"
            data-slot="brand-site-frame-footer-strip"
            {...stylex.props(brandSiteFrameStyles.surface, brandSiteFrameStyles.footerStrip)}
          />
        </div>
        <div
          aria-hidden="true"
          data-slot="brand-site-frame-end-rail"
          {...stylex.props(brandSiteFrameStyles.rail, brandSiteFrameStyles.endRail)}
        />
      </div>
    )
  },
)
