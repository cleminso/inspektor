import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import { type ComponentRef, forwardRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { menuStyles } from "../menu/menu.styles";
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
} from "../menu/menuPresentation";
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
  /** Composes context-menu behavior onto another element. Context menus must supplement visible actions. */
  render?: BaseContextMenu.Trigger.Props["render"];
}
export type ContextMenuPortalProps = WithoutStyles<BaseContextMenu.Portal.Props>;

export type ContextMenuPositionerProps = Pick<
  WithoutStyles<BaseContextMenu.Positioner.Props>,
  "align" | "children" | "ref" | "side"
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
  /** Composes item behavior onto another compatible element. */
  render?: BaseContextMenu.Item.Props["render"];
}

export interface ContextMenuLinkItemProps extends WithoutStyles<BaseContextMenu.LinkItem.Props> {
  /** Controls whether activating the link closes the menu. */
  closeOnClick?: boolean;
  /** Composes link-item behavior onto another link component. */
  render?: BaseContextMenu.LinkItem.Props["render"];
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
  /** Composes checkbox-item behavior onto another compatible element. */
  render?: BaseContextMenu.CheckboxItem.Props["render"];
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
  /** Composes radio-item behavior onto another compatible element. */
  render?: BaseContextMenu.RadioItem.Props["render"];
}

export type ContextMenuRadioItemIndicatorProps = Omit<
  WithoutStyles<BaseContextMenu.RadioItemIndicator.Props>,
  "children"
>;
export type ContextMenuSubmenuRootProps = WithoutStyles<BaseContextMenu.SubmenuRoot.Props>;
export interface ContextMenuSubmenuTriggerProps extends WithoutStyles<BaseContextMenu.SubmenuTrigger.Props> {
  /** Composes submenu-trigger behavior onto another compatible element. */
  render?: BaseContextMenu.SubmenuTrigger.Props["render"];
}

function ContextMenuRoot({
  defaultOpen = false,
  disabled = false,
  ...props
}: ContextMenuRootProps) {
  return <BaseContextMenu.Root {...props} defaultOpen={defaultOpen} disabled={disabled} />;
}

const ContextMenuTrigger = forwardRef<
  ComponentRef<typeof BaseContextMenu.Trigger>,
  ContextMenuTriggerProps
>(function ContextMenuTrigger({ render, ...props }, forwardedRef) {
  const usesDefaultElement = render === undefined;
  const stateStyles = createStateStyleProps<BaseContextMenu.Trigger.State>((state) => [
    usesDefaultElement === true && contextMenuStyles.trigger,
    state.open === true && contextMenuStyles.triggerOpen,
    state.open === true && contextMenuStyles.triggerPressed,
  ]);
  return (
    <BaseContextMenu.Trigger
      {...props}
      ref={forwardedRef}
      render={render}
      {...stateStyles}
      data-slot={usesDefaultElement === true ? "context-menu-trigger" : undefined}
    />
  );
});

const ContextMenuPortal = forwardRef<
  ComponentRef<typeof BaseContextMenu.Portal>,
  ContextMenuPortalProps
>(function ContextMenuPortal({ keepMounted = false, ...props }, forwardedRef) {
  return <BaseContextMenu.Portal {...props} ref={forwardedRef} keepMounted={keepMounted} />;
});

const ContextMenuPositioner = forwardRef<
  ComponentRef<typeof BaseContextMenu.Positioner>,
  ContextMenuPositionerProps
