import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { brandPageFrameStyles } from './pageFrame.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export type BrandPageFrameRootProps = WithoutStyles<ComponentPropsWithRef<'div'>>
export type BrandPageFrameHeaderProps = WithoutStyles<ComponentPropsWithRef<'header'>>
export type BrandPageFrameMainProps = WithoutStyles<ComponentPropsWithRef<'main'>>
export type BrandPageFrameFooterProps = WithoutStyles<ComponentPropsWithRef<'footer'>>

const BrandPageFrameRoot = forwardRef<HTMLDivElement, BrandPageFrameRootProps>(
  function BrandPageFrameRoot(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...rootProps
    } = props as ComponentPropsWithRef<'div'>

    return (
      <div
        {...rootProps}
        ref={forwardedRef}
        data-slot="brand-page-frame"
        {...stylex.props(brandPageFrameStyles.root)}
      />
    )
  },
)

const BrandPageFrameHeader = forwardRef<HTMLElement, BrandPageFrameHeaderProps>(
  function BrandPageFrameHeader(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...headerProps
    } = props as ComponentPropsWithRef<'header'>

    return (
      <header
        {...headerProps}
        ref={forwardedRef}
        data-slot="brand-page-frame-header"
        {...stylex.props(brandPageFrameStyles.region, brandPageFrameStyles.header)}
      />
    )
  },
)

const BrandPageFrameMain = forwardRef<HTMLElement, BrandPageFrameMainProps>(
  function BrandPageFrameMain(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...mainProps
    } = props as ComponentPropsWithRef<'main'>

    return (
      <main
        {...mainProps}
        ref={forwardedRef}
        data-slot="brand-page-frame-main"
        {...stylex.props(brandPageFrameStyles.region, brandPageFrameStyles.main)}
      />
    )
  },
)

const BrandPageFrameFooter = forwardRef<HTMLElement, BrandPageFrameFooterProps>(
  function BrandPageFrameFooter(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...footerProps
    } = props as ComponentPropsWithRef<'footer'>

    return (
      <footer
        {...footerProps}
        ref={forwardedRef}
        data-slot="brand-page-frame-footer"
        {...stylex.props(brandPageFrameStyles.region, brandPageFrameStyles.footer)}
      />
    )
  },
)

/** Provides the responsive structural regions for an Inspektor brand page. */
export const BrandPageFrame = Object.assign(BrandPageFrameRoot, {
  Header: BrandPageFrameHeader,
  Main: BrandPageFrameMain,
  Footer: BrandPageFrameFooter,
})
