# Filter Builder

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
  - [Implementation plan](#implementation-plan)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### Filter action label

[20/08/26]

- [x] Rename the empty toolbar action from `Filter table by column` to `Filter table` without changing its filtering scope.

### Staged chip Backspace deletion

[19/08/26]

- [x] Backspace on an empty column-stage draft removes the last staged clause chip and keeps the command open.
- [x] Backspace with no remaining staged chips and an empty draft closes the command.
- [x] Keep Backspace step-back behavior for incomplete drafts ahead of staged chip removal.
- [x] Cover chip removal, dialog persistence, focus retention, and follow-up closure with a regression test.

### Staged clause removal focus

[19/08/26]

- [x] Keep the command dialog open when its only staged clause is removed.
- [x] Return focus to the active draft input before the staged remove action unmounts.
- [x] Prevent pointer activation from moving focus onto the transient remove button.
- [x] Cover dialog persistence and focus recovery with a regression test.

### Supported command highlighting

[19/08/26]

- [x] Use Base UI's public Boolean `autoHighlight` contract instead of its private always-highlight mode.
- [x] Require explicit Arrow-key navigation before Enter selects an option when the query is empty.
- [x] Keep final Enter application available when staged clauses exist and no column option is active.

### Value-step hierarchy

[19/08/26]

- [x] Remove the redundant Values group label when the value input already names the active step.
- [x] Omit the empty suggestions region and its surrounding separators when the value step has no options.

### Command input typography

[19/08/26]

- [x] Match column search and value-entry input text to the command option text size.

### Clause deletion cancellation

[19/08/26]

- [x] Let Escape cancel whole-clause keyboard deletion and return focus to the applied-filter viewport without changing filters.
- [x] Expose the Backspace and Escape shortcuts on the applied-filter viewport.
- [x] Cover cancellation focus and unchanged filter state with a regression test.

### Removal focus and command close visibility

[19/08/26]

- [x] Restore whole-clause focus only after an asynchronous filter removal is reflected in the rendered toolbar.
- [x] Move focus to the adjacent clause, or the empty filter action when no clauses remain.
- [x] Keep the command close action in an opaque fixed header slot while draft chips scroll beneath it.
- [x] Cover delayed controlled removal with a focus regression test and document close behavior in the overflow example.

### Deletion emphasis and caret cadence

[19/08/26]

- [x] Give the empty applied-clause caret distinct visible and hidden phases so it blinks like a text-editing caret.
- [x] Use the semantic danger focus ring when a complete clause is selected for keyboard deletion.

### Clause-entry affordance and complete-clause focus

[19/08/26]

- [x] Present a text cursor across the clickable applied-clause viewport.
- [x] Show a blinking caret after the final applied clause while the viewport owns focus, with a non-animated reduced-motion state.
- [x] Move Backspace selection focus to the complete clause root so the edit trigger and remove action share one selection outline.
- [x] Keep direct trigger editing and remove-action activation independent from programmatic whole-clause selection.

### Filtered-empty recovery and clause-list focus

[19/08/26]

- [x] Offer a ghost Clear action below the filtered-empty message and clear filters through the existing table-view state boundary.
- [x] Make the applied-clause viewport focusable from its empty trailing area.
- [x] Focus the final clause on the first viewport Backspace and remove it when Backspace is pressed again on the focused clause.
- [x] Preserve a visible keyboard focus indicator for the applied-clause viewport.

### Bounded command and toolbar overflow

[19/08/26]

- [x] Keep completed command chips inside a hidden-scrollbar horizontal input-row viewport bounded by `content-measure`.
- [x] Keep `Add more filters` outside the applied-clause scroll viewport when filters exist.
- [x] Reserve toolbar width for the fixed Add action so pagination and toolbar actions remain reachable.
- [x] Preserve the empty `Filter table by column` action at the start of the toolbar.

### Deferred command application and date step

[19/08/26]

- [x] Keep completed clauses inside the command header without updating the data grid behind the modal.
- [x] Apply all staged clauses together only when Enter is pressed from the empty column input.
- [x] Keep the column input focused after a clause is staged so another clause can be constructed.
- [x] Present `Pick a date…` as a keyboard-highlighted value option that navigates to an inline Calendar step.
- [x] Format Timestamp clause values as `YYYY-MM-DD` while preserving numeric query values.
- [x] Remove column and operator placeholders when staged clause chips already occupy the command input row.
- [x] Size the Command surface with the `content-measure` semantic token.

### Continuous clause construction polish

[19/08/26]

- [x] Restore one 12px ghost close action inside every applied clause chip.
- [x] Remove the Filter Builder master clear action.
- [x] Present the selected column as plain header text during operator selection, then promote the column and operator into one chip for value selection.
- [x] Move free-form value entry below the selected-clause header and keep supported value suggestions in the content list.
- [x] Offer distinct values from loaded rows for scalar columns while retaining arbitrary typed value entry.
- [x] Keep create mode open after applying a value and return directly to column selection for another clause.
- [x] Offer timestamp shortcuts for comparison operators and open the existing Calendar from `Pick a date`.
- [x] Match Workspace Tabs horizontal scroll ownership so filter clauses cannot displace fixed toolbar controls.

### Compound clause and keyboard polish

[19/08/26]

- [x] Use the 36px command control semantic for the command input row and footer.
- [x] Present selected draft column and operator as one chip only after both choices are complete.
- [x] Present each applied clause as one 22px compound chip without a trailing remove segment.
- [x] Switch the root action from `Filter table by column` to `Add filters` when clauses exist.
- [x] Remove the root action's filled hover treatment.
- [x] Focus the final clause chip on the first root Backspace and remove it on the second Backspace.
- [x] Focus the compound draft chip on the first empty-input Backspace and clear it on the second Backspace.
- [x] Keep the first command option active when column selection advances to the operator stage.
- [x] Collapse the mounted empty-status region when matching command items exist.

### Filter root and palette polish

[18/08/26]

- [x] Replace the `Add filter` label with the muted `Filter table by column` root action.
- [x] Keep the root action available across the remaining toolbar width and open column selection from it.
- [x] Add one master clear action that removes every applied clause.
- [x] Remove applied clauses from the end, one per Backspace press, when the empty root palette is open.
- [x] Compose selected column and operator chips into the palette input row.
- [x] Label palette result groups as `Columns`, `Operators`, and `Values`.
- [x] Present column names and types on one horizontal row.
- [x] Present operator symbols on the trailing edge and accept standard glyph aliases from the operator input.
- [x] Replace palette footer actions with keyboard navigation, selection, application, and cancellation hints.

### Filter Builder workspace flow

[19/08/26]

- [x] Derive consecutive removals from the latest filter state so rapid actions cannot restore clauses.
- [x] Resolve edits by persisted clause identity when surrounding filters move and reject ambiguous legacy IDs.
- [x] Keep draft validation separate from clause ID allocation.
- [x] Add a keyboard-reachable command close action and keep command inputs focused on open.
- [x] Replace layout-detail tests with validation, repeated-predicate, URL-state, and consecutive-removal behavior tests.

[18/08/26]

- [x] Add the Base UI Dialog and Combobox-backed compositional `Command` foundation and documentation.
- [x] Add the documented segmented `DataGridFilterClause` compound component.
- [x] Add the schema-driven create, edit, validation, stale-repair, scalar-token, and atomic apply draft model.
- [x] Render URL-backed clauses in the table toolbar with horizontal overflow, direct removal, and focus restoration.
- [x] Route applied changes through `useTableViewState.setFilters()` so pagination and selection reset at the existing boundary.
- [x] Preserve repeated predicates with unique transient render keys and exclude invalid clauses from query construction.

### Jazz query contract

[18/08/26]

- [x] Derive filter operators and operator types from the public `jazz-tools` API.
- [x] Ignore URL and telemetry clauses that cannot target the selected runtime table.
- [x] Reject malformed URL clauses with unknown operators or missing values.
- [x] Preserve repeated predicates so client-only clause identity does not change query semantics.
- [x] Cover URL parsing and schema-backed query filtering at their application boundaries.

## Open product work

### Implementation plan

[18/08/26]

#### Discovered follow-up scope

[18/08/26]

- [ ] Define the Tables navigator control placement and activation contract before implementing `DataGridFilterControl`.
- [ ] Define shared application filter actions for cell context actions, Query Subscription links, and Tables navigator entry points before routing those surfaces through the builder.
- [ ] Add browser coverage against a connected runtime table for URL mutation, page reset, selection reset, and stale-schema repair.

#### 1. Lock the command and clause contracts

- [x] Confirm the command, value-entry, toolbar-density, and keyboard interaction decisions before component implementation.
- [x] Define the generic command vocabulary independently from filters: root, dialog, input, list, group, item, empty state, separator, shortcut, back action, and footer.
- [x] Define the segmented clause vocabulary independently from Jazz: root, column trigger, operator trigger, value trigger, remove action, and invalid state.
- [x] Keep `className`, inline `style`, arbitrary dimensions, broad slot overrides, Jazz schema objects, and URL state out of both public design-system APIs.
- [x] Define controlled open, query, active-step, and selection contracts so application state can enter a command flow at a specific step without imperative DOM control.

#### 2. Build the generic command foundation in `@inspector/ds`

- [x] Audit the installed Base UI Dialog and Combobox versions, APIs, handbook guidance, tagged source, emitted state attributes, focus behavior, and keyboard behavior before wrapping them.
- [x] Use Base UI Dialog for modal containment, focus trapping, dismissal, and trigger focus restoration.
- [x] Use Base UI Combobox behavior for searchable option lists, active-option management, arrow navigation, Enter selection, empty results, and screen-reader semantics.
- [x] Do not add `cmdk`, Radix, or a second interaction primitive; borrow only shadcn's compositional command vocabulary and presentation ideas.
- [x] Implement the command parts under `packages/design-system/src/components/command/` with behavior in `command.tsx` and StyleX rules in `command.styles.ts`.
- [x] Support a standalone command surface and `Command.Dialog` composition without exposing styling escape hatches.
- [x] Keep command items compositional so applications provide actions, labels, descriptions, icons, keywords, and shortcuts without passing one broad command registry object into the design system.
- [x] Support grouped results, an explicit empty state, bounded scrolling, optional footer hints, and a visible back action for staged flows.
- [x] Use deterministic case-insensitive substring filtering across labels, descriptions, and typed keywords.
- [x] Reset the search query and active option when the application changes command stages.
- [x] Preserve focus-visible treatment, forced-colors behavior, reduced-motion behavior, and trigger focus restoration.
- [x] Add behavior tests using the real Base UI wrappers for open and close, filtering, arrow navigation, Enter selection, Escape dismissal, empty results, focus containment, and focus restoration.
- [x] Export the command component and consumer-facing types from `packages/design-system/src/index.ts`.
- [x] Add the command documentation page, executable examples, registry metadata, generated prop metadata, and static route in `apps/design-system`.

#### 3. Build segmented filter-clause presentation in `@inspector/ds`

- [x] Implement `DataGridFilterClause.Root`, `Column`, `Operator`, `Value`, and `Remove` under `packages/design-system/src/components/dataGridFilterClause/`.
- [x] Render the root as a labelled group containing sibling native buttons; never nest the remove button or segment buttons inside another interactive element.
- [x] Give each segment an independent hover, pressed, and focus-visible state while preserving one visually continuous grouped surface.
- [x] Keep the remove action available directly in the toolbar with a minimum accessible hit area and a required action-oriented accessible name.
- [x] Support constrained invalid presentation using icon, text treatment, and accessible description rather than color alone.
- [x] Truncate long column names and values without hiding their complete accessible names.
- [x] Preserve logical segment order and grouped-edge radii in left-to-right and right-to-left layouts.
- [x] Add component tests for segment activation, remove isolation, disabled and invalid states, accessible names, focus order, and ref forwarding.
- [x] Export and document the compound component with executable create, edit, remove, invalid, and long-value examples.

#### 4. Implement the application-owned filter editor model

- [x] Define a discriminated draft model for create and edit modes with `column`, `operator`, and `value` stages.
- [x] Keep the persisted `TableFilterClause` unchanged until a complete draft is applied.
- [x] Enter create mode at column selection from the toolbar Add filter trigger.
- [x] Enter edit mode at the column, operator, or value stage according to the activated clause segment.
- [x] Reset operator and value when the draft column changes.
- [x] Reset value when the draft operator changes.
- [x] Preserve column and operator when only the value is edited.
- [x] Discard the draft on Escape, outside dismissal, or explicit cancellation without changing URL state.
- [x] Replace the edited clause atomically after successful validation and preserve its position among the applied clauses.
- [x] Generate a unique persisted ID for every newly applied clause.
- [x] Derive unique transient render identities for repeated or legacy duplicate clause IDs without dropping predicates or changing query semantics.
- [x] Add pure transition tests for every stage entry, reset rule, cancellation path, successful apply, repeated-clause case, and invalid draft.

#### 5. Implement schema-driven command stages

- [x] Build the column stage from the selected table's implicit `id` column and stored runtime schema columns.
- [x] Exclude column types that have no supported visible value-entry contract.
- [x] Build the operator stage from `getFilterOperatorsForColumn()` and map technical operators to clear product labels.
- [x] Present `isNull: true` and `isNull: false` as complete `Is null` and `Is not null` choices that do not open a separate Boolean value stage.
- [x] Use command items for Enum and Boolean values.
- [x] Use constrained text controls for Text, UUID, Integer, BigInt, Double, and Timestamp values.
- [x] Use a multi-value token field for scalar `in` values, parse each token through the selected column schema, accept line-separated paste input, and serialize an actual typed array without a comma-only grammar.
- [x] Keep `in` hidden for Array, JSON, and Bytea columns until dedicated structured editors exist.
- [x] Keep Bytea columns out of the visible builder unless a canonical byte-entry decision is accepted.
- [x] Validate on Apply or Enter, then validate on change after the first visible issue so corrected input clears its error immediately.
- [x] Keep validation text beside the value control and connect it through `aria-invalid` and `aria-describedby`.
- [ ] Add parsing and URL-round-trip tests for every exposed column type and operator-owned value shape.

#### 6. Integrate the builder into the table toolbar

- [x] Render the filter bar in the existing flexible `Toolbar` content slot before pagination and actions.
- [x] Show applied clauses as segmented `DataGridFilterClause` groups followed by the Add filter trigger.
- [x] Open the same scoped command dialog from Add filter and every editable clause segment.
- [x] Remove a clause directly from its toolbar action without opening the command dialog or requesting confirmation.
- [x] After removal, move focus to the next clause, the previous clause, or Add filter when no clauses remain.
- [x] After dialog dismissal, restore focus to the segment or Add filter trigger that opened it.
- [x] Keep the toolbar on one stable-height row with bounded horizontal overflow and keep Add filter reachable.
- [x] Apply filter changes through `useTableViewState.setFilters()` so pagination returns to page one and grid selection clears through the existing state boundary.
- [x] Preserve settled rows only for compatible refreshes and announce filtered emptiness through the existing grid status behavior.
- [x] Add integration tests for create, direct segment edit, cancellation, apply, remove, focus restoration, page reset, selection reset, and URL synchronization.

#### 7. Represent stale and malformed filters safely

- [x] Continue discarding clauses that cannot be structurally parsed from URL state.
- [x] Keep well-formed clauses that no longer match the active schema available to the toolbar presentation while excluding them from query construction.
- [x] Render each recoverable stale clause with a disabled invalid treatment, a concise reason, and a direct remove action.
- [x] Let an invalid column segment reopen column selection so the user can repair the clause without recreating it.
- [x] Prevent invalid clauses from entering the Jazz query or blocking valid clauses.
- [x] Add route and toolbar integration tests for removed columns, changed column types, unsupported operators, invalid `in` values, invalid null checks, and mixed valid and invalid clauses.

#### 8. Connect command entry points without coupling them

- [x] Keep the toolbar trigger as the primary local entry point into the filter flow.
- [x] Keep `Cmd+K` and `Ctrl+K` reserved for the general application command palette rather than binding them directly to filters.
- [x] Build the reusable command palette foundation and toolbar-triggered filter flow without adding the general application `Cmd+K` and `Ctrl+K` shell in this scope.
- [x] Avoid a general command-registration framework until more than one independent feature needs dynamic registration.
- [ ] Route cell context actions, Query Subscription links, and the Tables navigator through shared application filter actions instead of duplicating clause construction.
- [ ] Verify that every entry point produces the same URL clause representation and table-query identity.

#### 9. Harden and validate the complete interaction

- [ ] Verify mouse, keyboard-only, screen-reader, zoom, narrow-width, long-schema, long-value, and repeated-clause behavior in the rendered application.
- [ ] Verify command dialog focus containment, Escape handling, stage navigation, trigger restoration, and no keyboard-shortcut activation while composing text.
- [ ] Verify the visible Back action and Backspace stage navigation: an incomplete clause clears value, operator, and column one operation at a time, while Backspace on a complete clause removes the entire clause.
- [ ] Verify toolbar overflow, clause truncation, invalid-state messaging, filtered empty state, loading refresh, and query failure behavior.
- [ ] Run focused design-system tests and changed-file lint before package-wide design-system validation.
- [ ] Run focused application tests and changed-file lint before Inspector typecheck, build, and package-wide tests.
- [ ] Inspect production output if the command implementation changes dynamic import boundaries or adds a heavy dependency.

### Visible filter interfaces

[18/08/26]

- [x] Implement the workspace `DataGridFilterBuilder` interface.
- [ ] Implement the Tables navigator `DataGridFilterControl` interface.
- [ ] Synchronize both interfaces over the URL-backed applied clause model.
- [ ] Connect cell context actions and Query Subscription links through the shared filter actions.

## Work outside the foundation scope

### Explicit exclusions for this implementation

[18/08/26]

- [ ] Keep a broad application command catalogue, command history, recently used ranking, remote command search, and plugin command registration outside the Filter Builder implementation.
- [ ] Keep Bytea value entry outside the visible builder unless a canonical input and URL representation is accepted.
- [ ] Keep drag reordering of clauses, saved filter presets, named views, and cross-table filter copying outside this implementation.
- [ ] Keep a second Supabase-style nested-menu editor outside the implementation; toolbar and command entry points must share one staged editor.

### Advanced query shapes

[18/08/26]

- [ ] Keep grouped predicates, `OR`, nested relations, facets, aggregates, and table-wide counts outside the flat filter model.

## Settled interaction decisions

### Clause deletion cancellation

[19/08/26]

- [x] Escape exits whole-clause deletion selection by returning focus to the applied-filter viewport rather than moving focus outside the toolbar.

### Deletion-state emphasis

[19/08/26]

- [x] Keep the applied-clause viewport's text-entry focus ring neutral, then switch to danger emphasis only after Backspace selects a complete clause for deletion.
- [x] Use an even caret blink cadence and disable the animation when reduced motion is requested.

### Clause-entry affordance and complete-clause selection

[19/08/26]

- [x] Treat the applied-clause viewport's trailing area like an empty token input: use a text cursor and show a caret when focused.
- [x] The first viewport Backspace selects the complete final clause, including its remove action, rather than focusing only the edit trigger.
- [x] Backspace or Delete on a selected clause root removes that clause and selects the next complete clause root.

### Empty-result recovery and two-step deletion

[19/08/26]

- [x] Keep bulk filter clearing out of the toolbar; expose it contextually below `No rows match these filters` when filters produce no rows.
- [x] Clicking the applied-clause viewport's empty trailing area focuses the viewport without opening the filter command.
- [x] Backspace on the focused viewport selects the final clause without deleting it; Backspace or Delete on that focused clause removes it.

### Overflow ownership

[19/08/26]

- [x] Command input rows own horizontal overflow when completed chips exceed the `content-measure` surface width; the command surface must not grow beyond that token.
- [x] Supersede the single filter-toolbar overflow region: only applied clauses scroll, while `Add more filters` remains a fixed sibling next to pagination.
- [x] Keep the empty toolbar entry action outside the clause-list layout so it remains left aligned before any clauses exist.

### Staged command submission

[19/08/26]

- [x] Supersede immediate value application: selecting or entering a value completes a command-local clause but does not update applied table filters.
- [x] Keep every completed command-local clause in the input row while returning to column selection.
- [x] Submit the complete staged clause set and close the command only when Enter is pressed with no active column option.
- [x] Keep Enter available for selecting a column after explicit arrow-key navigation.
- [x] Treat `Pick a date…` as a value option and render Calendar inline as its own command step rather than opening a popup behind the modal.
- [x] Display Timestamp clause values as local `YYYY-MM-DD` summaries while retaining the complete numeric timestamp for query execution.
- [x] Omit stage placeholders whenever completed clause chips already provide input-row context.

### Continuous construction and direct removal

[19/08/26]

- [x] Supersede the no-remove-chip decision: every applied clause includes an independent 12px ghost close action.
- [x] Supersede the master-clear decision: Filter Builder has no bulk close action.
- [x] Keep a selected column visually unboxed while choosing an operator; use a compound chip only after the operator is selected.
- [x] Keep the selected clause in the command header while free-form value entry and value suggestions occupy the content area.
- [x] Derive scalar suggestions from distinct values in the loaded result window without restricting free-form entry to those values.
- [x] Applying a newly created clause starts another column-selection cycle in the same command dialog; applying an edit closes the dialog.
- [x] Timestamp comparison values may use relative threshold shortcuts or the existing Calendar; the selected operator remains authoritative.
- [x] Applied clauses, the Add filters action, and their scroll viewport form one shrinkable overflow region; pagination and toolbar actions remain fixed.

### Compound chip vocabulary and deletion

[19/08/26]

- [x] Supersede segmented applied clauses with one compound clause action containing column, compact operator, and value.
- [x] Supersede direct remove segments and immediate root-palette deletion with a two-step keyboard contract: focus the chip, then remove it.
- [x] Keep the master clear action as the pointer-accessible bulk removal path.
- [x] Show one compound draft chip only after column and operator are selected; clearing that chip returns to column selection.
- [x] Use plain English as the operator option label and the stable `tableFilterOperators` value as trailing code.
- [x] Keep mathematical and ASCII symbols as searchable aliases and use compact readable operators inside clause chips.

### Polished root and staged input

[18/08/26]

- [x] Treat `Filter table by column` as the toolbar root action rather than presenting a separate `Add filter` action.
- [x] Keep applied clause segment actions independent from the root action and master clear action.
- [x] Let an empty root palette Backspace remove the last applied clause without closing the palette.
- [x] Keep stage reversal available through Backspace and selected draft chips rather than footer buttons.
- [x] Apply typed values with Enter; the footer communicates keyboard behavior instead of containing pointer actions.
- [x] Normalize `=`, `==`, and `===` to equals, and `!=`, `!==`, and `<>` to does not equal.
- [x] Prefer ASCII comparison symbols in visible operator rows while accepting equivalent mathematical glyphs as aliases.

### Value completion and editing

[18/08/26]

- [x] Apply a complete list selection immediately and apply a valid typed value on Enter.
- [x] Retain an explicit Apply action for pointer users and never apply an incomplete draft.
- [x] Enter scalar `in` values through a multi-value token field with one schema-parsed value per token.
- [x] Accept line-separated pasted values for `in` without treating comma-delimited text as the only grammar.
- [x] Keep `in` hidden for Array, JSON, and Bytea columns until dedicated structured editors exist.
- [x] Repair a well-formed clause that references a removed column in place and preserve its clause order.
- [x] Reset operator and value whenever the selected column changes, even when the new column supports the current operator.

### Command scope and navigation

[18/08/26]

- [x] Build the reusable command palette foundation and toolbar-triggered filter flow in this implementation.
- [x] Keep the general application `Cmd+K` and `Ctrl+K` shell outside this implementation while reserving those shortcuts for it.
- [x] Filter commands with deterministic case-insensitive substring matching across labels, descriptions, and typed keywords.
- [x] Support both a visible Back action and Backspace navigation when the command query is empty.
- [x] For an incomplete clause, Backspace clears value, operator, and column one operation at a time.
- [x] For a complete clause, Backspace removes the entire clause.
- [x] Escape dismisses the complete draft rather than navigating between stages.

### Toolbar density and accessibility

[18/08/26]

- [x] Keep applied clauses on one stable-height toolbar row with bounded horizontal overflow.
- [x] Do not collapse clauses behind a summary control; keep Add filter reachable in the overflow region.
- [x] Keep every clause segment in the native document tab order instead of introducing roving focus.
- [x] Represent long and structured values with concise type-aware summaries, complete accessible names, and full values in the editing dialog rather than interactive tooltips.

### Toolbar and command composition

[18/08/26]

- [x] Place the applied Filter Builder presentation in the table toolbar's flexible content region.
- [x] Present each applied clause as column, operator, and value segments followed by a direct remove action.
- [x] Reopen one shared scoped command dialog at the stage represented by the activated segment.
- [x] Keep segment controls and remove as sibling native buttons inside a labelled group.
- [x] Remove clauses directly from the toolbar without confirmation because removal does not mutate inspected table data.
- [x] Use a modal command surface for staged selection while keeping applied clauses visible in the toolbar.
- [x] Keep the command foundation generic and compositional while application code owns Jazz schema, draft transitions, parsing, validation, and URL state.
- [x] Use Base UI behavior and do not add `cmdk` or Radix dependencies.
- [x] Reserve `Cmd+K` and `Ctrl+K` for the general application command palette.

### Clause editing

[18/08/26]

- [x] Enter column, operator, or value editing according to the clause segment that opened the command dialog.
- [x] Reset operator and value after a column change.
- [x] Reset value after an operator change.
- [x] Keep applied state unchanged until the edited draft is valid and explicitly applied.
- [x] Discard an incomplete edit when the command dialog is dismissed.
- [x] Preserve repeated predicates even when legacy or telemetry input supplies duplicate clause IDs.

### Filter state

[18/08/26]

- [x] Applied clauses remain URL-backed and combine as a flat `AND`.
- [x] Draft column, operator, raw value, completion stage, and validation issue remain transient UI state.
- [x] Filter changes reset pagination and clear table selection state.

## Open design decisions

None.

## Validation checklist

### Clause deletion cancellation

[19/08/26]

- [x] Verify Escape removes the danger selection state without removing a clause.
- [x] Run the focused Filter Builder tests and changed-file lint.

### Deletion emphasis and caret cadence

[19/08/26]

- [x] Verify the caret reaches both fully visible and fully hidden phases in a connected runtime table.
- [x] Verify the danger selection ring in both color schemes.
- [x] Run changed-file StyleX lint and affected-package validation.

### Clause-entry affordance and complete-clause focus

[19/08/26]

- [x] Cover complete-clause root selection, two-step removal, and focus restoration with focused tests.
- [x] Verify text-cursor and caret presentation in a connected runtime table.
- [x] Verify the complete clause-root outline includes the edit trigger and remove action in both color schemes.
- [x] Run affected package tests, typechecks, lint, and builds.

### Filtered-empty recovery and clause-list focus

[19/08/26]

- [x] Cover the filtered-empty Clear action and two-step viewport Backspace contract with focused tests.
- [x] Verify the Clear action placement and ghost treatment in both color schemes.
- [x] Verify pointer focus, first-Backspace selection, second-Backspace deletion, and focus restoration in a connected runtime table.
- [x] Run affected package tests, typechecks, lint, and builds.

### Bounded command and toolbar overflow

[19/08/26]

- [x] Cover hidden-scrollbar Command input-row ownership and fixed Add-action ownership with focused tests.
- [x] Verify command-chip scrolling remains bounded by `content-measure` in the browser documentation.
- [x] Verify applied clauses scroll independently while `Add more filters` remains visible at constrained toolbar widths in both color schemes.
- [x] Run affected package tests, typechecks, lint, and builds.

### Deferred command application and date step

[19/08/26]

- [x] Cover deferred application, final Enter submission, multi-clause staging, date-option highlighting, inline Calendar rendering, Timestamp summaries, and conditional placeholders with focused tests.
- [x] Cover opt-out command auto-highlighting and inline Calendar presentation in design-system tests.
- [x] Regenerate and check design-system prop metadata.
- [x] Run affected package tests, typechecks, lint, and builds.
- [x] Verify the `content-measure` Command width and inline Calendar presentation in both color schemes in the browser documentation.
- [ ] Verify staged chips, placeholder removal, final Enter submission, and inline date selection against a connected runtime table.

### Continuous clause construction polish

[19/08/26]

- [x] Cover per-clause removal, staged header presentation, content-area value entry, loaded value suggestions, repeated creation, timestamp Calendar entry, and overflow ownership with focused tests.
- [x] Run focused design-system and Filter Builder tests.
- [x] Run changed-file StyleX and application lint.
- [x] Regenerate and check design-system prop metadata.
- [x] Run affected package tests, typechecks, and builds.
- [x] Verify 12px ghost close actions and functional horizontal overflow in both color schemes and at constrained width in the browser documentation.
- [ ] Verify command stages, loaded values, repeated creation, and nested Calendar behavior against a connected runtime table.

### Compound clause and keyboard polish

[19/08/26]

- [x] Cover the compound clause API, 36px control semantic, staged active item, compound draft chip, and two-step Backspace behavior with focused tests.
- [x] Run focused `Command`, `DataGridFilterClause`, token, and Filter Builder tests.
- [x] Run affected-package typechecks.
- [x] Run changed-file StyleX and application lint without changed-file warnings.
- [x] Generate and check design-system prop metadata.
- [x] Run affected package tests, builds, and package lint.
- [x] Verify 36px command bars, 22px compound chips, empty-status collapse, bare-button hover, first-item highlighting, color schemes, and constrained layout in the browser documentation.
- [ ] Verify the integrated Filter Builder staged flow and two-step Backspace behavior against a connected runtime table.

### Filter root and palette polish

[18/08/26]

- [x] Cover root activation, master clear, repeated Backspace removal, staged chips, group labels, operator symbols, aliases, footer hints, and horizontal column metadata with focused tests.
- [x] Run focused `Command`, Filter Builder, draft, parsing, table-view, and query tests.
- [x] Run changed-file StyleX and application lint.
- [x] Run `@inspector/ds`, design-system documentation, and Inspector tests, typechecks, builds, and package lint.
- [x] Verify modal sizing, keyboard selection, Escape behavior, focus restoration, footer presentation, narrow layout, and accessible names in the Command browser documentation.
- [ ] Verify root activation, master clear, staged chips, glyph selection, and repeated Backspace removal against a connected runtime table.

### Complete Filter Builder

[18/08/26]

- [x] Run focused `Command` and `DataGridFilterClause` behavior tests.
- [x] Run `@inspector/ds` changed-file StyleX lint immediately after style edits.
- [x] Run `@inspector/ds` typecheck, build, lint, and package tests.
- [x] Generate and check design-system prop metadata.
- [x] Run design-system documentation tests, typecheck, lint, and build.
- [x] Run focused filter draft, parsing, routing, toolbar, query, prefetch, and table-view tests.
- [x] Run Inspector changed-file lint, typecheck, build, and package tests.
- [ ] Verify pointer creation, direct segment editing, removal, and cancellation in the browser.
- [ ] Verify keyboard creation, stage navigation, validation, dismissal, removal, and focus restoration in the browser.
- [ ] Verify screen-reader names and state announcements for the command dialog, clause groups, invalid clauses, value errors, and filtered result status.
- [ ] Verify toolbar overflow and command layout at narrow widths and browser zoom.
- [ ] Confirm the browser console remains free of errors and unexpected warnings.

### Filter foundation

[18/08/26]

- [x] Run affected table query, prefetch, and routing tests.
- [x] Run changed-file lint.
- [x] Run the Inspector package test pass.
- [x] Run the Inspector package typecheck and build.
