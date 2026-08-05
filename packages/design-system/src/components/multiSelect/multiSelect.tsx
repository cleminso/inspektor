import { Popover as BasePopover } from "@base-ui/react/popover";
import * as stylex from "@stylexjs/stylex";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type KeyboardEvent,
  type PropsWithChildren,
  type RefCallback,
  type RefObject,
} from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { popupPositioning } from "../../primitives/popupPositioning";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { ScrollAreaPrivate } from "../scrollArea/scrollArea";
import { multiSelectStyles } from "./multiSelect.styles";

export interface MultiSelectItem {
  /** Stable value represented by the option. */
  value: string;
  /** Visible option label. */
  label: string;
  /** Prevents the option from changing while keeping it visible. */
  disabled?: boolean;
}

export type MultiSelectRootProps = PropsWithChildren<{
  /** Known options displayed by the popup. */
  items: readonly MultiSelectItem[];
  /** Controlled selected values. */
  value?: readonly string[];
  /** Initially selected values when uncontrolled. */
  defaultValue?: readonly string[];
  /** Runs when the selected values change. */
  onValueChange?: (value: string[]) => void;
  /** Whether the popup is initially open. */
  defaultOpen?: boolean;
  /** Whether the popup is open. */
  open?: boolean;
  /** Runs when the popup opens or closes. */
  onOpenChange?: BasePopover.Root.Props["onOpenChange"];
  /** Disables the trigger and every mutable option. */
  disabled?: boolean;
}>;

export type MultiSelectTriggerProps = PropsWithChildren<
  Omit<BasePopover.Trigger.Props, "aria-label" | "children" | "className" | "style"> & {
    /** Stable accessible name for the trigger. */
    label: string;
    /** Composes trigger behavior onto another native button. */
    render?: BasePopover.Trigger.Props["render"];
    /** Disables the trigger. */
    disabled?: boolean;
  }
>;

export type MultiSelectContentWidth = "s" | "m" | "l";
export type MultiSelectContentHeight = "s" | "m" | "l";

export interface MultiSelectContentProps {
  /** Accessible name for the popup. */
  label: string;
  /** Controls the popup width. */
  width?: MultiSelectContentWidth;
  /** Controls the scrolling option-list height. */
  maxHeight?: MultiSelectContentHeight;
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean;
  /** Aligns the popup along the trigger. */
  align?: BasePopover.Positioner.Props["align"];
}

interface ItemControls {
  action: HTMLButtonElement | null;
  checkbox: HTMLElement | null;
}

interface MultiSelectContextValue {
  disabled: boolean;
  items: readonly MultiSelectItem[];
  triggerRef: RefObject<ComponentRef<typeof BasePopover.Trigger> | null>;
  selectedValues: readonly string[];
  setSelectedValues: (values: string[]) => void;
  controls: Map<string, ItemControls>;
}

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null);

function useMultiSelectContext(): MultiSelectContextValue {
  const context = useContext(MultiSelectContext);
  if (context === null) {
    throw new Error("MultiSelect parts must be rendered inside MultiSelect.Root.");
  }
  return context;
}

function MultiSelectRoot({
  children,
  items,
  value,
  defaultValue = [],
  onValueChange,
  defaultOpen = false,
  open,
  onOpenChange,
  disabled = false,
}: MultiSelectRootProps): React.ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<readonly string[]>(defaultValue);
  const controlsRef = useRef(new Map<string, ItemControls>());
  const triggerRef = useRef<ComponentRef<typeof BasePopover.Trigger>>(null);
  const selectedValues = value ?? uncontrolledValue;
  const setSelectedValues = useCallback(
    (nextValue: string[]) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );
  const contextValue = useMemo<MultiSelectContextValue>(
    () => ({
      controls: controlsRef.current,
      disabled,
      items,
      triggerRef,
      selectedValues,
      setSelectedValues,
    }),
    [disabled, items, selectedValues, setSelectedValues],
  );

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <BasePopover.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
      >
        {children}
      </BasePopover.Root>
    </MultiSelectContext.Provider>
  );
}