>(function ContextMenuPositioner({ align = "start", side = "bottom", ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Positioner.State>(getMenuPositionerStyles);
  return (
    <BaseContextMenu.Positioner
      {...props}
      ref={forwardedRef}
      align={align}
      side={side}
      sideOffset={popupPositioning.dropdownSideOffset}
      {...stateStyles}
    />
  );
});

const ContextMenuPopup = forwardRef<
  ComponentRef<typeof BaseContextMenu.Popup>,
  ContextMenuPopupProps
>(function ContextMenuPopup(props, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Popup.State>((state) => [
    ...getMenuPopupStyles(state),
    menuStyles.popupWidthContent,
  ]);
  return (
    <BaseContextMenu.Popup
      {...props}
      ref={forwardedRef}
      {...stateStyles}
      data-scrollbar="standard"
      data-slot="context-menu-popup"
    />
  );
});

const ContextMenuContent = forwardRef<
  ComponentRef<typeof BaseContextMenu.Popup>,
  ContextMenuContentProps
>(function ContextMenuContent(
  { align = "start", keepMounted = false, side, ...props },
  forwardedRef,
) {
  return (
    <ContextMenuPortal keepMounted={keepMounted}>
      <ContextMenuPositioner align={align} side={side}>
        <ContextMenuPopup {...props} ref={forwardedRef} />
      </ContextMenuPositioner>
    </ContextMenuPortal>
  );
});

const ContextMenuItem = forwardRef<ComponentRef<typeof BaseContextMenu.Item>, ContextMenuItemProps>(
  function ContextMenuItem(
    { closeOnClick = true, disabled = false, variant = "default", ...props },
    forwardedRef,
  ) {
    const stateStyles = createStateStyleProps<BaseContextMenu.Item.State>((state) =>
      getMenuItemStyles(state, variant),
    );
    return (
      <BaseContextMenu.Item
        {...props}
        ref={forwardedRef}
        closeOnClick={closeOnClick}
        disabled={disabled}
        {...stateStyles}
        data-variant={variant}
      />
    );
  },
);

const ContextMenuLinkItem = forwardRef<
  ComponentRef<typeof BaseContextMenu.LinkItem>,
  ContextMenuLinkItemProps
>(function ContextMenuLinkItem({ closeOnClick = true, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.LinkItem.State>(getMenuLinkItemStyles);
  return (
    <BaseContextMenu.LinkItem
      {...props}
      ref={forwardedRef}
      closeOnClick={closeOnClick}
      {...stateStyles}
    />
  );
});

const ContextMenuGroup = forwardRef<
  ComponentRef<typeof BaseContextMenu.Group>,
  ContextMenuGroupProps
>(function ContextMenuGroup(props, forwardedRef) {
  return <BaseContextMenu.Group {...props} ref={forwardedRef} data-slot="context-menu-group" />;
});

const ContextMenuGroupLabel = forwardRef<
  ComponentRef<typeof BaseContextMenu.GroupLabel>,
  ContextMenuGroupLabelProps
>(function ContextMenuGroupLabel(props, forwardedRef) {
  return (
    <BaseContextMenu.GroupLabel
      {...props}
      ref={forwardedRef}
      {...stylex.props(menuStyles.groupLabel)}
    />
  );
});

const ContextMenuSeparator = forwardRef<
  ComponentRef<typeof BaseContextMenu.Separator>,
  ContextMenuSeparatorProps
>(function ContextMenuSeparator(props, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.Separator.State>(getMenuSeparatorStyles);
  return <BaseContextMenu.Separator {...props} ref={forwardedRef} {...stateStyles} />;
});

const ContextMenuShortcut = forwardRef<HTMLSpanElement, ContextMenuShortcutProps>(
  function ContextMenuShortcut(props, forwardedRef) {
    return (
      <span
        {...props}
        ref={forwardedRef}
        {...stylex.props(menuStyles.shortcut)}
        data-slot="context-menu-shortcut"
      />
    );
  },
);

const ContextMenuCheckboxItem = forwardRef<
  ComponentRef<typeof BaseContextMenu.CheckboxItem>,
  ContextMenuCheckboxItemProps
>(function ContextMenuCheckboxItem(
  { closeOnClick = false, disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseContextMenu.CheckboxItem.State>(
    getMenuCheckboxItemStyles,
  );
  return (
    <BaseContextMenu.CheckboxItem
      {...props}
      ref={forwardedRef}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...stateStyles}
    />
  );
});

const ContextMenuCheckboxItemIndicator = forwardRef<
  ComponentRef<typeof BaseContextMenu.CheckboxItemIndicator>,
  ContextMenuCheckboxItemIndicatorProps
>(function ContextMenuCheckboxItemIndicator({ keepMounted = false, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.CheckboxItemIndicator.State>(
    getMenuCheckboxIndicatorStyles,
  );
  return (
    <BaseContextMenu.CheckboxItemIndicator
      {...props}
      ref={forwardedRef}
      keepMounted={keepMounted}
      {...stateStyles}
    >
      <MenuCheckIcon />
    </BaseContextMenu.CheckboxItemIndicator>
  );
});

const ContextMenuRadioGroup = forwardRef<
  ComponentRef<typeof BaseContextMenu.RadioGroup>,
  ContextMenuRadioGroupProps
>(function ContextMenuRadioGroup({ disabled = false, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.RadioGroup.State>(getMenuRadioGroupStyles);
  return <BaseContextMenu.RadioGroup {...props} ref={forwardedRef} disabled={disabled} {...stateStyles} />;
});

const ContextMenuRadioItem = forwardRef<
  ComponentRef<typeof BaseContextMenu.RadioItem>,
  ContextMenuRadioItemProps
>(function ContextMenuRadioItem(
  { closeOnClick = false, disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseContextMenu.RadioItem.State>(getMenuRadioItemStyles);
  return (
    <BaseContextMenu.RadioItem
      {...props}
      ref={forwardedRef}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...stateStyles}
    />
  );
});

const ContextMenuRadioItemIndicator = forwardRef<
  ComponentRef<typeof BaseContextMenu.RadioItemIndicator>,
  ContextMenuRadioItemIndicatorProps
>(function ContextMenuRadioItemIndicator({ keepMounted = false, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.RadioItemIndicator.State>(
    getMenuRadioIndicatorStyles,
  );
  return (
    <BaseContextMenu.RadioItemIndicator
      {...props}
      ref={forwardedRef}
      keepMounted={keepMounted}
      {...stateStyles}
    >
      <MenuRadioIcon />
    </BaseContextMenu.RadioItemIndicator>
  );
});

function ContextMenuSubmenuRoot({ defaultOpen = false, ...props }: ContextMenuSubmenuRootProps) {
  return <BaseContextMenu.SubmenuRoot {...props} defaultOpen={defaultOpen} />;
}

const ContextMenuSubmenuTrigger = forwardRef<
  ComponentRef<typeof BaseContextMenu.SubmenuTrigger>,
  ContextMenuSubmenuTriggerProps
>(function ContextMenuSubmenuTrigger({ disabled = false, children, ...props }, forwardedRef) {
  const stateStyles = createStateStyleProps<BaseContextMenu.SubmenuTrigger.State>(
    getMenuSubmenuTriggerStyles,
  );
  return (
    <BaseContextMenu.SubmenuTrigger
      {...props}
      ref={forwardedRef}
      disabled={disabled}
      {...stateStyles}
    >
      {children}
      <ContextMenuSuffix>
        <MenuSubmenuIcon />
      </ContextMenuSuffix>
    </BaseContextMenu.SubmenuTrigger>
  );
});

const ContextMenuPrefix = forwardRef<HTMLSpanElement, ContextMenuPresentationProps>(
  function ContextMenuPrefix({ "aria-hidden": ariaHidden = true, ...props }, forwardedRef) {
    return (
      <span
        {...props}
        ref={forwardedRef}
        aria-hidden={ariaHidden}
        {...stylex.props(menuStyles.prefix)}
        data-slot="context-menu-prefix"
      />
    );
  },
);

const ContextMenuSuffix = forwardRef<HTMLSpanElement, ContextMenuPresentationProps>(
  function ContextMenuSuffix({ "aria-hidden": ariaHidden = true, ...props }, forwardedRef) {
    return (
      <span
        {...props}
        ref={forwardedRef}
        aria-hidden={ariaHidden}
        {...stylex.props(menuStyles.suffix)}
        data-slot="context-menu-suffix"
      />
    );
  },
);

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
