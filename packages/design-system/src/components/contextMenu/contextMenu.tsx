import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { menuStyles } from "../menu/menu.styles";
import { contextMenuStyles } from "./contextMenu.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style" | "render">;

export type ContextMenuItemVariant = "default" | "danger";

export interface ContextMenuRootProps extends WithoutStyles<BaseContextMenu.Root.Props> {
  /** Whether the context menu is initially open. */
  defaultOpen?: boolean;
  /** Disables interaction with the context menu. */
  disabled?: boolean;
  /** Runs when the context menu opens or closes. */
  onOpenChange?: BaseContextMenu.Root.Props["onOpenChange"];
  /** Whether the context menu is currently open. */
  open?: boolean;
}

export interface ContextMenuTriggerProps extends WithoutStyles<BaseContextMenu.Trigger.Props> {
  /** Composes context-menu behavior onto another element. */
  render?: BaseContextMenu.Trigger.Props["render"];
}
export type ContextMenuPortalProps = WithoutStyles<BaseContextMenu.Portal.Props>;

export type ContextMenuPositionerProps = Pick<
  WithoutStyles<BaseContextMenu.Positioner.Props>,
  "align" | "children" | "side"
>;

export type ContextMenuPopupProps = WithoutStyles<BaseContextMenu.Popup.Props>;

export interface ContextMenuContentProps extends ContextMenuPopupProps {
  /** Aligns the popup along its pointer anchor. */
  align?: ContextMenuPositionerProps["align"];
  /** Keeps the content mounted while closed. */
  keepMounted?: boolean;
  /** Places the popup on a side of its pointer anchor. */
  side?: ContextMenuPositionerProps["side"];
}

export interface ContextMenuItemProps extends WithoutStyles<BaseContextMenu.Item.Props> {
  /** Controls whether activating the item closes the menu. */
  closeOnClick?: boolean;
  /** Disables the action. */
  disabled?: boolean;
  /** Controls the action's semantic emphasis. */
  variant?: ContextMenuItemVariant;
}

export interface ContextMenuLinkItemProps extends WithoutStyles<BaseContextMenu.LinkItem.Props> {
  /** Controls whether activating the link closes the menu. */
  closeOnClick?: boolean;
}

export type ContextMenuGroupProps = WithoutStyles<BaseContextMenu.Group.Props>;
export type ContextMenuGroupLabelProps = WithoutStyles<BaseContextMenu.GroupLabel.Props>;
export type ContextMenuSeparatorProps = WithoutStyles<BaseContextMenu.Separator.Props>;
export type ContextMenuShortcutProps = Omit<
  useRender.ComponentProps<"span">,
  "className" | "style" | "render"
>;
export type ContextMenuPresentationProps = ContextMenuShortcutProps;

export interface ContextMenuCheckboxItemProps extends WithoutStyles<BaseContextMenu.CheckboxItem.Props> {
  /** Controls whether changing the option closes the menu. */
  closeOnClick?: boolean;
  /** Disables the option. */
  disabled?: boolean;
}

export type ContextMenuCheckboxItemIndicatorProps = Omit<
  WithoutStyles<BaseContextMenu.CheckboxItemIndicator.Props>,
  "children"
>;
export type ContextMenuRadioGroupProps = WithoutStyles<BaseContextMenu.RadioGroup.Props>;

export interface ContextMenuRadioItemProps extends WithoutStyles<BaseContextMenu.RadioItem.Props> {
  /** Controls whether changing the option closes the menu. */
  closeOnClick?: boolean;
  /** Disables the option. */
  disabled?: boolean;
  /** Value represented by the option. */
  value: BaseContextMenu.RadioItem.Props["value"];
}

export type ContextMenuRadioItemIndicatorProps = Omit<
  WithoutStyles<BaseContextMenu.RadioItemIndicator.Props>,
  "children"
>;
export type ContextMenuSubmenuRootProps = WithoutStyles<BaseContextMenu.SubmenuRoot.Props>;
export type ContextMenuSubmenuTriggerProps = WithoutStyles<BaseContextMenu.SubmenuTrigger.Props>;

