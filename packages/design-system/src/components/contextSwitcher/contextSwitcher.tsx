import * as stylex from "@stylexjs/stylex";
import { type PropsWithChildren, useState } from "react";

import {
  Combobox,
  type ComboboxContentProps,
  type ComboboxEmptyProps,
  type ComboboxItemProps,
  type ComboboxItemTextProps,
  type ComboboxListProps,
  type ComboboxPopupWidth,
  type ComboboxRootProps,
  type ComboboxStatusProps,
  type ComboboxValueProps,
  type ComboboxViewportHeight,
} from "../combobox/combobox";
import { contextSwitcherStyles } from "./contextSwitcher.styles";

export type ContextSwitcherTriggerSize = "s" | "m" | "l";
export type ContextSwitcherTriggerWidth = "content" | "s" | "m";

export type ContextSwitcherRootProps<Value> = PropsWithChildren<{
  /** Items available for filtering and context selection. */
  items: ComboboxRootProps<Value>["items"];
  /** The active context item. */
  value?: ComboboxRootProps<Value>["value"];
  /** The initially active context item. */
  defaultValue?: ComboboxRootProps<Value>["defaultValue"];
  /** Runs when the active context item changes. */
  onValueChange?: ComboboxRootProps<Value>["onValueChange"];
  /** Whether the popup is initially open. */
  defaultOpen?: ComboboxRootProps<Value>["defaultOpen"];
  /** Whether the popup is open. */
  open?: ComboboxRootProps<Value>["open"];
  /** Runs when the popup opens or closes. */
  onOpenChange?: ComboboxRootProps<Value>["onOpenChange"];
  /** Converts an item into its displayed label. */
  itemToStringLabel?: ComboboxRootProps<Value>["itemToStringLabel"];
  /** Converts an item into a stable string value. */
  itemToStringValue?: ComboboxRootProps<Value>["itemToStringValue"];
  /** Compares an item with the active context value. */
  isItemEqualToValue?: ComboboxRootProps<Value>["isItemEqualToValue"];
  /** Filters an item against the switcher query. */
  filter?: ComboboxRootProps<Value>["filter"];
  /** Disables the switcher. */
  disabled?: ComboboxRootProps<Value>["disabled"];
}>;

export type ContextSwitcherValueProps = ComboboxValueProps;

export type ContextSwitcherTriggerProps = PropsWithChildren<{
  /** Accessible label that identifies the context being switched. */
  label: string;
  /** Controls the trigger height and padding. */
  size?: ContextSwitcherTriggerSize;
  /** Constrains the trigger width. */
  width?: ContextSwitcherTriggerWidth;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Provides supplemental text for truncated trigger content. */
  title?: string;
}>;

export interface ContextSwitcherSearchProps {
  /** Accessible label for the search input. */
  label: string;
  /** Placeholder displayed while the search input is empty. */
  placeholder?: string;
}

export type ContextSwitcherContentProps = PropsWithChildren<{
  /** Controls the popup width using a design-system size. */
  width?: ComboboxPopupWidth;
  /** Keeps the popup mounted while closed. */
  keepMounted?: ComboboxContentProps["keepMounted"];
  /** Sets the gap between the trigger and popup. */
  sideOffset?: ComboboxContentProps["sideOffset"];
  /** Aligns the popup along the trigger. */
  align?: ComboboxContentProps["align"];
}>;

export type ContextSwitcherViewportProps = PropsWithChildren<{
  /** Controls the maximum height of the scrolling results region. */
  maxHeight?: ComboboxViewportHeight;
}>;

export type ContextSwitcherEmptyProps = ComboboxEmptyProps;
export type ContextSwitcherStatusProps = ComboboxStatusProps;
export type ContextSwitcherListProps = ComboboxListProps;
export type ContextSwitcherItemTextProps = ComboboxItemTextProps;
export type ContextSwitcherFooterProps = PropsWithChildren;

export type ContextSwitcherItemProps<Value> = ComboboxItemProps<Value>;

