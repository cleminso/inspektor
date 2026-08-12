import { Button as BaseButton } from '@base-ui/react/button'
import { mergeProps } from '@base-ui/react/merge-props'
import { forwardRef, useContext } from 'react'
import type React from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import {
  ButtonContent,
  ButtonGlyph,
  buttonLayoutOptions,
  getButtonVisualStyles,
  type ButtonGlyphSize,
  type ButtonLayout,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from './buttonVisuals'

export type {
  ButtonGlyphProps,
  ButtonGlyphSize,
  ButtonLayout,
  ButtonRadius,
  ButtonSize,
  ButtonVariant,
} from './buttonVisuals'

type BaseButtonProps = Omit<
  BaseButton.Props,
  'className' | 'nativeButton' | 'prefix' | 'style'
>

interface ButtonSharedProps {
  /** Controls the visual treatment and emphasis of the action. */
  variant?: ButtonVariant
  /** Controls the button height and horizontal padding. */
  size?: ButtonSize
  /** Shows a leading spinner, preserves the label, and blocks interaction. */
  loading?: boolean
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Selects the standard glyph treatment or the explicit compact-control exception. */
  glyphSize?: ButtonGlyphSize
  /** Disables interaction and exposes the disabled state to assistive technology. */
  disabled?: BaseButton.Props['disabled']
  /** Keeps a disabled action keyboard-focusable when its label or explanation must remain discoverable. */
  focusableWhenDisabled?: BaseButton.Props['focusableWhenDisabled']
  /** Composes Button behavior and styles onto another native button component. */
  render?: BaseButton.Props['render']
}

interface LabelButtonProps {
  /** Makes the button a square icon-only action. */
  iconOnly?: false
  /** Selects inline or full-width row action layout. */
  layout?: ButtonLayout
  /** Renders decorative content before the visible label. */
  prefix?: React.ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: React.ReactNode
}

interface IconOnlyButtonProps {
  /** Makes the button a square icon-only action. */
  iconOnly: true
  /** Identifies the icon-only action for assistive technology. */
  'aria-label': string
  layout?: never
  prefix?: never
  suffix?: never
}

export type ButtonProps = BaseButtonProps &
  ButtonSharedProps &
  (LabelButtonProps | IconOnlyButtonProps)

const ButtonRoot = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'm',
    loading = false,
    iconOnly = false,
    layout = 'inline',
    radius = 'xs',
    glyphSize = 'standard',
    prefix,
    suffix,
    disabled = false,
    focusableWhenDisabled = false,
    render,
    children,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    type = 'button',
    ...props
  },
  forwardedRef,
) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const layoutOptions = buttonLayoutOptions[layout]
  const isDisabled = disabled === true
  const isInteractionBlocked = isDisabled === true || loading === true
  const stateStyleProps = createStateStyleProps<BaseButton.State>((state) =>
    getButtonVisualStyles({
      variant,
      size,
      square: iconOnly,
      pressed: ariaPressed === true,
      expanded: ariaExpanded === true,
      radius,
      fill: layoutOptions.fill,
      alignment: layoutOptions.alignment,
      orientation: buttonGroupOrientation,
      disabled: state.disabled,
      hasPrefix: loading === true || prefix !== undefined,
      hasSuffix: suffix !== undefined,
    }),
  )
  const compositionProps = props as typeof props &
    Pick<BaseButton.Props, 'className' | 'style'>
  const {
    className: compositionClassName,
    style: compositionStyle,
    ...buttonProps
  } = compositionProps
  function resolveStateStyleProps(state: BaseButton.State) {
    return mergeProps<'button'>(
      {
        className: stateStyleProps.className(state),
        style: stateStyleProps.style(state),
      },
      {
        className:
          typeof compositionClassName === 'function'
            ? compositionClassName(state)
            : compositionClassName,
        style:
          typeof compositionStyle === 'function' ? compositionStyle(state) : compositionStyle,
      },
    )
  }

  return (
    <BaseButton
      {...buttonProps}
      ref={forwardedRef}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      disabled={isInteractionBlocked}
      focusableWhenDisabled={loading === true || focusableWhenDisabled === true}
      render={render}
      type={type}
      className={(state) => resolveStateStyleProps(state).className}
      style={(state) => resolveStateStyleProps(state).style}
      aria-busy={loading === true ? true : undefined}
      data-full-width={layoutOptions.fill === true ? '' : undefined}
      data-glyph-size={glyphSize}
      data-expanded={ariaExpanded === true ? '' : undefined}
      data-icon-only={iconOnly === true ? '' : undefined}
      data-loading={loading === true ? '' : undefined}
      data-pressed={ariaPressed === true ? '' : undefined}
      data-layout={layout}
      data-radius={radius}
      data-size={size}
      data-slot="button"
      data-variant={variant}
    >
      <ButtonContent
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        iconOnly={iconOnly}
        size={size}
        glyphSize={glyphSize}
      >
        {children}
      </ButtonContent>
    </BaseButton>
  )
})

export const Button = Object.assign(ButtonRoot, { Glyph: ButtonGlyph })