function ContextMenuRoot({
  defaultOpen = false,
  disabled = false,
  ...props
}: ContextMenuRootProps) {
  return <BaseContextMenu.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

function ContextMenuTrigger({ render, ...props }: ContextMenuTriggerProps) {
  const usesDefaultElement = render === undefined;
  const stateStyles = createStateStyleProps<BaseContextMenu.Trigger.State>(() => [
    usesDefaultElement === true && contextMenuStyles.trigger,
  ]);
  return (
    <BaseContextMenu.Trigger
      {...props}
      render={render}
      {...stateStyles}
      data-slot={usesDefaultElement === true ? "context-menu-trigger" : undefined}
    />
  );
}

function ContextMenuPortal({ keepMounted = false, ...props }: ContextMenuPortalProps) {
  return <BaseContextMenu.Portal {...props} keepMounted={keepMounted} />;
}

function ContextMenuPositioner({
  align = "start",
  ...props
}: ContextMenuPositionerProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Positioner.State>(() => [
    menuStyles.positioner,
  ]);
  return (
    <BaseContextMenu.Positioner
      {...props}
      align={align}
      sideOffset={popupPositioning.dropdownSideOffset}
      {...stateStyles}
    />
  );
}

function ContextMenuPopup(props: ContextMenuPopupProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Popup.State>((state) => [
    menuStyles.popup,
    menuStyles.popupWidthContent,
    (state.transitionStatus === "starting" || state.transitionStatus === "ending") &&
      menuStyles.popupTransition,
  ]);
  return <BaseContextMenu.Popup {...props} {...stateStyles} data-slot="context-menu-popup" />;
}

function ContextMenuContent({
  align = "start",
  keepMounted = false,
  side,
  ...props
}: ContextMenuContentProps) {
  return (
    <ContextMenuPortal keepMounted={keepMounted}>
      <ContextMenuPositioner align={align} side={side}>
        <ContextMenuPopup {...props} />
      </ContextMenuPositioner>
    </ContextMenuPortal>
  );
}

function ContextMenuItem({
  closeOnClick = true,
  disabled = false,
  variant = "default",
  ...props
}: ContextMenuItemProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Item.State>((state) => [
    menuStyles.item,
    variant === "danger" && menuStyles.itemDanger,
    state.highlighted === true && menuStyles.itemHighlighted,
    variant === "danger" && state.highlighted === true && menuStyles.itemDangerHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseContextMenu.Item
      {...props}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...stateStyles}
      data-variant={variant}
    />
  );
}

function ContextMenuLinkItem({ closeOnClick = true, ...props }: ContextMenuLinkItemProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.LinkItem.State>((state) => [
    menuStyles.item,
    state.highlighted === true && menuStyles.itemHighlighted,
  ]);
  return <BaseContextMenu.LinkItem {...props} closeOnClick={closeOnClick} {...stateStyles} />;
}

function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <BaseContextMenu.Group {...props} data-slot="context-menu-group" />;
}

function ContextMenuGroupLabel(props: ContextMenuGroupLabelProps) {
  return (
    <BaseContextMenu.GroupLabel
      {...props}
      {...stylex.props(menuStyles.groupLabel)}
    />
  );
}

function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  return (
    <BaseContextMenu.Separator
      {...props}
      {...stylex.props(menuStyles.separator)}
    />
  );
}

function ContextMenuShortcut(props: ContextMenuShortcutProps) {
  return (
    <span
      {...props}
      {...stylex.props(menuStyles.shortcut)}
      data-slot="context-menu-shortcut"
    />
  );
}

function ContextMenuCheckboxItem({
  closeOnClick = false,
  disabled = false,
  ...props
}: ContextMenuCheckboxItemProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.CheckboxItem.State>((state) => [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseContextMenu.CheckboxItem
      {...props}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...stateStyles}
    />
  );
}

