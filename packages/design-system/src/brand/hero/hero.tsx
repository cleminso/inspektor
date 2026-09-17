import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'

import { brandHeroStyles } from './hero.styles'

export interface BrandHeroProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'children' | 'className' | 'dangerouslySetInnerHTML' | 'style' | 'title'
> {
  /** Primary page title text. */
  title: string
  /** Muted continuation of the page title. */
  continuation: string
  /** Supporting copy displayed below the page title. */
  description: string
  /** Optional action content displayed below the description. */
  action?: ReactNode
}

/** Presents the primary message for an Inspektor brand page. */
export const BrandHero = forwardRef<HTMLElement, BrandHeroProps>(function BrandHero(
  { action, continuation, description, title, ...props },
  forwardedRef,
) {
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
      data-slot="brand-hero"
      {...stylex.props(brandHeroStyles.root)}
    >
      <div
        data-slot="brand-hero-content"
        {...stylex.props(brandHeroStyles.content)}
      >
        <h1 {...stylex.props(brandHeroStyles.heading)}>
          <span
            data-slot="brand-hero-title"
            {...stylex.props(brandHeroStyles.title)}
          >
            {title}
          </span>{' '}
          <span
            data-slot="brand-hero-continuation"
            {...stylex.props(brandHeroStyles.continuation)}
          >
            {continuation}
          </span>
        </h1>
        <p
          data-slot="brand-hero-description"
          {...stylex.props(brandHeroStyles.description)}
        >
          {description}
        </p>
        {action !== undefined && action !== null ? (
          <div
            data-slot="brand-hero-action"
            {...stylex.props(brandHeroStyles.action)}
          >
            {action}
          </div>
        ) : null}
      </div>
    </section>
  )
})
