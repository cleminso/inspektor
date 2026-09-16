import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { brandHeroStyles } from './hero.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export type BrandHeroProps = WithoutStyles<ComponentPropsWithRef<'section'>>
export type BrandHeroContentProps = WithoutStyles<ComponentPropsWithRef<'div'>>
export type BrandHeroFrameProps = WithoutStyles<ComponentPropsWithRef<'div'>>
export type BrandHeroMessageProps = WithoutStyles<ComponentPropsWithRef<'div'>>
export type BrandHeroHeadingsProps = WithoutStyles<ComponentPropsWithRef<'div'>>

const BrandHeroRoot = forwardRef<HTMLElement, BrandHeroProps>(
  function BrandHeroRoot(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...heroProps
    } = props as ComponentPropsWithRef<'section'>

    return (
      <section
        {...heroProps}
        ref={forwardedRef}
        data-slot="brand-hero"
        {...stylex.props(brandHeroStyles.root)}
      />
    )
  },
)

const BrandHeroContent = forwardRef<HTMLDivElement, BrandHeroContentProps>(
  function BrandHeroContent(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...contentProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...contentProps}
        ref={forwardedRef}
        data-slot="brand-hero-content"
        {...stylex.props(brandHeroStyles.content)}
      />
    )
  },
)

const BrandHeroFrame = forwardRef<HTMLDivElement, BrandHeroFrameProps>(
  function BrandHeroFrame(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...frameProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...frameProps}
        ref={forwardedRef}
        data-slot="brand-hero-frame"
        {...stylex.props(brandHeroStyles.frame)}
      />
    )
  },
)

const BrandHeroMessage = forwardRef<HTMLDivElement, BrandHeroMessageProps>(
  function BrandHeroMessage(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...messageProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...messageProps}
        ref={forwardedRef}
        data-slot="brand-hero-message"
        {...stylex.props(brandHeroStyles.message)}
      />
    )
  },
)

const BrandHeroHeadings = forwardRef<HTMLDivElement, BrandHeroHeadingsProps>(
  function BrandHeroHeadings(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...headingsProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...headingsProps}
        ref={forwardedRef}
        data-slot="brand-hero-headings"
        {...stylex.props(brandHeroStyles.headings)}
      />
    )
  },
)

/** Arranges the primary message at the top of a brand page. */
export const BrandHero = Object.assign(BrandHeroRoot, {
  Content: BrandHeroContent,
  Frame: BrandHeroFrame,
  Message: BrandHeroMessage,
  Headings: BrandHeroHeadings,
})