function ContextMenuCheckboxItemIndicator({
  keepMounted = false,
  ...props
}: ContextMenuCheckboxItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.CheckboxItemIndicator.State>(() => [
    menuStyles.indicator,
  ]);
  return (
    <BaseContextMenu.CheckboxItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        {...stylex.props(menuStyles.icon)}
      >
        <path d="m3 8 3 3 7-7" />
      </svg>
    </BaseContextMenu.CheckboxItemIndicator>
  );
}

function ContextMenuRadioGroup({ disabled = false, ...props }: ContextMenuRadioGroupProps) {
  return <BaseContextMenu.RadioGroup {...props} disabled={disabled} />;
}

function ContextMenuRadioItem({
  closeOnClick = false,
  disabled = false,
  ...props
}: ContextMenuRadioItemProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.RadioItem.State>((state) => [
    menuStyles.item,
    menuStyles.choiceItem,
    state.checked === true && menuStyles.itemSelected,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseContextMenu.RadioItem
      {...props}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...stateStyles}
    />
  );
}

function ContextMenuRadioItemIndicator({
  keepMounted = false,
  ...props
}: ContextMenuRadioItemIndicatorProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.RadioItemIndicator.State>(() => [
    menuStyles.indicator,
  ]);
  return (
    <BaseContextMenu.RadioItemIndicator {...props} keepMounted={keepMounted} {...stateStyles}>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="currentColor"
        {...stylex.props(menuStyles.icon)}
      >
        <circle cx="8" cy="8" r="3" />
      </svg>
    </BaseContextMenu.RadioItemIndicator>
  );
}

function ContextMenuSubmenuRoot({ defaultOpen = false, ...props }: ContextMenuSubmenuRootProps) {
  return <BaseContextMenu.SubmenuRoot {...props} defaultOpen={defaultOpen} />;
}

function ContextMenuSubmenuTrigger({
  disabled = false,
  children,
  ...props
}: ContextMenuSubmenuTriggerProps) {
  const stateStyles = createStateStyleProps<BaseContextMenu.SubmenuTrigger.State>((state) => [
    menuStyles.item,
    state.open === true && menuStyles.itemOpen,
    state.highlighted === true && menuStyles.itemHighlighted,
    state.disabled === true && menuStyles.itemDisabled,
  ]);
  return (
    <BaseContextMenu.SubmenuTrigger {...props} disabled={disabled} {...stateStyles}>
      {children}
      <ContextMenuSuffix>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="currentColor"
          {...stylex.props(menuStyles.submenuIcon)}
        >
          <path d="m6 3 5 5-5 5z" />
        </svg>
      </ContextMenuSuffix>
    </BaseContextMenu.SubmenuTrigger>
  );
}

function ContextMenuPrefix({
  "aria-hidden": ariaHidden = true,
  ...props
}: ContextMenuPresentationProps) {
  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      {...stylex.props(menuStyles.prefix)}
      data-slot="context-menu-prefix"
    />
  );
}

function ContextMenuSuffix({
  "aria-hidden": ariaHidden = true,
  ...props
}: ContextMenuPresentationProps) {
  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      {...stylex.props(menuStyles.suffix)}
      data-slot="context-menu-suffix"
    />
  );
}

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Portal: ContextMenuPortal,
  Positioner: ContextMenuPositioner,
  Popup: ContextMenuPopup,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  LinkItem: ContextMenuLinkItem,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuGroupLabel,
  Separator: ContextMenuSeparator,
  Shortcut: ContextMenuShortcut,
  CheckboxItem: ContextMenuCheckboxItem,
  CheckboxItemIndicator: ContextMenuCheckboxItemIndicator,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  RadioItemIndicator: ContextMenuRadioItemIndicator,
  SubmenuRoot: ContextMenuSubmenuRoot,
  SubmenuTrigger: ContextMenuSubmenuTrigger,
  Prefix: ContextMenuPrefix,
  Suffix: ContextMenuSuffix,
});
