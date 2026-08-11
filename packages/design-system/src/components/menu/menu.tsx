import { Menu as BaseMenu } from "@base-ui/react/menu";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import { forwardRef, useContext, type ComponentRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { InputGroupContext } from "../inputGroup/inputGroupContext";
import { menuStyles } from "./menu.styles";
import {
  getMenuCheckboxIndicatorStyles,
  getMenuCheckboxItemStyles,
  getMenuItemStyles,
  getMenuLinkItemStyles,
  getMenuPopupStyles,
  getMenuPositionerStyles,
  getMenuRadioGroupStyles,
  getMenuRadioIndicatorStyles,
  getMenuRadioItemStyles,
  getMenuSeparatorStyles,
  getMenuSubmenuTriggerStyles,
  MenuCheckIcon,
  MenuRadioIcon,
  MenuSubmenuIcon,
} from "./menuPresentation";

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
  /** Composes trigger behavior onto a design-system control that owns its presentation. */
  render?: BaseMenu.Trigger.Props["render"];
}

export interface MenuPortalProps extends WithoutStyles<BaseMenu.Portal.Props> {
  /** Keeps the portal mounted while the menu is closed. */
  keepMounted?: boolean;
}

export type MenuPositionerProps = Pick<
  WithoutStyles<BaseMenu.Positioner.Props>,
  "align" | "children" | "ref" | "side"
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

export interface MenuItemProps extends Omit<WithoutStyles<BaseMenu.Item.Props>, "nativeButton"> {
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

export interface MenuShortcutProps extends Omit<useRender.ComponentProps<"span">, "className" | "style"> {
  /** Composes the shortcut label onto another element. */
  render?: useRender.ComponentProps<"span">["render"];
}

export interface MenuCheckboxItemProps extends Omit<WithoutStyles<BaseMenu.CheckboxItem.Props>, "nativeButton"> {
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

export interface MenuRadioItemProps extends Omit<WithoutStyles<BaseMenu.RadioItem.Props>, "nativeButton"> {
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
  /** Composes submenu trigger behavior onto another interactive element. */
  render?: BaseMenu.SubmenuTrigger.Props["render"];
}

export type MenuPresentationProps = Omit<useRender.ComponentProps<"span">, "className" | "style" | "render">;

function MenuRoot({ defaultOpen = false, disabled = false, ...props }: MenuRootProps) {
  return <BaseMenu.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

const MenuTrigger = forwardRef<ComponentRef<typeof BaseMenu.Trigger>, MenuTriggerProps>(function MenuTrigger(
  { disabled = false, render, ...props },
  ref,
) {
  const inputGroup = useContext(InputGroupContext);
  const effectiveDisabled = disabled === true || inputGroup?.disabled === true;
  const isComposed = render !== undefined;
  const stateStyles = createStateStyleProps<BaseMenu.Trigger.State>((state) => [
    isComposed === false && menuStyles.trigger,
    isComposed === false && inputGroup !== null && menuStyles.triggerGrouped,
    isComposed === false && state.open === true && menuStyles.triggerOpen,
    isComposed === false && state.open === true && menuStyles.triggerPressed,
    isComposed === false && state.disabled === true && menuStyles.disabled,
    isComposed === false && state.disabled === true && menuStyles.triggerDisabled,
  ]);
  return (
    <BaseMenu.Trigger
      {...props}
      ref={ref as BaseMenu.Trigger.Props["ref"]}
      disabled={effectiveDisabled}
      render={render}
      {...stateStyles}
      data-slot="menu-trigger"
      data-grouped={inputGroup === null ? undefined : ""}
    />
  );
});

const MenuPortal = forwardRef<HTMLDivElement, MenuPortalProps>(function MenuPortal(
  { keepMounted = false, ...props },
  ref,
) {
  return <BaseMenu.Portal {...props} ref={ref} keepMounted={keepMounted} />;
});

const MenuPositioner = forwardRef<HTMLDivElement, MenuPositionerProps>(function MenuPositioner(
  { align = "start", side = "bottom", ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.Positioner.State>(getMenuPositionerStyles);
  return (
    <BaseMenu.Positioner
      {...props}
      ref={ref}
      sideOffset={popupPositioning.dropdownSideOffset}
      align={align}
      side={side}
      {...stateStyles}
    />
  );
});

const popupWidthStyles = {
  content: menuStyles.popupWidthContent,
  anchor: menuStyles.popupWidthAnchor,
} satisfies Record<MenuPopupWidth, unknown>;

const MenuPopup = forwardRef<HTMLDivElement, MenuPopupProps>(function MenuPopup({ width = "content", ...props }, ref) {
  const stateStyles = createStateStyleProps<BaseMenu.Popup.State>((state) => [
    ...getMenuPopupStyles(state),
    popupWidthStyles[width],
  ]);
  return (
    <BaseMenu.Popup
      {...props}
      ref={ref}
      {...stateStyles}
      data-scrollbar="standard"
      data-slot="menu-popup"
    />
  );
});

const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  { align = "start", keepMounted = false, side, ...props },
  ref,
) {
  return (
    <MenuPortal keepMounted={keepMounted}>
      <MenuPositioner align={align} side={side}>
        <MenuPopup {...props} ref={ref} />
      </MenuPositioner>
    </MenuPortal>
  );
});

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { variant = "default", disabled = false, closeOnClick = true, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.Item.State>((state) =>
    getMenuItemStyles(state, variant),
  );
  return (
    <BaseMenu.Item
      {...props}
      ref={ref}
      disabled={disabled}
      closeOnClick={closeOnClick}
      {...stateStyles}
      data-variant={variant}
    />
  );
});

const MenuLinkItem = forwardRef<HTMLAnchorElement, MenuLinkItemProps>(function MenuLinkItem(
  { closeOnClick = true, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.LinkItem.State>(getMenuLinkItemStyles);
  return <BaseMenu.LinkItem {...props} ref={ref} closeOnClick={closeOnClick} {...stateStyles} />;
});

const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(props, ref) {
  const stateStyles = createStateStyleProps<BaseMenu.Separator.State>(getMenuSeparatorStyles);
  return <BaseMenu.Separator {...props} ref={ref} {...stateStyles} />;
});

const MenuGroup = forwardRef<ComponentRef<typeof BaseMenu.Group>, MenuGroupProps>(function MenuGroup(props, ref) {
  return <BaseMenu.Group {...props} ref={ref} data-slot="menu-group" />;
});

const MenuGroupLabel = forwardRef<ComponentRef<typeof BaseMenu.GroupLabel>, MenuGroupLabelProps>(function MenuGroupLabel(props, ref) {
  const styles = stylex.props(menuStyles.groupLabel);
  return <BaseMenu.GroupLabel {...props} ref={ref} {...styles} data-slot="menu-group-label" />;
});

const MenuShortcut = forwardRef<HTMLElement, MenuShortcutProps>(function MenuShortcut({ render, ...props }, ref) {
  const styles = stylex.props(menuStyles.shortcut);
  const defaultProps = {
    ...styles,
    "data-slot": "menu-shortcut",
  } as useRender.ComponentProps<"span">;

  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, props),
    ref,
  });
});

