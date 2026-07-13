import { Menu as BaseMenu } from "@base-ui/react/menu";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { menuStyles } from "./menu.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style">;

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

export interface MenuPositionerProps extends WithoutStyles<BaseMenu.Positioner.Props> {
  /** Sets the gap between the trigger and popup. */
  sideOffset?: BaseMenu.Positioner.Props["sideOffset"];
  /** Aligns the popup along the trigger. */
  align?: BaseMenu.Positioner.Props["align"];
}

export type MenuPopupWidth = "content" | "anchor";

export interface MenuPopupProps extends Omit<WithoutStyles<BaseMenu.Popup.Props>, "width"> {
  /** Controls whether the popup follows its content or trigger width. */
  width?: MenuPopupWidth;
}

export interface MenuItemProps extends WithoutStyles<BaseMenu.Item.Props> {
  /** Controls the action's semantic emphasis. */
  variant?: MenuItemVariant;
  /** Disables the action. */
  disabled?: boolean;
  /** Controls whether activating the item closes the menu. */
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

export interface MenuShortcutProps
  extends Omit<useRender.ComponentProps<"span">, "className" | "style"> {
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
}

export interface MenuCheckboxItemIndicatorProps
  extends Omit<WithoutStyles<BaseMenu.CheckboxItemIndicator.Props>, "children"> {
  /** Keeps the indicator mounted while unchecked. */
  keepMounted?: boolean;
}

function MenuRoot({ defaultOpen = false, disabled = false, ...props }: MenuRootProps) {
  return <BaseMenu.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

function MenuTrigger({ disabled = false, ...props }: MenuTriggerProps) {
  const stateStyles = createStateStyleProps<BaseMenu.Trigger.State>((state) => [
    menuStyles.trigger,
    state.open === true && menuStyles.triggerOpen,
    state.disabled === true && menuStyles.disabled,
  ]);
  return <BaseMenu.Trigger {...props} disabled={disabled} {...stateStyles} data-slot="menu-trigger" />;
}

function MenuPortal({ keepMounted = false, ...props }: MenuPortalProps) {
  return <BaseMenu.Portal {...props} keepMounted={keepMounted} />;
}

function MenuPositioner({ sideOffset = 4, align = "start", ...props }: MenuPositionerProps) {
  const stateStyles = createStateStyleProps<BaseMenu.Positioner.State>(() => [menuStyles.positioner]);
  return <BaseMenu.Positioner {...props} sideOffset={sideOffset} align={align} {...stateStyles} />;
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

function MenuCheckboxItem({ disabled = false, ...props }: MenuCheckboxItemProps) {
  const stateStyles = createStateStyleProps<BaseMenu.CheckboxItem.State>((state) => [
    menuStyles.item,
    menuStyles.checkItem,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return <BaseMenu.CheckboxItem {...props} disabled={disabled} {...stateStyles} />;
}

function MenuCheckboxItemIndicator({ keepMounted = false, ...props }: MenuCheckboxItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseMenu.CheckboxItemIndicator.State>(() => [menuStyles.indicator]);
  const iconStyles = stylex.props(menuStyles.icon);
  return (
    <BaseMenu.CheckboxItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" {...iconStyles}>
        <path d="m3 8 3 3 7-7" />
      </svg>
    </BaseMenu.CheckboxItemIndicator>
  );
}

export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Positioner: MenuPositioner,
  Popup: MenuPopup,
  Item: MenuItem,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Shortcut: MenuShortcut,
  Separator: MenuSeparator,
  CheckboxItem: MenuCheckboxItem,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
});
