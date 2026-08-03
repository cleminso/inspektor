import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, useContext } from 'react'

import { buttonGroupStyles } from './buttonGroup.styles'
import { ButtonGroupOrientationContext, type ButtonGroupOrientation } from './buttonGroupContext'

export type { ButtonGroupOrientation } from './buttonGroupContext'

export interface ButtonGroupProps extends Omit<
  useRender.ComponentProps<'div'>,
  'className' | 'role' | 'style'
> {
  /** Controls the direction in which grouped controls are arranged. */
  orientation?: ButtonGroupOrientation
  /** Composes ButtonGroup behavior and styles onto another element. */
  render?: useRender.ComponentProps<'div'>['render']
}

export interface ButtonGroupTextProps extends Omit<
  useRender.ComponentProps<'div'>,
  'className' | 'render' | 'style'
> {}

export interface ButtonGroupSeparatorProps extends Omit<
  useRender.ComponentProps<'div'>,
  'aria-orientation' | 'className' | 'render' | 'role' | 'style'
> {
  /** Controls the separator axis. Use the opposite axis of the group orientation. */
  orientation?: ButtonGroupOrientation
}

const orientationStyles = {
  horizontal: buttonGroupStyles.horizontal,
  vertical: buttonGroupStyles.vertical,
} satisfies Record<ButtonGroupOrientation, unknown>

const separatorOrientationStyles = {
  horizontal: buttonGroupStyles.separatorHorizontal,
  vertical: buttonGroupStyles.separatorVertical,
} satisfies Record<ButtonGroupOrientation, unknown>

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { orientation = 'horizontal', render, ...props },
  forwardedRef,
) {
  const styleProps = stylex.props(buttonGroupStyles.root, orientationStyles[orientation])
  const defaultProps = {
    ...styleProps,
  } as useRender.ComponentProps<'div'>
  const invariantProps = {
    role: 'group',
    'data-slot': 'button-group',
    'data-orientation': orientation,
  } as useRender.ComponentProps<'div'>
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as useRender.ComponentProps<'div'>

  const element = useRender({
    defaultTagName: 'div',
    render,
    ref: forwardedRef,
    props: mergeProps<'div'>(defaultProps, domProps, invariantProps),
  })

  return (
    <ButtonGroupOrientationContext.Provider value={orientation}>
      {element}
    </ButtonGroupOrientationContext.Provider>
  )
})

export const ButtonGroupText = forwardRef<HTMLDivElement, ButtonGroupTextProps>(
  function ButtonGroupText(props, forwardedRef) {
    const orientation = useContext(ButtonGroupOrientationContext)
    const styleProps = stylex.props(
      buttonGroupStyles.text,
      orientation !== null && buttonGroupStyles.member,
      orientation === 'horizontal' && buttonGroupStyles.memberHorizontal,
      orientation === 'vertical' && buttonGroupStyles.memberVertical,
    )
    const defaultProps = {
      ...styleProps,
      'data-slot': 'button-group-text',
    } as useRender.ComponentProps<'div'>
    const domProps = Object.fromEntries(
      Object.entries(props).filter(
        ([key]) => key !== 'className' && key !== 'render' && key !== 'style',
      ),
    ) as useRender.ComponentProps<'div'>

    return useRender({
      defaultTagName: 'div',
      ref: forwardedRef,
      props: mergeProps<'div'>(defaultProps, domProps),
    })
  },
)

export const ButtonGroupSeparator = forwardRef<HTMLDivElement, ButtonGroupSeparatorProps>(
  function ButtonGroupSeparator({ orientation = 'vertical', ...props }, forwardedRef) {
    const styleProps = stylex.props(
      buttonGroupStyles.separator,
      separatorOrientationStyles[orientation],
    )
    const defaultProps = {
      ...styleProps,
    } as useRender.ComponentProps<'div'>
    const invariantProps = {
      role: 'separator',
      'aria-orientation': orientation,
      'data-slot': 'button-group-separator',
      'data-orientation': orientation,
    } as useRender.ComponentProps<'div'>
    const domProps = Object.fromEntries(
      Object.entries(props).filter(
        ([key]) => key !== 'className' && key !== 'render' && key !== 'style',
      ),
    ) as useRender.ComponentProps<'div'>

    return useRender({
      defaultTagName: 'div',
      ref: forwardedRef,
      props: mergeProps<'div'>(defaultProps, domProps, invariantProps),
    })
  },
)
