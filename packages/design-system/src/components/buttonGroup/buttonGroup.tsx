import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { buttonGroupStyles } from './buttonGroup.styles'

export type ButtonGroupOrientation = 'horizontal' | 'vertical'

export interface ButtonGroupRootProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Controls the direction in which grouped controls are arranged. */
  orientation?: ButtonGroupOrientation
  /** Composes ButtonGroup behavior and styles onto another element. */
  render?: useRender.ComponentProps<'div'>['render']
}

export interface ButtonGroupSeparatorProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Controls the separator axis. Use the opposite axis of the group orientation. */
  orientation?: ButtonGroupOrientation
  /** Composes the separator behavior and styles onto another element. */
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

function ButtonGroupRoot({
  orientation = 'horizontal',
  render,
  ...props
}: ButtonGroupRootProps) {
  const styles = stylex.props(buttonGroupStyles.root, orientationStyles[orientation])
  const defaultProps = {
    ...styles,
    role: 'group',
    'data-slot': 'button-group',
    'data-orientation': orientation,
  } as useRender.ComponentProps<'div'>

  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(defaultProps, props),
  })
}

function ButtonGroupSeparator({
  orientation = 'vertical',
  render,
  ...props
}: ButtonGroupSeparatorProps) {
  const styles = stylex.props(
    buttonGroupStyles.separator,
    separatorOrientationStyles[orientation],
  )
  const defaultProps = {
    ...styles,
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

export const ButtonGroup = Object.assign(ButtonGroupRoot, {
  Root: ButtonGroupRoot,
  Separator: ButtonGroupSeparator,
})
