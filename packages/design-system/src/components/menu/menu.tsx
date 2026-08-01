import { Menu as BaseMenu } from "@base-ui/react/menu";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import { useContext } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { InputGroupContext } from "../inputGroup/inputGroupContext";
import { menuStyles } from "./menu.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style" | "render">;

export type MenuItemVariant = "default" | "danger";

export interface MenuRootProps extends WithoutStyles<BaseMenu.Root.Props> {
  /** Whether the menu is initially open. */
  defaultOpen?: boolean;
  /** Whether the menu is currently open. */
  open?: boolean;
  /** Runs when the menu opens or closes. */
  onOpenChange?: BaseMenu.Root.Props["onOpenChange"];
  /** Disables interaction with the menu. */
  disabled?: boolean;
}

export interface MenuTriggerProps extends WithoutStyles<BaseMenu.Trigger.Props> {
  /** Disables the menu trigger. */
  disabled?: boolean;
  /** Composes trigger behavior onto another element. */
  render?: BaseMenu.Trigger.Props["render"];
}

export interface MenuPortalProps extends WithoutStyles<BaseMenu.Portal.Props> {
  /** Keeps the portal mounted while the menu is closed. */
  keepMounted?: boolean;
}

export type MenuPositionerProps = Pick<
  WithoutStyles<BaseMenu.Positioner.Props>,
  "align" | "children" | "side"
>;

export type MenuPopupWidth = "content" | "anchor";

export interface MenuPopupProps extends Omit<WithoutStyles<BaseMenu.Popup.Props>, "width"> {
  /** Controls whether the popup follows its content or trigger width. */
  width?: MenuPopupWidth;
}

export interface MenuContentProps extends MenuPopupProps {
  /** Aligns the popup along the trigger. */
  align?: MenuPositionerProps["align"];
  /** Keeps the content mounted while closed. */
  keepMounted?: boolean;
  /** Places the popup on a side of the trigger. */
  side?: MenuPositionerProps["side"];
}

export interface MenuItemProps extends WithoutStyles<BaseMenu.Item.Props> {
  /** Controls the action's semantic emphasis. */
  variant?: MenuItemVariant;
  /** Disables the action. */
  disabled?: boolean;
  /** Controls whether activating the item closes the menu. */
  closeOnClick?: boolean;
}

export interface MenuLinkItemProps extends WithoutStyles<BaseMenu.LinkItem.Props> {
  /** Controls whether activating the link closes the menu. */
  closeOnClick?: boolean;
}

export type MenuSeparatorProps = WithoutStyles<BaseMenu.Separator.Props>;

export interface MenuGroupProps extends WithoutStyles<BaseMenu.Group.Props> {
  /** Composes the group semantics onto another element. */
  render?: BaseMenu.Group.Props["render"];
}

export interface MenuGroupLabelProps extends WithoutStyles<BaseMenu.GroupLabel.Props> {
  /** Composes the group label onto another element. */
  render?: BaseMenu.GroupLabel.Props["render"];
}

export interface MenuShortcutProps extends Omit<
  useRender.ComponentProps<"span">,
  "className" | "style"
> {
  /** Composes the shortcut label onto another element. */
  render?: useRender.ComponentProps<"span">["render"];
}

export interface MenuCheckboxItemProps extends WithoutStyles<BaseMenu.CheckboxItem.Props> {
  /** Controls the checked state. */
  checked?: boolean;
  /** Sets the initial checked state. */
  defaultChecked?: boolean;
  /** Runs when the checked state changes. */
  onCheckedChange?: BaseMenu.CheckboxItem.Props["onCheckedChange"];
  /** Disables the option. */
  disabled?: boolean;
  /** Controls whether changing the option closes the menu. */
  closeOnClick?: boolean;
}

export interface MenuCheckboxItemIndicatorProps extends Omit<
  WithoutStyles<BaseMenu.CheckboxItemIndicator.Props>,
  "children"
> {
  /** Keeps the indicator mounted while unchecked. */
  keepMounted?: boolean;
}

export interface MenuRadioGroupProps extends WithoutStyles<BaseMenu.RadioGroup.Props> {
  /** Disables every option in the group. */
  disabled?: boolean;
}

export interface MenuRadioItemProps extends WithoutStyles<BaseMenu.RadioItem.Props> {
  /** Controls whether changing the option closes the menu. */
  closeOnClick?: boolean;
  /** Disables the option. */
  disabled?: boolean;
  /** Value represented by the option. */
  value: BaseMenu.RadioItem.Props["value"];
}

