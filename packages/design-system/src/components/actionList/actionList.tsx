import { Button as BaseButton } from '@base-ui/react/button'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import {
  forwardRef,
  type ComponentPropsWithRef,
  type KeyboardEventHandler,
  type ReactNode,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { Checkbox } from '../checkbox/checkbox'
import { actionListStyles } from './actionList.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export interface ActionListRootProps extends Omit<
  ComponentPropsWithRef<'ul'>,
  'className' | 'style'
> {
  /** Runs when an unhandled Escape key event bubbles from within the list. Preventing default returns focus to the item's primary trigger. */
  onEscapeKeyDown?: KeyboardEventHandler<HTMLUListElement>
}

export interface ActionListItemProps extends Omit<
  useRender.ComponentProps<'li'>,
  'className' | 'style'
> {
  /** Applies the active navigation treatment. */
  active?: boolean
  /** Applies the bulk-selection treatment. */
  checked?: boolean
  /** Defers offscreen rendering work while preserving the complete mounted collection. */
  deferOffscreenRendering?: boolean
  /** Composes item behavior and styles onto another list item. */
  render?: useRender.ComponentProps<'li'>['render']
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

export interface ActionListTriggerProps extends Omit<
  WithoutStyles<BaseButton.Props>,
  'children' | 'prefix'
> {
  /** Visible action label. */
  children: ReactNode
  /** Decorative content before the label. */
  prefix?: ReactNode
  /** Disables the primary trigger. */
  disabled?: BaseButton.Props['disabled']
  /** Whether the composed render target is a native button. */
  nativeButton?: BaseButton.Props['nativeButton']
  /** Composes trigger behavior and styles onto another button or link element. */
  render?: BaseButton.Props['render']
}

export interface ActionListActionProps extends Omit<WithoutStyles<BaseButton.Props>, 'nativeButton'> {
  /** Accessible name for an icon-only action. */
  'aria-label': string
  /** Disables the trailing action. */
  disabled?: BaseButton.Props['disabled']
  /** Composes action behavior and styles onto another native button element. */
  render?: BaseButton.Props['render']
}

const ActionListRoot = forwardRef<HTMLUListElement, ActionListRootProps>(function ActionListRoot(
  { children, onEscapeKeyDown, onKeyDown, ...props },
  forwardedRef,
) {
  const handleKeyDown: KeyboardEventHandler<HTMLUListElement> = (event) => {
    onKeyDown?.(event)

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
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as ComponentPropsWithRef<'ul'>

  return (
    <ul
      {...domProps}
      ref={forwardedRef}
      {...stylex.props(actionListStyles.root)}
      data-slot="action-list"
      onKeyDown={handleKeyDown}
    >
      {children}
    </ul>
  )
})

const ActionListItem = forwardRef<HTMLLIElement, ActionListItemProps>(function ActionListItem(
  { children, active = false, checked = false, deferOffscreenRendering = false, render, ...props },
  forwardedRef,
) {
  const defaultProps = {
    ...stylex.props(
      actionListStyles.item,
      deferOffscreenRendering === true && actionListStyles.itemDeferred,
      checked === true && actionListStyles.itemChecked,
      active === true && actionListStyles.itemActive,
    ),
    children,
    'data-active': active === true ? '' : undefined,
    'data-checked': checked === true ? '' : undefined,
    'data-rendering': deferOffscreenRendering === true ? 'deferred' : undefined,
    'data-slot': 'action-list-item',
  } as useRender.ComponentProps<'li'>

  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as useRender.ComponentProps<'li'>

  return useRender({
    defaultTagName: 'li',
    render,
    ref: forwardedRef,
    props: mergeProps<'li'>(defaultProps, domProps, {
      'data-slot': 'action-list-item',
    } as useRender.ComponentProps<'li'>),
  })
})

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

const ActionListTrigger = forwardRef<HTMLElement, ActionListTriggerProps>(
  function ActionListTrigger(
    { children, prefix, disabled = false, nativeButton = true, ...props },
    forwardedRef,
  ) {
    const stateStyles = createStateStyleProps<BaseButton.State>((state) => [
      actionListStyles.trigger,
      state.disabled === true && actionListStyles.triggerDisabled,
    ])

    return (
      <BaseButton
        {...props}
        ref={forwardedRef}
        disabled={disabled}
        nativeButton={nativeButton}
        {...stateStyles}
        data-slot="action-list-trigger"
      >
        {prefix === undefined ? null : (
          <span aria-hidden="true" {...stylex.props(actionListStyles.prefix)}>
            {prefix}
          </span>
        )}
        <span {...stylex.props(actionListStyles.label)}>{children}</span>
      </BaseButton>
    )
  },
)

const ActionListAction = forwardRef<HTMLElement, ActionListActionProps>(function ActionListAction(
  { disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseButton.State>((state) => [
    actionListStyles.action,
    state.disabled === true && actionListStyles.actionDisabled,
  ])
  return (
    <BaseButton
      {...props}
      ref={forwardedRef}
      disabled={disabled}
      nativeButton
      {...stateStyles}
      data-slot="action-list-action"
    />
  )
})

export const ActionList = Object.assign(ActionListRoot, {
  Root: ActionListRoot,
  Action: ActionListAction,
  Item: ActionListItem,
  SelectionControl: ActionListSelectionControl,
  Trigger: ActionListTrigger,
})
