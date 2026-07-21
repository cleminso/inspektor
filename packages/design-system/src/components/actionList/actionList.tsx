import { Button as BaseButton } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'
import type { KeyboardEventHandler, ReactNode } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { Checkbox } from '../checkbox/checkbox'
import { actionListStyles } from './actionList.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export interface ActionListRootProps {
  /** Action-list items. */
  children?: ReactNode
  /** Accessible name for the list. */
  'aria-label'?: string
  /** Identifies the element that labels the list. */
  'aria-labelledby'?: string
  /** Runs when an unhandled Escape key event bubbles from within the list. Preventing default returns focus to the item's primary trigger. */
  onEscapeKeyDown?: KeyboardEventHandler<HTMLUListElement>
}

export interface ActionListItemProps {
  /** Optional selection control, primary trigger, and optional trailing action. */
  children?: ReactNode
  /** Applies the active navigation treatment. */
  active?: boolean
  /** Applies the bulk-selection treatment. */
  checked?: boolean
}

export interface ActionListSelectionControlProps {
  /** Accessible name describing which item the checkbox selects. */
  'aria-label': string
  /** Controls whether this item participates in the bulk selection. */
  checked: boolean
  /** Disables selection for this item. */
  disabled?: boolean
  /** Leading icon shown while the selection control is inactive. */
  icon: ReactNode
  /** Runs when the checked state changes. */
  onCheckedChange?: React.ComponentProps<typeof Checkbox>['onCheckedChange']
}

export interface ActionListTriggerProps
  extends Omit<WithoutStyles<BaseButton.Props>, 'children' | 'prefix'> {
  /** Visible action label. */
  children: ReactNode
  /** Decorative content before the label. */
  prefix?: ReactNode
  /** Disables the primary trigger. */
  disabled?: BaseButton.Props['disabled']
  /** Composes trigger behavior and styles onto another element. */
  render?: BaseButton.Props['render']
}

export interface ActionListActionProps extends WithoutStyles<BaseButton.Props> {
  /** Accessible name for an icon-only action. */
  'aria-label': string
  /** Disables the trailing action. */
  disabled?: BaseButton.Props['disabled']
  /** Composes action behavior and styles onto another element. */
  render?: BaseButton.Props['render']
}

function ActionListRoot({ children, onEscapeKeyDown, ...props }: ActionListRootProps) {
  const handleKeyDown: KeyboardEventHandler<HTMLUListElement> = (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented === true) {
      return
    }

    onEscapeKeyDown?.(event)

    if (event.defaultPrevented === false || event.target instanceof Element === false) {
      return
    }

    const item = event.target.closest('[data-slot="action-list-item"]')
    const trigger = item?.querySelector<HTMLElement>('[data-slot="action-list-trigger"]')
    trigger?.focus()
  }

  return (
    <ul
      {...props}
      {...stylex.props(actionListStyles.root)}
      data-slot="action-list"
      onKeyDown={handleKeyDown}
    >
      {children}
    </ul>
  )
}

function ActionListItem({ children, active = false, checked = false }: ActionListItemProps) {
  return (
    <li
      {...stylex.props(
        actionListStyles.item,
        checked === true && actionListStyles.itemChecked,
        active === true && actionListStyles.itemActive,
      )}
      data-active={active === true ? '' : undefined}
      data-checked={checked === true ? '' : undefined}
      data-slot="action-list-item"
    >
      {children}
    </li>
  )
}

function ActionListSelectionControl({
  'aria-label': ariaLabel,
  checked,
  disabled = false,
  icon,
  onCheckedChange,
}: ActionListSelectionControlProps) {
  return (
    <span
      {...stylex.props(
        actionListStyles.selectionControl,
        checked === true && actionListStyles.selectionControlChecked,
      )}
      data-slot="action-list-selection-control"
    >
      <span aria-hidden="true" {...stylex.props(actionListStyles.selectionIcon)}>
        {icon}
      </span>
      <span {...stylex.props(actionListStyles.selectionCheckbox)}>
        <Checkbox
          aria-label={ariaLabel}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          size="s"
        />
      </span>
    </span>
  )
}

function ActionListTrigger({ children, prefix, disabled = false, ...props }: ActionListTriggerProps) {
  const stateStyles = createStateStyleProps<BaseButton.State>((state) => [
    actionListStyles.trigger,
    state.disabled === true && actionListStyles.triggerDisabled,
  ])

  return (
    <BaseButton {...props} disabled={disabled} {...stateStyles} data-slot="action-list-trigger">
      {prefix === undefined ? null : (
        <span aria-hidden="true" {...stylex.props(actionListStyles.prefix)}>
          {prefix}
        </span>
      )}
      <span {...stylex.props(actionListStyles.label)}>{children}</span>
    </BaseButton>
  )
}

function ActionListAction({ disabled = false, ...props }: ActionListActionProps) {
  const stateStyles = createStateStyleProps<BaseButton.State>((state) => [
    actionListStyles.action,
    state.disabled === true && actionListStyles.actionDisabled,
  ])
  return (
    <BaseButton {...props} disabled={disabled} {...stateStyles} data-slot="action-list-action" />
  )
}

export const ActionList = Object.assign(ActionListRoot, {
  Root: ActionListRoot,
  Action: ActionListAction,
  Item: ActionListItem,
  SelectionControl: ActionListSelectionControl,
  Trigger: ActionListTrigger,
})
