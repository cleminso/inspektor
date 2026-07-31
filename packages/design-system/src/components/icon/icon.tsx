import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { iconStyles } from './icon.styles'

export type IconSize = 'xs' | 's' | 'm'

export interface IconProps {
  /** Composes semantic icon presentation onto SVG artwork. */
  render: NonNullable<useRender.ComponentProps<'span'>['render']>
  /** Controls the rendered icon dimensions. */
  size?: IconSize
}

const sizeStyles = {
  xs: iconStyles.xs,
  s: iconStyles.s,
  m: iconStyles.m,
} satisfies Record<IconSize, unknown>

export function Icon({ render, size = 's' }: IconProps) {
  const defaultProps = {
    ...stylex.props(iconStyles.base, sizeStyles[size]),
    'aria-hidden': true,
    'data-size': size,
    'data-slot': 'icon',
  } as useRender.ElementProps<'span'>

  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(defaultProps, {}),
  })
}