const MultiSelectTrigger = forwardRef<
  ComponentRef<typeof BasePopover.Trigger>,
  MultiSelectTriggerProps
>(function MultiSelectTrigger(
  { label, children, render, disabled = false, ...props },
  forwardedRef,
): React.ReactElement {
  const context = useMultiSelectContext();
  const triggerRef = useCallback(
    (element: ComponentRef<typeof BasePopover.Trigger> | null) => {
      context.triggerRef.current = element;
      const cleanup =
        typeof forwardedRef === "function"
          ? (forwardedRef as RefCallback<ComponentRef<typeof BasePopover.Trigger>>)(element)
          : (() => {
              if (forwardedRef !== null) {
                forwardedRef.current = element;
              }
              return undefined;
            })();

      return () => {
        context.triggerRef.current = null;
        if (typeof cleanup === "function") {
          cleanup();
        } else if (typeof forwardedRef === "function") {
          forwardedRef(null);
        } else if (forwardedRef !== null) {
          forwardedRef.current = null;
        }
      };
    },
    [context.triggerRef, forwardedRef],
  );
  const triggerStyles = createStateStyleProps<BasePopover.Trigger.State>((state) => [
    state.open === true && multiSelectStyles.triggerOpen,
    state.disabled === true && multiSelectStyles.triggerDisabled,
  ]);

  return (
    <BasePopover.Trigger
      {...props}
      aria-label={label}
      disabled={disabled === true || context.disabled === true}
      ref={triggerRef as BasePopover.Trigger.Props["ref"]}
      render={render ?? <Button type="button" variant="secondary" size="m" />}
      {...triggerStyles}
    >
      {children}
    </BasePopover.Trigger>
  );
});

const popupWidthStyles = {
  s: multiSelectStyles.popupWidthS,
  m: multiSelectStyles.popupWidthM,
  l: multiSelectStyles.popupWidthL,
} satisfies Record<MultiSelectContentWidth, unknown>;

function getMutableItems(items: readonly MultiSelectItem[]): readonly MultiSelectItem[] {
  return items.filter((item) => item.disabled !== true);
}

