import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { badgeStyles } from './badge.styles'

export type BadgeSize = 's' | 'xs'

export interface BadgeProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'children' | 'className' | 'style'
> {
  /** Short text that identifies a status or category. */
  children: string
  /** Controls badge height. */
  size?: BadgeSize
}

const sizeStyles = {
  xs: badgeStyles.sizeXs,
  s: badgeStyles.sizeS,
} satisfies Record<BadgeSize, unknown>

/** Displays compact text metadata without implying an action. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { size = 's', ...props },
  forwardedRef,
) {
  const {
    className: _className,
    style: _style,
    ...badgeProps
  } = props as ComponentPropsWithRef<'span'>

  return (
    <span
      {...badgeProps}
      ref={forwardedRef}
      data-slot="badge"
      data-size={size}
      {...stylex.props(badgeStyles.root, sizeStyles[size])}
    />
  )
})
