import * as stylex from '@stylexjs/stylex'
import {
  forwardRef,
  type ComponentPropsWithRef,
  type ForwardRefExoticComponent,
} from 'react'

import { iconStyles } from './icon.styles'

export type IconSize = 'xs' | 's' | 'm'
/** Props an SVG artwork component must forward to its root SVG element. */
export type IconArtworkProps = ComponentPropsWithRef<'svg'>
export type IconArtwork = ForwardRefExoticComponent<IconArtworkProps>

export interface IconProps {
  /** Ref-forwarding SVG component that follows the documented artwork protocol. */
  artwork: IconArtwork
  /** Controls the rendered icon dimensions. */
  size?: IconSize
}

const sizeStyles = {
  xs: iconStyles.xs,
  s: iconStyles.s,
  m: iconStyles.m,
} satisfies Record<IconSize, unknown>

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { artwork: Artwork, size = 's' },
  forwardedRef,
) {
  return (
    <Artwork
      ref={forwardedRef}
      aria-hidden="true"
      data-size={size}
      data-slot="icon"
      focusable="false"
      {...stylex.props(iconStyles.base, sizeStyles[size])}
    />
  )
})