export interface MenuRadioItemIndicatorProps extends Omit<
  WithoutStyles<BaseMenu.RadioItemIndicator.Props>,
  "children"
> {
  /** Keeps the indicator mounted while unchecked. */
  keepMounted?: boolean;
}

export type MenuSubmenuRootProps = WithoutStyles<BaseMenu.SubmenuRoot.Props>;

export interface MenuSubmenuTriggerProps extends WithoutStyles<BaseMenu.SubmenuTrigger.Props> {
  /** Disables the submenu trigger. */
  disabled?: boolean;
}

export type MenuPresentationProps = Omit<
  useRender.ComponentProps<"span">,
  "className" | "style" | "render"
>;

function MenuRoot({ defaultOpen = false, disabled = false, ...props }: MenuRootProps) {
  return <BaseMenu.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

function MenuTrigger({ disabled = false, ...props }: MenuTriggerProps) {
  const inputGroup = useContext(InputGroupContext);
  const effectiveDisabled = disabled === true || inputGroup?.disabled === true;
  const stateStyles = createStateStyleProps<BaseMenu.Trigger.State>((state) => [
    menuStyles.trigger,
    inputGroup !== null && menuStyles.triggerGrouped,
    state.open === true && menuStyles.triggerOpen,
    state.disabled === true && menuStyles.disabled,
  ]);
  return (
    <BaseMenu.Trigger
      {...props}
      disabled={effectiveDisabled}
      {...stateStyles}
      data-slot="menu-trigger"
      data-grouped={inputGroup === null ? undefined : ""}
    />
  );
}

function MenuPortal({ keepMounted = false, ...props }: MenuPortalProps) {
  return <BaseMenu.Portal {...props} keepMounted={keepMounted} />;
}

function MenuPositioner({ align = "start", ...props }: MenuPositionerProps) {
  const stateStyles = createStateStyleProps<BaseMenu.Positioner.State>(() => [
    menuStyles.positioner,
  ]);
  return (
    <BaseMenu.Positioner
      {...props}
      sideOffset={popupPositioning.dropdownSideOffset}
      align={align}
      {...stateStyles}
    />
  );
}

const popupWidthStyles = {
  content: menuStyles.popupWidthContent,
  anchor: menuStyles.popupWidthAnchor,
} satisfies Record<MenuPopupWidth, unknown>;

function MenuPopup({ width = "content", ...props }: MenuPopupProps) {
  const stateStyles = createStateStyleProps<BaseMenu.Popup.State>((state) => [
    menuStyles.popup,
    popupWidthStyles[width],
    (state.transitionStatus === "starting" || state.transitionStatus === "ending") &&
      menuStyles.popupTransition,
  ]);
  return <BaseMenu.Popup {...props} {...stateStyles} data-slot="menu-popup" />;
}

function MenuContent({
  align = "start",
  keepMounted = false,
  side,
  ...props
}: MenuContentProps) {
  return (
    <MenuPortal keepMounted={keepMounted}>
      <MenuPositioner align={align} side={side}>
        <MenuPopup {...props} />
      </MenuPositioner>
    </MenuPortal>
  );
}

function MenuItem({
  variant = "default",
  disabled = false,
  closeOnClick = true,
  ...props
}: MenuItemProps) {
  const stateStyles = createStateStyleProps<BaseMenu.Item.State>((state) => [
    menuStyles.item,
    variant === "danger" && menuStyles.itemDanger,
    state.highlighted === true && menuStyles.itemHighlighted,
    variant === "danger" && state.highlighted === true && menuStyles.itemDangerHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseMenu.Item
      {...props}
      disabled={disabled}
      closeOnClick={closeOnClick}
      {...stateStyles}
      data-variant={variant}
    />
  );
}

function MenuLinkItem({ closeOnClick = true, ...props }: MenuLinkItemProps) {
  const stateStyles = createStateStyleProps<BaseMenu.LinkItem.State>((state) => [
    menuStyles.item,
    state.highlighted === true && menuStyles.itemHighlighted,
  ]);
  return <BaseMenu.LinkItem {...props} closeOnClick={closeOnClick} {...stateStyles} />;
}

function MenuSeparator(props: MenuSeparatorProps) {
  const styles = stylex.props(menuStyles.separator);
  return <BaseMenu.Separator {...props} {...styles} />;
}

function MenuGroup(props: MenuGroupProps) {
  return <BaseMenu.Group {...props} data-slot="menu-group" />;
}

function MenuGroupLabel(props: MenuGroupLabelProps) {
  const styles = stylex.props(menuStyles.groupLabel);
  return <BaseMenu.GroupLabel {...props} {...styles} data-slot="menu-group-label" />;
}

function MenuShortcut({ render, ...props }: MenuShortcutProps) {
  const styles = stylex.props(menuStyles.shortcut);
  const defaultProps = {
    ...styles,
    "data-slot": "menu-shortcut",
  } as useRender.ComponentProps<"span">;

  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, props),
  });
}

