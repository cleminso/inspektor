import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { useContext, type ReactNode } from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import {
  ButtonContent,
  getButtonOpticalAlignment,
  getButtonVisualStyles,
  type ButtonInset,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from '../button/buttonVisuals'

export interface ButtonLinkProps
  extends Omit<
    useRender.ComponentProps<'a'>,
    'className' | 'color' | 'prefix' | 'style'
  > {
  /** Controls the visual treatment and emphasis of the navigation link. */
  variant?: ButtonVariant
  /** Controls the link height and horizontal padding. */
  size?: ButtonSize
  /** Makes an icon-only link square. Pair with an accessible label. */
  shape?: ButtonShape
  /** Stretches the link to the width of its container. */
  fullWidth?: boolean
  /** Controls how content is distributed inside the link. */
  justify?: ButtonJustify
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Controls the inline inset for navigation aligned with compact popup content. */
  inset?: ButtonInset
  /** Renders decorative content before the visible label. */
  prefix?: ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: ReactNode
  /** Identifies the native anchor destination when render composition is not used. */
  href?: useRender.ComponentProps<'a'>['href']
  /** Composes ButtonLink presentation onto a router link component. */
  render?: useRender.ComponentProps<'a'>['render']
}

export function ButtonLink({
  variant = 'primary',
  size = 'm',
  shape,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
  inset = 'default',
  prefix,
  suffix,
  render,
  children,
  ...props
}: ButtonLinkProps) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const opticalAlignment = getButtonOpticalAlignment({
    prefix,
    suffix,
    loading: false,
    shape,
    justify,
    inset,
  })
  const styleProps = stylex.props(
    ...getButtonVisualStyles({
      variant,
      size,
      shape,
      fullWidth,
      justify,
      radius,
      inset,
      orientation: buttonGroupOrientation,
      disabled: false,
      opticalAlignment,
    }),
  )
  const defaultProps = {
    ...styleProps,
    children: (
      <ButtonContent
        prefix={prefix}
        suffix={suffix}
        shape={shape}
        justify={justify}
        size={size}
      >
        {children}
      </ButtonContent>
    ),
    'data-full-width': fullWidth === true ? '' : undefined,
    'data-inset': inset,
    'data-optical-alignment': opticalAlignment,
    'data-radius': radius,
    'data-shape': shape,
    'data-size': size,
    'data-slot': 'button-link',
    'data-variant': variant,
  } as useRender.ElementProps<'a'>
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as useRender.ComponentProps<'a'>

  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(defaultProps, domProps),
  })
}
