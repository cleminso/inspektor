# ActionList bulk selection

This document defines the split between `ActionList` selection behavior in the design system and bulk table actions in the web application.

## Table of contents

The sections cover ownership, component state, range selection, Escape handling, focus, tokens, and public metadata.

- [Objective](#objective)
- [Scope boundaries](#scope-boundaries)
- [Component API](#component-api)
- [Selection visibility rules](#selection-visibility-rules)
- [Shift-range selection](#shift-range-selection)
- [Escape handling](#escape-handling)
- [Focus and active states](#focus-and-active-states)
- [Token usage](#token-usage)
- [Documentation metadata](#documentation-metadata)

## Objective

Add bulk selection to `ActionList` so the table-explorer side panel can support pin and open-in-tab operations across multiple tables.

The consumer owns selection state and bulk commands. The design system owns the visual switch from icon to checkbox, focus behavior, and the Escape dispatch contract.

## Scope boundaries

Design system owns:

- Icon-to-checkbox crossfade per item
- Fixed leading-slot geometry
- Keyboard and hover visibility of the checkbox
- Checked item background treatment
- Escape-key dispatch and focus transfer

Consumer (`apps/studio`) owns:

- Checked set and range anchor
- Shift detection from Base UI event details
- Range calculation against visible filtered tables
- Pin/open/copy bulk commands
- Clearing strategy

## Component API

[[packages/design-system/src/studio/actionList/actionList.tsx#ActionList]] exposes compound parts for selection, navigation, and trailing actions. `ActionList.Item` has two independent boolean props:

- `active`: navigation state, applies `bg-secondary` and `text-default`
- `checked`: bulk-selection state, applies `bg-selected` and `text-default`

`active` and `checked` compose when both are true. The names are deliberately distinct because navigation and bulk selection can coexist and must not be conflated.

`ActionList.SelectionControl` is a sibling of `ActionList.Trigger`, not a child. This avoids invalid nested interactive elements and keeps the checkbox separate from the navigation link or button.

`ActionList.Root` exposes `onEscapeKeyDown`. It receives only unhandled Escape events bubbling from within the list.

`ActionList.Root.selectionControlsVisible` reveals every selection control in that list. Consumers derive it from their aggregate selection state when selection mode spans multiple items or multiple lists.

## Selection visibility rules

A checkbox is visible when:

- The item is hovered, or
- The checkbox has keyboard focus, or
- The item is checked, or
- The list has `selectionControlsVisible` enabled

StyleX context variables on the root (`selectionControlsVisible`), item (`selectionHoverVisible`), and selection control (`selectionFocusVisible`, `selectionChecked`) compose into one opacity expression. The root state is explicit consumer input rather than selection state inferred by the design system.

The item's `:hover` controls hover visibility. The selection control's `:has([data-slot="checkbox"]:focus-visible)` condition controls keyboard visibility. They are intentionally separated so focus on the trigger does not reveal the checkbox.

The table explorer enables list-wide visibility for both the Pinned and Tables lists while its checked set is non-empty. Clearing the final checked table restores the leading icons in both lists.

## Shift-range selection

The consumer owns range selection without a TanStack Hotkeys dependency. This behavior supports the broader scenarios in [[lat.md/tableExplorerBehaviors#Table Explorer selection and pane behavior]].

`TableExplorerScreen` keeps:

- `checkedTableNames: ReadonlySet<string>` as React state
- `tableSelectionAnchorRef` as a ref

`TableListPane` forwards `orderedTableNames` (the visible filtered list) and `extendRange` (from Base UI's `eventDetails.event.shiftKey`) to `onTableCheckedChange`.

`updateTableNameSelection` is a pure helper:

- Normal click: toggle only the target and establish a new anchor.
- Shift-click with a visible anchor: apply the target's new state to the inclusive range.
- Shift-click without a visible anchor: fall back to a normal click.
- The anchor is preserved across range extensions.

## Escape handling

`ActionList.Root.onEscapeKeyDown` receives only Escape events that no descendant has prevented.

Consumer contract:

- Call `event.preventDefault()` only when Escape clears a non-empty selection.
- Leave the event unhandled for no-op Escape.

`ActionList` then:

- Checks `event.defaultPrevented`.
- Locates the originating item via `data-slot="action-list-item"`.
- Moves focus to that item's `data-slot="action-list-trigger"`.

This removes the checkbox focus ring without suppressing accessible focus indicators. No-op Escape leaves focus unchanged.

## Focus and active states

Item-level `:focus-within` does not introduce a distinct background or text color. The current marker remains independent from focus and pointer states.

Item-level `:focus-within` is also absent from trailing-action visibility. A selection checkbox retains focus after it is unchecked, so using focus-within would leave the sibling trailing action visible. Trailing actions are visible while their item is hovered, while the action itself is focus-visible, or while its popup is open.

Each interactive child owns its own `:focus-visible` treatment:

- Trigger focus shows the trigger outline.
- Checkbox focus shows the checkbox and reveals it.
- Trailing action focus shows the action outline.

Active items keep a logical leading marker. Checked items keep `bg-selected`. When both states apply, the marker and background remain visible together regardless of focus state.

## Token usage

No new tokens were added. Existing semantic roles express the hierarchy:

- Accordion trigger: `text-muted`
- Inactive item: `text-subtle`
- Hovered item: `text-muted`
- Checked or active item: `text-default`
- Disabled item: `text-disabled`

Hover and checked backgrounds reuse `bg-hover` and `bg-selected` from the semantic token set. The active marker reuses `selectionColors.border`, and its width reuses the focus-ring spatial token established for persistent state bars.

## Documentation metadata

Accordion `Panel` explicitly exposes `keepMounted` and `hiddenUntilFound` as documented parts of its public contract.

ActionList `Trigger` and `Action` explicitly expose `disabled` and `render` so the supported composition contract remains visible in package source.

Component tests guard the documented Accordion and ActionList behavior.