function MenuCheckboxItem({
  disabled = false,
  closeOnClick = false,
  ...props
}: MenuCheckboxItemProps) {
  const stateStyles = createStateStyleProps<BaseMenu.CheckboxItem.State>((state) => [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseMenu.CheckboxItem
      {...props}
      disabled={disabled}
      closeOnClick={closeOnClick}
      {...stateStyles}
    />
  );
}

function MenuCheckboxItemIndicator({
  keepMounted = false,
  ...props
}: MenuCheckboxItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseMenu.CheckboxItemIndicator.State>(() => [
    menuStyles.indicator,
  ]);
  const iconStyles = stylex.props(menuStyles.icon);
  return (
    <BaseMenu.CheckboxItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        {...iconStyles}
      >
        <path d="m3 8 3 3 7-7" />
      </svg>
    </BaseMenu.CheckboxItemIndicator>
  );
}

function MenuRadioGroup({ disabled = false, ...props }: MenuRadioGroupProps) {
  return <BaseMenu.RadioGroup {...props} disabled={disabled} />;
}

function MenuRadioItem({ disabled = false, closeOnClick = false, ...props }: MenuRadioItemProps) {
  const stateStyles = createStateStyleProps<BaseMenu.RadioItem.State>((state) => [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseMenu.RadioItem
      {...props}
      disabled={disabled}
      closeOnClick={closeOnClick}
      {...stateStyles}
    />
  );
}

function MenuRadioItemIndicator({ keepMounted = false, ...props }: MenuRadioItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseMenu.RadioItemIndicator.State>(() => [
    menuStyles.indicator,
  ]);
  const iconStyles = stylex.props(menuStyles.icon);
  return (
    <BaseMenu.RadioItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
        <circle cx="8" cy="8" r="3" />
      </svg>
    </BaseMenu.RadioItemIndicator>
  );
}

function MenuSubmenuRoot({ defaultOpen = false, ...props }: MenuSubmenuRootProps) {
  return <BaseMenu.SubmenuRoot {...props} defaultOpen={defaultOpen} />;
}

function MenuSubmenuTrigger({ disabled = false, children, ...props }: MenuSubmenuTriggerProps) {
  const stateStyles = createStateStyleProps<BaseMenu.SubmenuTrigger.State>((state) => [
    menuStyles.item,
    state.open === true && menuStyles.itemOpen,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  const iconStyles = stylex.props(menuStyles.submenuIcon);
  return (
    <BaseMenu.SubmenuTrigger {...props} disabled={disabled} {...stateStyles}>
      {children}
      <MenuSuffix>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...iconStyles}>
          <path d="m6 3 5 5-5 5z" />
        </svg>
      </MenuSuffix>
    </BaseMenu.SubmenuTrigger>
  );
}

function MenuPrefix({ "aria-hidden": ariaHidden = true, ...props }: MenuPresentationProps) {
  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      {...stylex.props(menuStyles.prefix)}
      data-slot="menu-prefix"
    />
  );
}

function MenuSuffix({ "aria-hidden": ariaHidden = true, ...props }: MenuPresentationProps) {
  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      {...stylex.props(menuStyles.suffix)}
      data-slot="menu-suffix"
    />
  );
}

export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Positioner: MenuPositioner,
  Popup: MenuPopup,
  Content: MenuContent,
  Item: MenuItem,
  LinkItem: MenuLinkItem,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Shortcut: MenuShortcut,
  Separator: MenuSeparator,
  CheckboxItem: MenuCheckboxItem,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  RadioItemIndicator: MenuRadioItemIndicator,
  SubmenuRoot: MenuSubmenuRoot,
  SubmenuTrigger: MenuSubmenuTrigger,
  Prefix: MenuPrefix,
  Suffix: MenuSuffix,
});
