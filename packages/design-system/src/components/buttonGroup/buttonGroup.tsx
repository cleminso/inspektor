import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'

import { buttonGroupStyles } from './buttonGroup.styles'
import {
  ButtonGroupOrientationContext,
  type ButtonGroupOrientation,
} from './buttonGroupContext'

export type { ButtonGroupOrientation } from './buttonGroupContext'

export interface ButtonGroupProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Controls the direction in which grouped controls are arranged. */
  orientation?: ButtonGroupOrientation
  /** Composes ButtonGroup behavior and styles onto another element. */
  render?: useRender.ComponentProps<'div'>['render']
}

export interface ButtonGroupTextProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Composes ButtonGroupText behavior and styles onto another element. */
  render?: useRender.ComponentProps<'div'>['render']
}

export interface ButtonGroupSeparatorProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Controls the separator axis. Use the opposite axis of the group orientation. */
  orientation?: ButtonGroupOrientation
  /** Composes ButtonGroupSeparator behavior and styles onto another element. */
  render?: useRender.ComponentProps<'div'>['render']
}

const orientationStyles = {
  horizontal: buttonGroupStyles.horizontal,
  vertical: buttonGroupStyles.vertical,
} satisfies Record<ButtonGroupOrientation, unknown>

const separatorOrientationStyles = {
  horizontal: buttonGroupStyles.separatorHorizontal,
  vertical: buttonGroupStyles.separatorVertical,
} satisfies Record<ButtonGroupOrientation, unknown>

export function ButtonGroup({
  orientation = 'horizontal',
  render,
  ...props
}: ButtonGroupProps) {
  const styleProps = stylex.props(
    buttonGroupStyles.root,
    orientationStyles[orientation],
  )
  const defaultProps = {
    ...styleProps,
    role: 'group',
    'data-slot': 'button-group',
    'data-orientation': orientation,
  } as useRender.ComponentProps<'div'>

  const element = useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(defaultProps, props),
  })

  return (
    <ButtonGroupOrientationContext.Provider value={orientation}>
      {element}
    </ButtonGroupOrientationContext.Provider>
  )
}

export function ButtonGroupText({ render, ...props }: ButtonGroupTextProps) {
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

  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(defaultProps, props),
  })
}

export function ButtonGroupSeparator({
  orientation = 'vertical',
  render,
  ...props
}: ButtonGroupSeparatorProps) {
  const styleProps = stylex.props(
    buttonGroupStyles.separator,
    separatorOrientationStyles[orientation],
  )
  const defaultProps = {
    ...styleProps,
    role: 'separator',
    'aria-orientation': orientation,
    'data-slot': 'button-group-separator',
    'data-orientation': orientation,
  } as useRender.ComponentProps<'div'>

  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(defaultProps, props),
  })
}