function MultiSelectContent({
  label,
  width = "m",
  maxHeight = "m",
  keepMounted = false,
  align = "start",
}: MultiSelectContentProps): React.ReactElement {
  const context = useMultiSelectContext();
  const popupRef = useRef<ComponentRef<typeof BasePopover.Popup>>(null);
  const positionerStyles = createStateStyleProps<BasePopover.Positioner.State>((state) => [
    multiSelectStyles.positioner,
    state.open === true && multiSelectStyles.positionerOpen,
    state.open === false && multiSelectStyles.positionerClosed,
    state.anchorHidden === true && multiSelectStyles.positionerAnchorHidden,
    state.instant !== undefined && multiSelectStyles.positionerInstant,
    state.side === "top" && multiSelectStyles.positionerSideTop,
    state.side === "bottom" && multiSelectStyles.positionerSideBottom,
    state.side === "left" && multiSelectStyles.positionerSideLeft,
    state.side === "right" && multiSelectStyles.positionerSideRight,
    state.side === "inline-start" && multiSelectStyles.positionerSideInlineStart,
    state.side === "inline-end" && multiSelectStyles.positionerSideInlineEnd,
    state.align === "start" && multiSelectStyles.positionerAlignStart,
    state.align === "center" && multiSelectStyles.positionerAlignCenter,
    state.align === "end" && multiSelectStyles.positionerAlignEnd,
  ]);
  const popupStyles = createStateStyleProps<BasePopover.Popup.State>((state) => [
    multiSelectStyles.popup,
    popupWidthStyles[width],
    state.open === true && multiSelectStyles.popupOpen,
    state.open === false && multiSelectStyles.popupClosed,
    state.transitionStatus === "starting" && multiSelectStyles.popupStarting,
    state.transitionStatus === "ending" && multiSelectStyles.popupEnding,
    state.instant !== undefined && multiSelectStyles.popupInstant,
    state.side === "top" && multiSelectStyles.popupSideTop,
    state.side === "bottom" && multiSelectStyles.popupSideBottom,
    state.side === "left" && multiSelectStyles.popupSideLeft,
    state.side === "right" && multiSelectStyles.popupSideRight,
    state.side === "inline-start" && multiSelectStyles.popupSideInlineStart,
    state.side === "inline-end" && multiSelectStyles.popupSideInlineEnd,
    state.align === "start" && multiSelectStyles.popupAlignStart,
    state.align === "center" && multiSelectStyles.popupAlignCenter,
    state.align === "end" && multiSelectStyles.popupAlignEnd,
  ]);
  const selectedSet = useMemo(() => new Set(context.selectedValues), [context.selectedValues]);
  const mutableItems = useMemo(() => getMutableItems(context.items), [context.items]);
  const mutableItemIndices = useMemo(
    () => new Map(mutableItems.map((item, index) => [item.value, index])),
    [mutableItems],
  );
  const allMutableSelected = mutableItems.every((item) => selectedSet.has(item.value));

  const focusControl = (itemIndex: number, control: keyof ItemControls) => {
    const item = mutableItems[itemIndex];
    if (item === undefined) {
      return;
    }
    context.controls.get(item.value)?.[control]?.focus();
  };

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <BasePopover.Positioner
        align={align}
        sideOffset={popupPositioning.dropdownSideOffset}
        {...positionerStyles}
      >
        <BasePopover.Popup
          ref={popupRef}
          aria-label={label}
          finalFocus={context.triggerRef}
          initialFocus={popupRef}
          role="dialog"
          onKeyDown={(event) => {
            if (event.defaultPrevented === true || event.target !== event.currentTarget) {
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              focusControl(event.key === "ArrowDown" ? 0 : mutableItems.length - 1, "checkbox");
            }
          }}
          {...popupStyles}
        >
          <ScrollAreaPrivate
            layout="content"
            maxHeight={maxHeight}
            rootSlot="multi-select-scroll-area"
            viewportSlot="multi-select-viewport"
          >
            <div aria-label={label} role="group" {...stylex.props(multiSelectStyles.options)}>
              {context.items.map((item) => (
                <MultiSelectOption
                  key={item.value}
                  allMutableSelected={allMutableSelected}
                  item={item}
                  itemIndex={mutableItemIndices.get(item.value) ?? -1}
                  mutableItems={mutableItems}
                  selectedSet={selectedSet}
                />
              ))}
            </div>
          </ScrollAreaPrivate>
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

function MultiSelectOption({
  allMutableSelected,
  item,
  itemIndex,
  mutableItems,
  selectedSet,
}: {
  allMutableSelected: boolean;
  item: MultiSelectItem;
  itemIndex: number;
  mutableItems: readonly MultiSelectItem[];
  selectedSet: ReadonlySet<string>;
}): React.ReactElement {
  const context = useMultiSelectContext();
  const checked = selectedSet.has(item.value);
  const disabled = context.disabled === true || item.disabled === true;
  const actionKind = allMutableSelected === true || checked === false ? "only" : "all";
  const actionLabel = actionKind === "all" ? `Check all from ${item.label}` : `Only ${item.label}`;

  const setItemChecked = (nextChecked: boolean) => {
    const nextSelected = new Set(context.selectedValues);
    if (nextChecked === true) {
      nextSelected.add(item.value);
    } else {
      nextSelected.delete(item.value);
    }
    context.setSelectedValues(
      context.items.filter((candidate) => nextSelected.has(candidate.value)).map((candidate) => candidate.value),
    );
  };

  const focusRelative = (offset: number, control: keyof ItemControls) => {
    if (mutableItems.length === 0 || itemIndex < 0) {
      return;
    }
    const nextIndex = (itemIndex + offset + mutableItems.length) % mutableItems.length;
    const nextItem = mutableItems[nextIndex];
    if (nextItem !== undefined) {
      context.controls.get(nextItem.value)?.[control]?.focus();
    }
  };

  const handleNavigation = (
    event: KeyboardEvent<HTMLElement>,
    control: keyof ItemControls,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusRelative(event.key === "ArrowDown" ? 1 : -1, control);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextItem =
        event.key === "Home" ? mutableItems[0] : mutableItems.at(-1);
      if (nextItem !== undefined) {
        context.controls.get(nextItem.value)?.[control]?.focus();
      }
    }
  };

  return (
    <div
      {...stylex.props(
        multiSelectStyles.row,
        disabled === true && multiSelectStyles.rowDisabled,
      )}
      data-slot="multi-select-row"
    >
      <Checkbox
        ref={(element) => {
          const controls = context.controls.get(item.value) ?? { action: null, checkbox: null };
          controls.checkbox = element;
          context.controls.set(item.value, controls);
        }}
        aria-label={`Select ${item.label}`}
        checked={checked}
        disabled={disabled}
        size="s"
        tabIndex={-1}
        onCheckedChange={(nextChecked) => setItemChecked(nextChecked === true)}
        onKeyDown={(event) => {
          handleNavigation(event, "checkbox");
          if (event.defaultPrevented === true) {
            return;
          }
          if (event.key === "ArrowRight" && disabled === false) {
            event.preventDefault();
            context.controls.get(item.value)?.action?.focus();
          } else if (event.key === "Enter" && disabled === false) {
            event.preventDefault();
            setItemChecked(checked === false);
          }
        }}
      />
      {disabled === true ? (
        <span
          {...stylex.props(
            multiSelectStyles.optionButton,
            multiSelectStyles.optionButtonDisabled,
          )}
        >
          <span {...stylex.props(multiSelectStyles.optionText)}>{item.label}</span>
        </span>
      ) : (
        <button
          ref={(element) => {
            const controls = context.controls.get(item.value) ?? { action: null, checkbox: null };
            controls.action = element;
            context.controls.set(item.value, controls);
          }}
          {...stylex.props(multiSelectStyles.optionButton)}
          type="button"
          aria-label={actionLabel}
          tabIndex={-1}
          onClick={() => {
            if (actionKind === "all") {
              const mutableValues = new Set(
                getMutableItems(context.items).map((candidate) => candidate.value),
              );
              context.setSelectedValues(
                context.items
                  .filter(
                    (candidate) =>
                      mutableValues.has(candidate.value) || selectedSet.has(candidate.value),
                  )
                  .map((candidate) => candidate.value),
              );
              return;
            }
            context.setSelectedValues(
              context.items
                .filter(
                  (candidate) =>
                    candidate.value === item.value ||
                    (candidate.disabled === true && selectedSet.has(candidate.value)),
                )
                .map((candidate) => candidate.value),
            );
          }}
          onKeyDown={(event) => {
            handleNavigation(event, "action");
            if (event.defaultPrevented === true) {
              return;
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              context.controls.get(item.value)?.checkbox?.focus();
            }
          }}
        >
          <span {...stylex.props(multiSelectStyles.optionText)}>{item.label}</span>
          <span aria-hidden="true" {...stylex.props(multiSelectStyles.action)}>
            {actionKind === "all" ? "Check all" : "Only"}
          </span>
        </button>
      )}
    </div>
  );
}

export const MultiSelect = Object.assign(MultiSelectRoot, {
  Root: MultiSelectRoot,
  Trigger: MultiSelectTrigger,
  Content: MultiSelectContent,
});
