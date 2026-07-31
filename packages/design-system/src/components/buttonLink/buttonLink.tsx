import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { useContext, type ReactNode } from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import {
  ButtonContent,
  getButtonOpticalAlignment,
  getButtonVisualStyles,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from '../button/buttonVisuals'

type BaseButtonLinkProps = Omit<
  useRender.ComponentProps<'a'>,
  'className' | 'color' | 'prefix' | 'style'
>

interface ButtonLinkSharedProps {
  /** Controls the visual treatment and emphasis of the navigation link. */
  variant?: ButtonVariant
  /** Controls the link height and horizontal padding. */
  size?: ButtonSize
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Identifies the native anchor destination when render composition is not used. */
  href?: useRender.ComponentProps<'a'>['href']
  /** Composes ButtonLink presentation onto a router link component. */
  render?: useRender.ComponentProps<'a'>['render']
}

interface LabelButtonLinkProps {
  /** Makes the link a square icon-only action. */
  iconOnly?: false
  /** Stretches the link to the width of its container. */
  fullWidth?: boolean
  /** Controls how content is distributed inside the link. */
  justify?: ButtonJustify
  /** Renders decorative content before the visible label. */
  prefix?: ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: ReactNode
}

interface IconOnlyButtonLinkProps {
  /** Makes the link a square icon-only action. */
  iconOnly: true
  /** Identifies the icon-only navigation action for assistive technology. */
  'aria-label': string
  fullWidth?: never
  justify?: never
  prefix?: never
  suffix?: never
}

export type ButtonLinkProps = BaseButtonLinkProps &
  ButtonLinkSharedProps &
  (LabelButtonLinkProps | IconOnlyButtonLinkProps)

export function ButtonLink({
  variant = 'primary',
  size = 'm',
  iconOnly = false,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
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
    justify,
  })
  const styleProps = stylex.props(
    ...getButtonVisualStyles({
      variant,
      size,
      square: iconOnly,
      pressed: false,
      fullWidth,
      justify,
      radius,
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
        justify={justify}
        size={size}
        iconOnly={iconOnly}
      >
        {children}
      </ButtonContent>
    ),
    'data-full-width': fullWidth === true ? '' : undefined,
    'data-icon-only': iconOnly === true ? '' : undefined,
    'data-optical-alignment': opticalAlignment,
    'data-radius': radius,
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