function ContextSwitcherRoot<Value>({
  defaultOpen = false,
  disabled = false,
  onOpenChange,
  ...props
}: ContextSwitcherRootProps<Value>) {
  const [inputValue, setInputValue] = useState("");

  const handleOpenChange: NonNullable<ComboboxRootProps<Value>["onOpenChange"]> = (nextOpen, details) => {
    onOpenChange?.(nextOpen, details);
  };

  const handleOpenChangeComplete: NonNullable<
    ComboboxRootProps<Value>["onOpenChangeComplete"]
  > = (nextOpen) => {
    if (nextOpen === false) {
      setInputValue("");
    }
  };

  return (
    <Combobox.Root
      {...props}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      autoHighlight
      defaultOpen={defaultOpen}
      disabled={disabled}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    />
  );
}

function ContextSwitcherTrigger({
  label,
  size = "m",
  width = "content",
  disabled = false,
  title,
  children,
}: ContextSwitcherTriggerProps) {
  const contentStyleProps = stylex.props(contextSwitcherStyles.triggerContent);

  return (
    <Combobox.Trigger
      aria-label={label}
      title={title}
      variant="ghost"
      size={size}
      width={width}
      disabled={disabled}
    >
      <span {...contentStyleProps}>{children}</span>
    </Combobox.Trigger>
  );
}

function ContextSwitcherValue(props: ContextSwitcherValueProps) {
  return <Combobox.Value {...props} />;
}

function ContextSwitcherContent({
  width = "m",
  keepMounted = false,
  sideOffset,
  align,
  children,
}: ContextSwitcherContentProps) {
  return (
    <Combobox.Content width={width} keepMounted={keepMounted} sideOffset={sideOffset} align={align}>
      {children}
    </Combobox.Content>
  );
}

function ContextSwitcherSearch({ label, placeholder }: ContextSwitcherSearchProps) {
  return (
    <>
      <Combobox.PopupHeader>
        <Combobox.InputGroup fullWidth>
          <Combobox.Input aria-label={label} placeholder={placeholder} />
        </Combobox.InputGroup>
      </Combobox.PopupHeader>
      <Combobox.Separator />
    </>
  );
}

function ContextSwitcherViewport({ maxHeight = "m", children }: ContextSwitcherViewportProps) {
  return (
    <Combobox.Viewport maxHeight={maxHeight} data-slot="context-switcher-viewport">
      {children}
    </Combobox.Viewport>
  );
}

function ContextSwitcherEmpty(props: ContextSwitcherEmptyProps) {
  return <Combobox.Empty {...props} />;
}

function ContextSwitcherStatus(props: ContextSwitcherStatusProps) {
  return <Combobox.Status {...props} />;
}

function ContextSwitcherList(props: ContextSwitcherListProps) {
  return <Combobox.List {...props} />;
}

function ContextSwitcherItem<Value>({
  indicator = "check",
  ...props
}: ContextSwitcherItemProps<Value>) {
  return <Combobox.Item {...props} indicator={indicator} />;
}

function ContextSwitcherItemText(props: ContextSwitcherItemTextProps) {
  return <Combobox.ItemText {...props} />;
}

function ContextSwitcherFooter({ children }: ContextSwitcherFooterProps) {
  return (
    <>
      <Combobox.Separator />
      <Combobox.PopupFooter>{children}</Combobox.PopupFooter>
    </>
  );
}

export const ContextSwitcher = Object.assign(ContextSwitcherRoot, {
  Root: ContextSwitcherRoot,
  Trigger: ContextSwitcherTrigger,
  Value: ContextSwitcherValue,
  Search: ContextSwitcherSearch,
  Content: ContextSwitcherContent,
  Viewport: ContextSwitcherViewport,
  Empty: ContextSwitcherEmpty,
  Status: ContextSwitcherStatus,
  List: ContextSwitcherList,
  Item: ContextSwitcherItem,
  ItemText: ContextSwitcherItemText,
  Footer: ContextSwitcherFooter,
});