const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  { disabled = false, closeOnClick = false, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.CheckboxItem.State>(getMenuCheckboxItemStyles);
  return (
    <BaseMenu.CheckboxItem {...props} ref={ref} disabled={disabled} closeOnClick={closeOnClick} {...stateStyles} />
  );
});

const MenuCheckboxItemIndicator = forwardRef<HTMLSpanElement, MenuCheckboxItemIndicatorProps>(
  function MenuCheckboxItemIndicator({ keepMounted = false, ...props }, ref) {
    const stateStyles = createStateStyleProps<BaseMenu.CheckboxItemIndicator.State>(
      getMenuCheckboxIndicatorStyles,
    );
    return (
      <BaseMenu.CheckboxItemIndicator {...props} ref={ref} keepMounted={keepMounted} {...stateStyles}>
        <MenuCheckIcon />
      </BaseMenu.CheckboxItemIndicator>
    );
  },
);

const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(function MenuRadioGroup(
  { disabled = false, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.RadioGroup.State>(getMenuRadioGroupStyles);
  return <BaseMenu.RadioGroup {...props} ref={ref} disabled={disabled} {...stateStyles} />;
});

const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  { disabled = false, closeOnClick = false, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.RadioItem.State>(getMenuRadioItemStyles);
  return <BaseMenu.RadioItem {...props} ref={ref} disabled={disabled} closeOnClick={closeOnClick} {...stateStyles} />;
});

const MenuRadioItemIndicator = forwardRef<HTMLSpanElement, MenuRadioItemIndicatorProps>(function MenuRadioItemIndicator(
  { keepMounted = false, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.RadioItemIndicator.State>(
    getMenuRadioIndicatorStyles,
  );
  return (
    <BaseMenu.RadioItemIndicator {...props} ref={ref} keepMounted={keepMounted} {...stateStyles}>
      <MenuRadioIcon />
    </BaseMenu.RadioItemIndicator>
  );
});

function MenuSubmenuRoot({ defaultOpen = false, ...props }: MenuSubmenuRootProps) {
  return <BaseMenu.SubmenuRoot {...props} defaultOpen={defaultOpen} />;
}

const MenuSubmenuTrigger = forwardRef<HTMLElement, MenuSubmenuTriggerProps>(function MenuSubmenuTrigger(
  { disabled = false, children, ...props },
  ref,
) {
  const stateStyles = createStateStyleProps<BaseMenu.SubmenuTrigger.State>(getMenuSubmenuTriggerStyles);
  return (
    <BaseMenu.SubmenuTrigger {...props} ref={ref} disabled={disabled} {...stateStyles}>
      {children}
      <MenuSuffix>
        <MenuSubmenuIcon />
      </MenuSuffix>
    </BaseMenu.SubmenuTrigger>
  );
});

const MenuPrefix = forwardRef<HTMLSpanElement, MenuPresentationProps>(function MenuPrefix(
  { "aria-hidden": ariaHidden = true, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} aria-hidden={ariaHidden} {...stylex.props(menuStyles.prefix)} data-slot="menu-prefix" />
  );
});

const MenuSuffix = forwardRef<HTMLSpanElement, MenuPresentationProps>(function MenuSuffix(
  { "aria-hidden": ariaHidden = true, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} aria-hidden={ariaHidden} {...stylex.props(menuStyles.suffix)} data-slot="menu-suffix" />
  );
});

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
