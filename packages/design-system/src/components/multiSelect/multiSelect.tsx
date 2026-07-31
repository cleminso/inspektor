import { Popover as BasePopover } from "@base-ui/react/popover";
import * as stylex from "@stylexjs/stylex";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
  type RefObject,
} from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Search } from "../search/search";
import { multiSelectStyles } from "./multiSelect.styles";

export interface MultiSelectItem {
  /** Stable value represented by the option. */
  value: string;
  /** Visible option label and searchable text. */
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
  Omit<BasePopover.Trigger.Props, "children" | "className" | "style"> & {
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
  /** Accessible name for the search input. */
  searchLabel: string;
  /** Placeholder displayed while the query is empty. */
  searchPlaceholder?: string;
  /** Plural noun used in the empty-query message. */
  emptyLabel: string;
  /** Controls the popup width. */
  width?: MultiSelectContentWidth;
  /** Controls the scrolling option-list height. */
  maxHeight?: MultiSelectContentHeight;
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean;
  /** Aligns the popup along the trigger. */
  align?: BasePopover.Positioner.Props["align"];
  /** Sets the gap between trigger and popup. */
  sideOffset?: BasePopover.Positioner.Props["sideOffset"];
}

interface ItemControls {
  action: HTMLButtonElement | null;
  checkbox: HTMLElement | null;
}

interface MultiSelectContextValue {
  disabled: boolean;
  filteredItems: readonly MultiSelectItem[];
  items: readonly MultiSelectItem[];
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  selectedValues: readonly string[];
  setQuery: (query: string) => void;
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
  const [query, setQuery] = useState("");
  const controlsRef = useRef(new Map<string, ItemControls>());
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedValues = value ?? uncontrolledValue;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () =>
      normalizedQuery.length === 0
        ? items
        : items.filter((item) => item.label.toLocaleLowerCase().includes(normalizedQuery)),
    [items, normalizedQuery],
  );
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
      filteredItems,
      items,
      query,
      searchRef,
      triggerRef,
      selectedValues,
      setQuery,
      setSelectedValues,
    }),
    [disabled, filteredItems, items, query, selectedValues, setSelectedValues],
  );

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <BasePopover.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={(nextOpen) => {
          if (nextOpen === false) {
            setQuery("");
          }
        }}
      >
        {children}
      </BasePopover.Root>
    </MultiSelectContext.Provider>
  );
}

function MultiSelectTrigger({
  label,
  children,
  render,
  disabled = false,
  ...props
}: MultiSelectTriggerProps): React.ReactElement {
  const context = useMultiSelectContext();
  return (
    <BasePopover.Trigger
      {...props}
      aria-label={label}
      disabled={disabled === true || context.disabled === true}
      ref={context.triggerRef}
      render={render ?? <Button type="button" variant="secondary" size="m" />}
    >
      {children}
    </BasePopover.Trigger>
  );
}

const popupWidthStyles = {
  s: multiSelectStyles.popupWidthS,
  m: multiSelectStyles.popupWidthM,
  l: multiSelectStyles.popupWidthL,
} satisfies Record<MultiSelectContentWidth, unknown>;

const optionsHeightStyles = {
  s: multiSelectStyles.optionsHeightS,
  m: multiSelectStyles.optionsHeightM,
  l: multiSelectStyles.optionsHeightL,
} satisfies Record<MultiSelectContentHeight, unknown>;

function getMutableItems(items: readonly MultiSelectItem[]): readonly MultiSelectItem[] {
  return items.filter((item) => item.disabled !== true);
}

function MultiSelectContent({
  label,
  searchLabel,
  searchPlaceholder,
  emptyLabel,
  width = "m",
  maxHeight = "m",
  keepMounted = false,
  align = "start",
  sideOffset = 4,
}: MultiSelectContentProps): React.ReactElement {
  const context = useMultiSelectContext();
  const positionerStyles = createStateStyleProps<BasePopover.Positioner.State>(() => [
    multiSelectStyles.positioner,
  ]);
  const popupStyles = createStateStyleProps<BasePopover.Popup.State>(() => [
    multiSelectStyles.popup,
    popupWidthStyles[width],
  ]);
  const selectedSet = useMemo(() => new Set(context.selectedValues), [context.selectedValues]);
  const mutableItems = useMemo(() => getMutableItems(context.items), [context.items]);
  const mutableFilteredItems = useMemo(
    () => getMutableItems(context.filteredItems),
    [context.filteredItems],
  );
  const mutableFilteredItemIndices = useMemo(
    () => new Map(mutableFilteredItems.map((item, index) => [item.value, index])),
    [mutableFilteredItems],
  );
  const allMutableSelected = mutableItems.every((item) => selectedSet.has(item.value));

  const focusControl = (itemIndex: number, control: keyof ItemControls) => {
    const item = mutableFilteredItems[itemIndex];
    if (item === undefined) {
      return;
    }
    context.controls.get(item.value)?.[control]?.focus();
  };

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <BasePopover.Positioner
        align={align}
        sideOffset={sideOffset}
        {...positionerStyles}
      >
        <BasePopover.Popup
          aria-label={label}
          finalFocus={context.triggerRef}
          initialFocus={context.searchRef}
          role="dialog"
          {...popupStyles}
        >
          <div {...stylex.props(multiSelectStyles.header)}>
            <Search
              ref={context.searchRef}
              aria-label={searchLabel}
              autoFocus
              placeholder={searchPlaceholder}
              size="s"
              value={context.query}
              onValueChange={context.setQuery}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  focusControl(0, "checkbox");
                }
              }}
            />
          </div>
          <div {...stylex.props(multiSelectStyles.separator)} />
          {context.filteredItems.length === 0 ? (
            <span {...stylex.props(multiSelectStyles.empty)}>
              {`No ${emptyLabel} match "${context.query}"`}
            </span>
          ) : (
            <div
              aria-label={label}
              role="group"
              {...stylex.props(multiSelectStyles.options, optionsHeightStyles[maxHeight])}
            >
              {context.filteredItems.map((item) => (
                <MultiSelectOption
                  key={item.value}
                  allMutableSelected={allMutableSelected}
                  item={item}
                  itemIndex={mutableFilteredItemIndices.get(item.value) ?? -1}
                  mutableFilteredItems={mutableFilteredItems}
                  selectedSet={selectedSet}
                />
              ))}
            </div>
          )}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

function MultiSelectOption({
  allMutableSelected,
  item,
  itemIndex,
  mutableFilteredItems,
  selectedSet,
}: {
  allMutableSelected: boolean;
  item: MultiSelectItem;
  itemIndex: number;
  mutableFilteredItems: readonly MultiSelectItem[];
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
    if (mutableFilteredItems.length === 0 || itemIndex < 0) {
      return;
    }
    const nextIndex = (itemIndex + offset + mutableFilteredItems.length) % mutableFilteredItems.length;
    const nextItem = mutableFilteredItems[nextIndex];
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
        event.key === "Home" ? mutableFilteredItems[0] : mutableFilteredItems.at(-1);
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
          } else if (event.key === "Enter") {
            event.preventDefault();
            setItemChecked(checked === false);
          }
        }}
      />
      {disabled === true ? (
        <span {...stylex.props(multiSelectStyles.optionButton, multiSelectStyles.optionButtonDisabled)}>
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
