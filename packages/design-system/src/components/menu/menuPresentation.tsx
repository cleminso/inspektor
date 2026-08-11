import type { Menu as BaseMenu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { CheckGlyph, ChevronRightGlyph } from '../icon/iconArtwork'
import { menuStyles } from './menu.styles'

type MenuPresentationItemVariant = 'default' | 'danger'

export function getMenuPositionerStyles(state: BaseMenu.Positioner.State) {
  return [
    menuStyles.positioner,
    state.open === true && menuStyles.positionerOpen,
    state.open === false && menuStyles.positionerClosed,
    state.side === 'top' && menuStyles.positionerSideTop,
    state.side === 'bottom' && menuStyles.positionerSideBottom,
    state.side === 'left' && menuStyles.positionerSideLeft,
    state.side === 'right' && menuStyles.positionerSideRight,
    state.side === 'inline-start' && menuStyles.positionerSideInlineStart,
    state.side === 'inline-end' && menuStyles.positionerSideInlineEnd,
    state.align === 'start' && menuStyles.positionerAlignStart,
    state.align === 'center' && menuStyles.positionerAlignCenter,
    state.align === 'end' && menuStyles.positionerAlignEnd,
    state.anchorHidden === true && menuStyles.positionerAnchorHidden,
    state.nested === true && menuStyles.positionerNested,
    state.instant !== undefined && menuStyles.positionerInstant,
  ]
}

export function getMenuPopupStyles(state: BaseMenu.Popup.State) {
  return [
    menuStyles.popup,
    scrollbarStyles.standard,
    (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') &&
      menuStyles.popupTransition,
    state.open === true && menuStyles.popupOpen,
    state.open === false && menuStyles.popupClosed,
    state.transitionStatus === 'starting' && menuStyles.popupStarting,
    state.transitionStatus === 'ending' && menuStyles.popupEnding,
    state.side === 'top' && menuStyles.popupSideTop,
    state.side === 'bottom' && menuStyles.popupSideBottom,
    state.side === 'left' && menuStyles.popupSideLeft,
    state.side === 'right' && menuStyles.popupSideRight,
    state.side === 'inline-start' && menuStyles.popupSideInlineStart,
    state.side === 'inline-end' && menuStyles.popupSideInlineEnd,
    state.align === 'start' && menuStyles.popupAlignStart,
    state.align === 'center' && menuStyles.popupAlignCenter,
    state.align === 'end' && menuStyles.popupAlignEnd,
    state.nested === true && menuStyles.popupNested,
    state.instant !== undefined && menuStyles.popupInstant,
  ]
}

export function getMenuItemStyles(
  state: BaseMenu.Item.State,
  variant: MenuPresentationItemVariant,
) {
  return [
    menuStyles.item,
    variant === 'danger' && menuStyles.itemDanger,
    state.highlighted === true && menuStyles.itemHighlighted,
    variant === 'danger' && state.highlighted === true && menuStyles.itemDangerHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
    state.disabled === true && menuStyles.itemDisabledState,
  ]
}

export function getMenuLinkItemStyles(state: BaseMenu.LinkItem.State) {
  return [menuStyles.item, state.highlighted === true && menuStyles.itemHighlighted]
}

export function getMenuSeparatorStyles(state: BaseMenu.Separator.State) {
  return [
    menuStyles.separator,
    state.orientation === 'horizontal' && menuStyles.separatorHorizontal,
    state.orientation === 'vertical' && menuStyles.separatorVertical,
  ]
}

export function getMenuCheckboxItemStyles(state: BaseMenu.CheckboxItem.State) {
  return [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.checked === false && menuStyles.itemUnchecked,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]
}

export function getMenuCheckboxIndicatorStyles(state: BaseMenu.CheckboxItemIndicator.State) {
  return [
    menuStyles.indicator,
    state.checked === true && menuStyles.checkboxIndicatorChecked,
    state.checked === false && menuStyles.checkboxIndicatorUnchecked,
    state.disabled === true && menuStyles.checkboxIndicatorDisabled,
    state.highlighted === true && menuStyles.checkboxIndicatorHighlighted,
    state.transitionStatus === 'starting' && menuStyles.checkboxIndicatorStarting,
    state.transitionStatus === 'ending' && menuStyles.checkboxIndicatorEnding,
  ]
}

export function getMenuRadioGroupStyles(state: BaseMenu.RadioGroup.State) {
  return [state.disabled === true && menuStyles.radioGroupDisabled]
}

export function getMenuRadioItemStyles(state: BaseMenu.RadioItem.State) {
  return [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.checked === false && menuStyles.itemUnchecked,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]
}

export function getMenuRadioIndicatorStyles(state: BaseMenu.RadioItemIndicator.State) {
  return [
    menuStyles.indicator,
    state.checked === true && menuStyles.radioIndicatorChecked,
    state.checked === false && menuStyles.radioIndicatorUnchecked,
    state.disabled === true && menuStyles.radioIndicatorDisabled,
    state.highlighted === true && menuStyles.radioIndicatorHighlighted,
    state.transitionStatus === 'starting' && menuStyles.radioIndicatorStarting,
    state.transitionStatus === 'ending' && menuStyles.radioIndicatorEnding,
  ]
}

export function getMenuSubmenuTriggerStyles(state: BaseMenu.SubmenuTrigger.State) {
  return [
    menuStyles.item,
    state.open === true && menuStyles.itemOpen,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]
}

export function MenuCheckIcon() {
  return (
    <CheckGlyph
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...stylex.props(menuStyles.icon)}
    />
  )
}

export function MenuRadioIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...stylex.props(menuStyles.icon)}
    >
      <circle
        cx="8"
        cy="8"
        r="3"
      />
    </svg>
  )
}

export function MenuSubmenuIcon() {
  return (
    <ChevronRightGlyph
      fill="currentColor"
      {...stylex.props(menuStyles.submenuIcon)}
    />
  )
}
