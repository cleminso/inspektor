import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, useContext, type ReactNode } from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import {
  ButtonContent,
  buttonLayoutOptions,
  getButtonVisualStyles,
  type ButtonLayout,
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
  /** Selects inline or leading-aligned full-width row navigation layout. */
  layout?: Exclude<ButtonLayout, 'fill' | 'stacked'>
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
  layout?: never
  prefix?: never
  suffix?: never
}

export type ButtonLinkProps = BaseButtonLinkProps &
  ButtonLinkSharedProps &
  (LabelButtonLinkProps | IconOnlyButtonLinkProps)

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = 'primary',
    size = 'm',
    iconOnly = false,
    layout = 'inline',
    radius = 'xs',
    prefix,
    suffix,
    render,
    children,
    ...props
  },
  forwardedRef,
) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const layoutOptions = buttonLayoutOptions[layout]
  const isCurrent = props['aria-current'] === 'page'
  const styleProps = stylex.props(
    ...getButtonVisualStyles({
      variant,
      size,
      square: iconOnly,
      pressed: isCurrent,
      radius,
      fill: layoutOptions.fill,
      alignment: layoutOptions.alignment,
      orientation: buttonGroupOrientation,
      disabled: false,
      hasPrefix: prefix !== undefined,
      hasSuffix: suffix !== undefined,
    }),
  )
  const defaultProps = {
    ...styleProps,
    children: (
      <ButtonContent
        prefix={prefix}
        suffix={suffix}
        size={size}
        iconOnly={iconOnly}
        layout={layout}
      >
        {children}
      </ButtonContent>
    ),
    'data-full-width': layoutOptions.fill === true ? '' : undefined,
    'data-icon-only': iconOnly === true ? '' : undefined,
    'data-layout': layout,
    'data-radius': radius,
    'data-size': size,
    'data-slot': 'button-link',
    'data-variant': variant,
  } as useRender.ElementProps<'a'>
  const domProps = props as useRender.ComponentProps<'a'>

  return useRender({
    defaultTagName: 'a',
    render,
    ref: forwardedRef,
    props: mergeProps<'a'>(defaultProps, domProps),
  })
})
