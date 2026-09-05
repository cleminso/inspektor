# Application Hotkeys

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[05/09/26]

- [x] Keep one command item visually highlighted when pointer hover is followed by keyboard navigation.

[05/09/26]

- [x] Group active-connection table names under `Tables` in the global command palette.
- [x] Register table navigation from every active-connection surface and hide it until schema tables are ready.
- [x] Restore an open Data tab's filter, sort, and pagination search while opening missing tables through the existing replaceable-tab route flow.

[03/09/26]

- [x] Allow native key repeat for `J` and `K` row navigation without changing repeat suppression for other application hotkeys.
- [x] Browse adjacent query rows with one checked row and preserve batch navigation with several checked rows.
- [x] Order the visible row controls as Down then Up to mirror the keyboard's left-to-right `J`, `K` order.
- [x] Name each row action in its tooltip alongside its unwrapped shortcut.

[03/09/26]

- [x] Navigate backward and forward through checked rows with `K` and `J` while the row editor is open.
- [x] Keep checked-row shortcuts inactive in text-entry and overlay interaction layers.
- [x] Expose each shortcut from its row-editor navigation arrow tooltip.

[22/08/26]

- [x] Add `Alt+I` to toggle the active table's insert-row pane, registered as a table-scoped command and shown in the toolbar Insert row tooltip.
- [x] Keep the insert-row shortcut ignored inside text-entry controls and modal, menu, listbox, and expanded combobox interaction layers.
- [x] Disable the Insert row command when the row editor cannot open and make the toolbar button focusable when disabled so the shortcut remains discoverable.

[20/08/26]

- [x] Move the command-palette action from the connected header to the bottom dock after the dock controls.
- [x] Separate the command action from dock controls with an icon-height divider.

[20/08/26]

- [x] Add a non-character modifier to Tables workspace shortcuts so speech input cannot trigger view and history actions.
- [x] Ignore repeated keydown events and hotkeys originating inside modal, menu, listbox, and expanded combobox interaction layers.
- [x] Keep the global command palette from opening over another modal interaction layer.

[20/08/26]

- [x] Replace browser-reserved Tables view and local-history combinations with workspace-scoped `N`, `W`, `[`, and `]` shortcuts.
- [x] Let TanStack Hotkeys ignore single-key workspace shortcuts in text-entry controls before Inspektor prevents the event.
- [x] Preserve focus while bracket shortcuts navigate Tables-local history.

[20/08/26]

- [x] Keep table navigator, local history, and grid pagination shortcuts available in their workspace without listing them as command-palette actions, superseding the broader initial registration.
- [x] Show canonical shortcut hints in the table navigator, history, and new-view tooltips.
- [x] Use `New view` for the workspace add-view control's accessible name and tooltip.

[20/08/26]

- [x] Expose the global command palette through a labelled connected-header action as well as `Mod+K`.

[20/08/26]

- [x] Centralize canonical application shortcut strings for registration and display.
- [x] Add the global `Mod+K` command palette with route-scoped command registration.
- [x] Register Tables commands for navigator visibility, new and closed views, and local history navigation.
- [x] Scope previous and next page shortcuts to focus within the active data grid.
- [x] Keep unavailable commands visible and disabled in the command palette.

## Open product work

[20/08/26]

- [ ] Add useful application commands outside the Tables route.
- [ ] Decide whether commands need grouping after more product areas register actions.

## Work outside the foundation scope

[20/08/26]

- [ ] Keep command history, usage ranking, remote search, user shortcut customization, and plugin registration outside this foundation.

## Settled interaction decisions

[05/09/26]

- [x] Use Base UI's highlighted item state for both pointer and keyboard command navigation instead of a separate CSS hover highlight.

[05/09/26]

- [x] Match table palette items by table name only.
- [x] Keep table commands hidden while schema table names are unresolved.
- [x] Reuse an open Data tab's stored route search instead of resetting its view.

[03/09/26]

- [x] Let the operating system control held-key row navigation cadence; do not add custom acceleration or timers.
- [x] Keep repeated keydown events ignored for application hotkeys other than row navigation.
- [x] Keep `K` and `J` bound to the row pane while changing their navigation scope with its single-row or multi-row mode.

[20/08/26]

- [x] Use `Alt+N`, `Alt+W`, `Alt+[`, and `Alt+]` for Tables workspace actions, superseding the single-character shortcuts that required a disable or remap control.

[20/08/26]

- [x] Use `N` and `W` for new and closed Tables views so browser `Mod+N` and `Mod+W` behavior is not contested, superseding the initial modifier combinations.
- [x] Use `[` and `]` for Tables-local history so browser history shortcuts are not contested, superseding the initial modifier combinations.

[20/08/26]

- [x] Reserve the command palette for explicit commands; workspace navigation and visibility hotkeys remain discoverable beside their controls.

[20/08/26]

- [x] Use `Mod+K` for the application command palette.
- [x] Use `Mod+B`, `Mod+N`, and `Mod+W` for the Tables navigator and view actions.
- [x] Use `Mod+[` and `Mod+]` for Tables-local back and forward navigation.
- [x] Use grid-scoped `Mod+ArrowLeft` and `Mod+ArrowRight` for table pagination without replacing unmodified grid navigation.
- [x] Keep Backspace owned by local editing, staged-command reversal, and deletion interactions rather than global navigation.
- [x] Suppress Tables command execution from text-entry controls while protecting intercepted browser shortcuts.
- [x] Ignore composed and already-handled keyboard events.

## Open design decisions

[20/08/26]

- [ ] Decide whether disabled history and pagination shortcuts should remain intercepted or fall through to browser behavior.

## Validation checklist

[05/09/26]

- [x] Cover pointer-to-keyboard command navigation with a real-browser computed-style regression test.

[05/09/26]

- [x] Cover labelled command groups, table-name filtering, active-connection registration, stored-search restoration, missing-table navigation, and unresolved-schema omission.

[03/09/26]

- [x] Cover single-row selection movement, multi-row selection preservation, page-boundary continuation, and persistent controls.

[03/09/26]

- [x] Cover checked-row keyboard navigation, text-input suppression, and arrow tooltip labels.

[20/08/26]

- [x] Cover command action placement, compact icon sizing, divider semantics, and pointer activation in the bottom dock.

[20/08/26]

- [x] Cover browser-default prevention, input pass-through, focus preservation, repeated keydown suppression, and overlay-layer suppression.

[20/08/26]

- [x] Cover single-key execution, browser-default prevention, text-entry pass-through, focus preservation, and displayed shortcut labels.

[20/08/26]

- [x] Cover palette omission of workspace-only hotkeys and tooltip shortcut discovery.

[20/08/26]

- [x] Cover pointer activation through the shared command-palette action.

[20/08/26]

- [x] Cover command palette opening, input activation, command execution, empty state, and composition guards.
- [x] Cover Tables shortcut delegation, text-input suppression, and unavailable palette commands.
- [x] Cover grid focus scope, page boundaries, and loading-state pagination guards.
- [x] Verify the global command palette and console state in the browser.
- [ ] Verify Tables shortcuts, dirty-tab confirmation, and grid pagination against a connected Inspektor session.
- [ ] Verify command palette keyboard selection, focus restoration, zoom, and screen-reader announcements in the browser.
