# Table Explorer implementation checklist

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist records the implemented Table Explorer selection and complete-row pane foundation and the open work identified
through the behavior discussion. Detailed acceptance rules remain in
[Table Explorer selection and pane behavior](../tableExplorerBehaviors.md). Product ownership and architecture remain in the
[design document](../design-document.md).

## Implemented foundation

### DataGrid interaction API

[23/07/26]

- [x] Keep `DataGrid` controlled through a TanStack `Table<TData>` instance.
- [x] Keep the internal `DataGrid` context referentially stable across unrelated root renders without branding the public TanStack table prop.
- [x] Represent cell identity with stable row IDs and column IDs.
- [x] Expose controlled active-cell, selected-cell, active-column, and active-row state.
- [x] Report replace, additive, and range cell-selection intent without exposing raw pointer events as application state.
- [x] Keep single-click cell activation separate from double-click and do not expose cell opening until inline editor routing exists.
- [x] Register body cells only as column drop targets so dnd-kit does not consume normal cell clicks.
- [x] Preserve header dragging, resizing, sorting, checkbox controls, relation links, and context-menu hooks.
- [x] Disable native text selection on the table surface so pointer gestures select cells instead of glyphs.

### Row selection

[23/07/26]

- [x] Toggle an individual row through its checkbox or complete checkbox-cell hit area.
- [x] Add rows through independent checkbox clicks.
- [x] Select an inclusive visible row range through Shift-click.
- [x] Preserve Shift state when the checkbox-cell hit area dispatches the checkbox interaction.
- [x] Keep one focused row within the checked-row set.
- [x] Move row focus to the nearest checked row when the focused row is unchecked.
- [x] Open the complete-row editor when rows are checked.
- [x] Navigate checked rows in active query order.
- [x] Preserve checked rows when the row pane closes.
- [x] Allow each row to be unchecked through its own checkbox after pane dismissal.
- [x] Use the header checkbox as the bulk select and bulk clear control.
- [x] Restore a URL-backed edited row as a checked row when the table view is reconstructed.
- [x] Prevent Shift row-range selection from highlighting table text.

### Cell selection

[23/07/26]

- [x] Make an unmodified single click replace the cell selection and focus the target cell.
- [x] Keep single-click cell focus independent from side-pane presentation.
- [x] Toggle arbitrary cells through Command/Control-click additive selection.
- [x] Select a rectangular visible range from the anchor through Shift-click.
- [x] Preserve cell identity through column reorder.
- [x] Remove selected cells when their column is hidden.
- [x] Clear row and cell selections when filter, sort, table, schema, or query scope changes.
- [x] Render selected-cell background independently from the focused-cell border.
- [x] Keep double-click from opening an inspection-only cell pane while inline editor routing is unavailable.
- [x] Clear cell selection when a column header receives focus.
- [ ] Click cell then right-click open context menu with action (copy, etc)

### Side-pane state and focus

[23/07/26]

- [x] Represent pane presentation explicitly as `closed`, `insert`, or `rows`.
- [x] Keep selection state separate from pane presentation.
- [x] Give row-checkbox interaction and insertion explicit pane precedence.
- [x] Keep the row pane open when a cell in its focused row is clicked.
- [x] Focus the corresponding row-editor field when a cell in the focused row is clicked.
- [x] Keep cells in other rows from silently retargeting the focused row editor.
- [x] Activate a target column after clearing cell state.
- [x] Use progressive Escape dismissal for pane, cell selection, cell focus, and column focus.
- [x] Preserve checked rows when Escape dismisses a pane.
- [x] Remove the non-interactive resizable panel and panel-group focus outline.
- [x] Span the pane beside the action area, filter builder, table viewport, and footer.

### Schema-driven row forms and basic cell presentation

[29/07/26]

- [x] Build row fields from stored schema metadata rather than returned object keys.
- [x] Build table columns from stored schema metadata.
- [x] Render relation links when schema metadata provides a reference.
- [x] Keep synthetic IDs and unsupported binary mutations read-only.
- [x] Display query-relative row and column coordinates as orientation metadata rather than identity.
- [x] Pretty-serialize runtime JSON, array, and row values when creating editable drafts without rewriting user source while typing.
- [x] Preserve supplied nullable insert values instead of forcing every nullable field to NULL.
- [x] Seed empty structured Value mode with `{}` or `[]` while preserving an existing draft.
- [x] Keep structured editors mounted across NULL mode changes and connect visible errors to the editor control.
- [x] Expand one structured editor into the form's available pane height while preserving the fixed action footer and mounted sibling fields.
- [x] Keep row representation panels at the available pane height so editor collapse restores the form and its action footer remains at the bottom.
- [x] Keep multi-row navigation arrows compact and make primitive and synthetic ID field headers full-width with type labels aligned to the trailing bottom edge.
- [x] Use shared semantic type names across table headers and row fields, preserve acronym casing, and present the implicit row ID as `ID` with type `UUID`.

### Column and table behavior

[29/07/26]

- [x] Render accessible muted base-type column markers before names, with compact spacing and dedicated key and relation icons.
- [x] Add a quiet trailing chevron menu and direct header context menu for ascending sort, descending sort, and hide-column actions.
- [x] Activate a column before its chevron or context menu opens so selection does not wait for a bubbled header click.
- [x] List fixed and hideable data columns in a searchable action-bar Multi Select, keep checkbox selection open, and provide contextual `Check all` and `Only` actions.
- [x] Move columns left, right, to the start, or to the end through matching chevron and context-menu submenus.
- [x] Move a focused reorderable column with Shift plus Left or Right and show those shortcuts in the move submenu.
- [x] Expose each sortable header's current direction through `aria-sort` and toggle sorting with Enter when the header owns focus.
- [x] Open table actions from the complete table-list item, including its checkbox, label, and surrounding item area.
- [x] Keep resolved rows visible while a new sorting subscription resolves instead of replacing the body with loading content.
- [x] Show the sorting refresh state and disable incremental loading until refreshed rows resolve.
- [x] Keep the source header slot highlighted without duplicate content and render the complete marker-label composition in the drag overlay.
- [x] Keep the reserved source header background transparent while its drag preview is visible.
- [x] Restore persisted visibility before the first table render instead of flashing every column as visible.
- [x] Treat unavailable browser storage as optional when restoring and persisting column preferences.

[28/07/26]

- [x] Provide schema-aware initial column widths and constrained resizing.
- [x] Reset a resized column through resize-handle double-click.
- [x] Reorder data columns while keeping the checkbox column fixed.
- [x] Persist column order and visibility by connection, branch, schema hash, and table.

### Workspace tabs

[30/07/26]

- [x] Keep active workspace-item identity internal while filters and sorting remain URL-backed.
- [x] Update an active filtered table item in place instead of creating a new item for each route-search edit.
- [x] Reconcile completed route navigation through one atomic tab-state update without a pending-navigation ref gate.
- [x] Highlight an activated column only after cell focus and selection are cleared.
- [x] Keep loaded-row extension from expanding an existing row or cell selection implicitly.

[29/07/26]

- [x] Give the selection header and row cells the same full-width centered layout inside their fixed column.

### Compact grid value presentation

[29/07/26]

- [x] Classify schema values in an application-owned presentation model that preserves each raw value.
- [x] Distinguish `NULL`, empty strings, unavailable values, malformed values, and unsupported values.
- [x] Render full primitive and row-ID text with width-aware end truncation.
- [x] Right-align numbers and render booleans with a non-interactive indicator plus `true` or `false` text.
- [x] Format valid timestamps in the browser timezone without fractional seconds and preserve malformed raw timestamp states.
- [x] Render `Uint8Array` values as byte counts without indexed-object serialization.
- [x] Render stored scalar relation IDs as trailing-arrow links while preserving navigation and avoiding per-cell relation resolution.
- [x] Classify scalar enum values against schema variants when variant metadata is available.
- [x] Bound array, row, JSON, and unsupported previews without complete cell serialization.
- [x] Cover compact schema-value classification and rendering with focused regression tests.
- [x] Use one proportional compact-grid font across value types while retaining tabular numerals and right alignment for quantities and keeping expanded code surfaces monospace.

### Query referential stability

[26/07/26]

- [x] Pass a module-scope constant options object to inspector-only relation resolution so `useAll` subscription memoization holds
      across detail renders.
- [x] Parse URL filters in a dedicated memo keyed on the raw search string so unrelated search changes no longer rebuild the
      filters array identity consumed by the query builder and selection-scope key.

### Filter builder replacement

[29/07/26]

- [x] Remove the existing data-grid filter toggle and filter editor UI.
- [x] Preserve URL filter parsing, serialization, query translation, relation navigation, and filtered empty-state behavior for the replacement filter builder.
- [x] Keep the retired filter editor outside the base table-view import graph.
- [x] Replace the action-bar child inspection with a toolbar whose primary content fills the available width and whose actions stay grouped on the right.
- [x] Remove the empty toolbar from the schema view.

### Documentation and regression coverage

[23/07/26]

- [x] Document the `DataGrid` API through generated package-authoritative metadata.
- [x] Record row, cell, pane, column, lifecycle, visual, and bulk-operation behavior.
- [x] Cover DataGrid click, double-click, modifier, checkbox, drag registration, and state attributes.
- [x] Cover individual row selection, row ranges, focus recovery, and pane precedence.
- [x] Cover additive cell selection, rectangular ranges, visibility changes, and column reorder.
- [x] Cover row-editor field focus, navigation restoration, and header activation.
- [x] Validate every package and application test, generated-props check, typecheck, and production build without unrelated repository failures.

### Deferred row editor boundary

[30/07/26]

- [x] Keep the active edited row available through a dedicated `useTableRowById` query when filters or pagination remove it from the visible grid query.

[27/07/26]

- [x] Keep insert and edit form modules outside the static table-view import graph.
- [x] Load the selected row form only after the detail pane opens.
- [x] Keep row-field focus lookup in a dependency-light module shared by the table state and deferred forms.
- [x] Render a stable detail-pane loading state while the selected form resolves.
- [x] Cover the table-view import boundary with a regression test.

## Open product work

### Shared mutation draft and editing surfaces

[28/07/26]

- [x] Replace reconstructed-row updates with dirty-field patches over the latest live source row.
- [x] Keep raw input and parsed values in the shared per-row draft while pane orchestration retains field, row, and mutation errors.
- [x] Reflect live source changes in untouched fields while preserving dirty field overlays.
- [x] Remove a dirty overlay when its parsed value is semantically equal to the latest source value, including nested typed values.
- [x] Represent insert fields as omitted, explicit NULL, valid, or invalid.
- [x] Decode tagged Jazz defaults from stored schema metadata and omit untouched default-backed fields.
- [x] Present omitted fields with their formatted schema default and an in-group DEFAULT control.
- [x] Explain grouped DEFAULT and NULL modes with accessible tooltips and show schema defaults while editing existing rows.
- [x] Normalize descriptor-compatible Row tuples into named records before Jazz mutation conversion.
- [x] Make the existing pane editor consume the shared mutation layer before adding inline controls.
- [ ] Make pane and inline editing simultaneously available without a workspace mode preference.
- [ ] Start constrained inline editing for primitive scalar and enum cells through double-click or Enter.
- [ ] Use an expanded code editor in an anchored inline dialog for JSON, Array, and Row cells, with an expand action that opens the complete-row pane focused on the field.
- [ ] Open the complete-row pane focused on relation and binary fields.
- [ ] Use an inline calendar for timestamp fields when that control is implemented.
- [ ] Keep generated, unsupported, and otherwise read-only fields read-only in the grid.
- [x] Make pane Cancel explicitly discard the draft, closing insert mode directly and unchecking the focused edit row.
- [x] When Cancel leaves checked rows, focus the nearest checked row; close the pane when no checked rows remain.
- [x] Guard dirty row, query scope, route, and relation-navigation transitions with Save, Discard and continue, or remain on the
      active target.
- [x] Keep dirty-transition orchestration behind one lifecycle controller instead of coordinating draft, mutation, and route flags
      inside the table view state.
- [x] Return fields to a clean draft when restored to source NULL or insert DEFAULT while preserving inactive value text, and ignore
      delayed editor changes outside value mode.
- [x] Resolve the draft lifecycle before continuing a guarded navigation so Discard and continue completes in one action.
- [x] Preserve drafts after update, insert, and delete failures and expose accessible mutation errors.
- [x] Reject required read-only binary inserts instead of synthesizing empty byte values.
- [ ] Add inline cell editing as a second consumer without adding cell hover cards.
- [x] Remove the inspection-only cell pane, its state orchestration, and its dedicated field presentation.
- [ ] Close a clean row pane before starting inline editing on a double-clicked cell.
- [ ] Invoke the mutation draft guard with `The current row has staged changes.` when a dirty row pane blocks cell activation.
- [x] Add direct contract tests around the generic Jazz mutation adapter.
- [ ] Add direct contract tests around the generic Jazz query adapter.

### Cell rendering refactor

[28/07/26]

- [x] Define the compact table-cell representation for every supported schema type.
- [x] Define the expanded side-pane representation for every supported schema type.
- [ ] Add an application-owned read-presentation adapter shared by compact cells and complete-row details without coupling mutation
      controls to compact rendering.
- [x] Map Jazz schema metadata to constrained, Jazz-independent design-system value components in `apps/web`.
- [x] Create dedicated design-system components for binary preview and inspection, timestamp presentation, structured-value
      preview, and relation presentation and field actions.
- [x] Add schema-derived browser-local date-time editing for valid timestamp fields while preserving malformed raw text.
- [x] Create a read-only structured tree component inspired by Geist JSON View with bounded expansion, keyboard tree navigation,
      selectable text, search highlighting, and accessible tree semantics.
- [x] Document and validate `JsonView` in `apps/design-system`.
- [x] Use the CodeMirror-backed `CodeEditor` for editable JSON, array, and row fields while keeping database NULL as an explicit application-owned value mode.
- [x] Provide enum labels and values in the item shape required by `Select` and keep relation links on the canonical typed table route.
- [x] Move editable structured type labels into the editor toolbar.
- [x] Represent structured Value, Default, and NULL as exclusive field-header modes, with compact typed presentations for inactive values.
- [x] Keep primitive text, numeric, boolean, enum, copy, and null controls composed from existing design-system components unless a
      repeated semantic contract requires a dedicated component.
- [ ] Render complete-row details through the dedicated timestamp, structured, binary, and relation detail components where their
      product contracts require expanded inspection.
- [ ] Render enum arrays as repeatable `Select` rows that preserve order and duplicate values.
- [ ] Render reference arrays as repeatable relation fields with stored IDs and navigation actions.
- [x] Preserve raw values in the presentation model for copy actions while displaying readable formatted values.
- [ ] Add an auto-growing complete-row presentation for long strings while preserving native selection and editing behavior.
- [x] Represent null distinctly from empty strings and unavailable values.
- [x] Keep binary and unsupported values explicitly read-only.
- [x] Normalize binary runtime values nested in read-only structured fields instead of exposing indexed-object JSON.
- [x] Disable nullable mutation value controls while NULL and preserve drafts across NULL mode changes.
- [x] Replace indexed-object `Uint8Array` serialization with byte count only in table cells.
- [x] Add a read-only binary input group with byte count and a `Copy as` menu for Hex, Base64, and Download raw actions.
- [x] Reject binary text encoding above 1 MiB before allocating Hex or Base64 output.
- [x] Copy binary download views into an `ArrayBuffer` so Blob construction preserves only the selected bytes and satisfies the DOM boundary.
- [x] Render complete row-ID text and use width-aware middle truncation only when it overflows the column.
- [x] Render the stored relation ID as the relation cell's primary value instead of replacing it with a resolved display label.
- [x] Resolve relation targets only in complete-row fields rather than mounting a Jazz query for every visible relation cell.
- [ ] Resolve whether relation details expose target metadata and missing-target state, then integrate the settled component contract
      into the complete-row pane.
- [x] Keep relation navigation available in compact and expanded representations.
- [x] Remove cell hover cards and expose complete values and alternate representations through the complete-row pane.
- [ ] Add browser-local, UTC, relative, and raw epoch representations to complete-row timestamp details.
- [x] Show Jazz semantic type labels rather than SQL storage labels in side-pane fields.
- [ ] Keep editable field click and double-click behavior consistent with native text controls.
- [ ] Give the `NULL` suffix precedence over Copy when an editable input group cannot contain both.
- [ ] Render unavailable, unsupported, and malformed values with explicit expectation, reason, and bounded raw fallback in
      complete-row details.
- [ ] Cover every supported representation with focused tests.
- [x] Remove the dedicated read-only cell field while preserving schema-field presentation utilities used by row mutation fields.
- [x] Pass only object or array fallbacks to `JsonView`; keep scalar structured values in the code representation.

### Inline cell editing and row-pane routing

[23/07/26]

- [x] Remove the inspection-only cell pane before adding inline editors and complete-row pane routing.
- [ ] Keep IDs, generated values, and unsupported serializers read-only in the grid.
- [ ] Provide Save and Cancel actions for an inline writable cell.
- [ ] Submit a partial row patch containing only the represented field.
- [ ] Reuse schema-derived parsing and validation from the row editor.
- [ ] Keep validation errors attached to the represented field.
- [ ] Give JSON, Array, and Row cells an expanded code editor in an anchored inline dialog with an expand action to the corresponding row field.
- [ ] Route relation and binary cells to the corresponding field in the complete-row pane.
- [ ] Add the inline timestamp calendar without changing timestamp conversion semantics.
- [ ] Define dirty-state behavior when the user selects or opens another cell.
- [ ] Define dirty-state behavior when filter, sort, table, schema, or query scope changes.
- [ ] Define live-update reconciliation when the edited value changes remotely.
- [ ] Confirm that relation navigation does not discard an unsaved mutation silently.

### Row JSON representation

[24/07/26]

- [x] Add `Details` and `JSON` representations to the row side pane.
- [x] Switch row representations through a controlled, single-selection, full-width `ToggleGroup`.
- [x] Keep `Details` as the schema-derived editing surface.
- [x] Keep `JSON` permanently read-only; all row mutation remains in `Details`.
- [x] Normalize Jazz row values into a bounded structured presentation model without pre-stringifying ordinary objects or arrays.
- [x] Represent binary values explicitly instead of serializing `Uint8Array` as indexed objects.
- [x] Expand top-level row fields initially and keep deeper objects and arrays collapsible.
- [x] Add keyboard tree navigation, selectable text, search highlighting, and whole-row Copy JSON.
- [x] Add depth, node-count, string-length, and child-count budgets with explicit continuation and unsupported-value nodes.
- [x] Keep search controls, copy serialization, editing, validation, permissions, and mutation behavior in `apps/web`.
- [x] Defer whole-row normalization and copy serialization until the `JSON` representation is mounted.
- [x] Keep read-only structured field normalization stable across unrelated form edits.
- [x] Avoid native label associations when the read-only structured field is represented by an independently labelled tree.
- [x] Do not expose arbitrary renderers, styling slots, Jazz schema objects, or an `editable` boolean from the design-system viewer.
- [x] Track the reusable component design and implementation in [JsonView design](../specs/json-view/design.md).
- [x] Complete the approved [JsonView implementation plan](../specs/json-view/tasks.md) through cross-package automated
      verification.

### Complete multi-cell operations

[23/07/26]

- [ ] Add a selected-cell context menu with explicit copy and supported mutation commands.
- [ ] Keep right-click inside the current selection from replacing it.
- [ ] Replace selection when right-click targets an unselected cell.
- [ ] Group bulk-operation targets by schema column in visible column order.
- [ ] Order targets inside each group by active query row order.
- [ ] Identify each target by stable row ID with query position as supporting information.
- [ ] Render large operation reviews incrementally instead of mounting every field control.
- [ ] Define review and confirmation behavior for dirty multi-cell operations.

### Context menus and commands

[28/07/26]

- [ ] Implement cell commands for copying a cell value, copying a row, filtering by value, editing a row, and opening selected
      cells.
- [ ] Implement row context commands derived from row state and schema capabilities.
- [ ] Implement column-header context commands with explicit visible-result and matching-query scope.
- [ ] Complete `Filter by value` through the generic filter builder with `eq` as the initial operator.
- [ ] Keep context-menu availability schema-driven and generic across inspected applications.

### Keyboard data-grid behavior

[23/07/26]

- [ ] Implement directional cell navigation.
- [ ] Implement Home, End, page movement, and row-boundary behavior.
- [ ] Implement Enter as the keyboard equivalent of opening a focused cell.
- [ ] Implement Space and Shift+Space for focused row-checkbox selection.
- [ ] Implement keyboard additive and range cell selection.
- [ ] Define keyboard focus restoration after pane dismissal.
- [ ] Provide copy shortcuts for focused and selected cells.
- [ ] Verify screen-reader announcements for focused cell, selection size, row position, and pane target.

### Column selection and bulk editing

[23/07/26]

- [ ] Add explicit commands for opening visible column cells.
- [ ] Keep normal header click as column focus rather than implicit whole-column selection.
- [ ] Add query-backed commands for editing a column across matching rows.
- [ ] State operation scope in every command and confirmation surface.
- [ ] Provide a same-column editor with an `Apply to N selected cells` action.
- [ ] Represent each write as a partial row patch for the selected field.
- [ ] Define progress, cancellation, partial failure, retry, and recovery behavior.
- [ ] Verify Jazz transaction or batching capabilities before promising atomic writes.

### Matrix copy and paste

[23/07/26]

- [ ] Define serialization for scalar, null, enum, boolean, structured, relation, timestamp, and binary values.
- [ ] Copy rectangular selections in a tabular clipboard format.
- [ ] Define behavior for non-rectangular additive selections.
- [ ] Parse pasted matrices through schema-derived field parsers.
- [ ] Preview validation failures before mutation.
- [ ] Prevent paste from writing read-only or unsupported fields.
- [ ] Define partial-write and atomic-write semantics.

### Query scope and pagination

[23/07/26]

- [ ] Complete page-windowed browsing and explicit page identity in selection lifecycle rules.
- [ ] Distinguish visible rows, loaded rows, page rows, and every query match in operation labels.
- [ ] Add count-query support before presenting an exact matching-row total.
- [ ] Keep query position informational because live filtering and sorting can change it.
- [ ] Define selection behavior when rows leave the represented result because of live updates.

### Visual and accessibility review

[23/07/26]

- [ ] Review selected row, focused row, selected cell, focused cell, active column, dirty state, validation state, and live-update
      state as distinct semantic treatments.
- [ ] Verify contrast for selected and focused states across supported themes.
- [ ] Verify that removing panel outlines does not remove the resizable handle's keyboard focus indicator.
- [ ] Add keyboard-visible focus without restoring pointer-only browser outlines.
- [ ] Verify high zoom, narrow panes, horizontal scrolling, long values, and hidden-column behavior.
- [ ] Review relation links and other interactive cell descendants under additive and range selection modifiers.

## Work outside the foundation scope

[23/07/26]

These items were identified in the behavior design but intentionally excluded from the implemented foundation:

- Editable single-cell mutation, validation, confirmation, and save behavior.
- Opening and rendering complete multi-cell selections.
- Column-selection commands and query-backed bulk operations.
- Matrix copy and paste.
- Complete keyboard grid navigation.
- Transactional or batched mutation guarantees.
- Dirty-state reconciliation for inline editing, pagination changes, hidden dirty columns, and multi-cell operations.
- Virtualized rendering for large represented result windows.
- Persistent bookmarked rows and developer reference workflows.

## Settled interaction decisions

[23/07/26]

Checked markers in this section mean the interaction decision is settled; they do not mean the behavior is implemented.

- [x] A single click selects and focuses a cell without opening a pane.
- [x] Double-click or Enter starts schema-appropriate inline editing for supported cells.
- [x] JSON, Array, and Row cells use an expanded code editor in an anchored inline dialog whose expand action opens the complete-row pane focused on the field.
- [x] Relation and binary cells open the complete-row pane focused on their field.
- [x] Timestamp cells use an inline calendar when that control is implemented.
- [x] Generated, unsupported, and otherwise read-only cells remain read-only in the grid.
- [x] Command/Control-click toggles arbitrary cells.
- [x] Shift-click selects a rectangular visible cell range.
- [x] Table pointer gestures select cells rather than native text.
- [x] Text remains selectable inside side-pane field controls.
- [x] Clicking a header clears cell state and activates the column.
- [x] Escape does not uncheck rows.
- [x] Individual row checkboxes remain the single-row clear control after pane dismissal.
- [x] The header checkbox remains the bulk row clear control.
- [x] Cell identity uses row IDs and column IDs rather than displayed coordinates.
- [x] Keep pane and inline editing simultaneously available without a workspace mode preference.
- [x] Keep full inspection in the complete-row pane without adding a separate cell-inspection pane or hover cards.
- [x] Close a clean row pane before starting inline editing on a double-clicked cell.
- [x] Guard a dirty row-pane transition with Save and continue, Discard and continue, or Keep editing.
- [x] Keep mutation parsing, validation, dirty tracking, live reconciliation, save, and discard independent from the editing surface.
- [x] Distinguish pane dismissal, which preserves clean selection, from Cancel, which discards the focused draft and unchecks its row.
- [x] Row IDs render as continuous text and use width-aware end truncation when the rendered value overflows.
- [x] Relation cells show the stored relation ID as their primary value and navigate to the target table's default unfiltered tab.
- [x] Relation details may resolve a target display value, but that value does not replace the stored relation ID.
- [x] Binary grid cells show byte count only rather than complete, preview, or indexed-object serialization.
- [x] Binary clipboard actions state their encoding explicitly: Copy as hex or Copy as Base64.
- [x] PostgreSQL byte literals and JavaScript indexed-object serialization are not primary Jazz Inspector copy formats.
- [x] Transforms use the effective value renderer and remain schema modifiers rather than standalone value presentations.
- [x] Reusable type-specific presentation and editor components belong in the design system without depending on Jazz schema
      objects.
- [x] Cell values do not open hover cards; complete and alternate representations belong in the complete-row pane.
- [x] Timestamp previews use the browser timezone without trying to infer the sync server's deployment timezone.
- [x] Side-pane field type labels should use Jazz semantics rather than SQL storage labels.
- [x] Keep column reordering on the existing table-header drag interaction rather than duplicating drag handles in the visibility menu.
- [x] Use the visibility menu for checkbox multiselect and a show-all convenience action.
- [x] The row pane provides editable `Details` and a read-only `JSON` tree.
- [x] The `NULL` suffix takes precedence over Copy when an editable field cannot display both actions.
- [x] Editable inputs preserve native single-click focus, double-click text selection, and clipboard behavior.

## Open design decisions

[23/07/26]

- [ ] Decide how unsaved cell changes are reviewed, saved, or discarded when selection changes.
- [ ] Decide the visible-page versus loaded-result scope of column-selection operations.
- [ ] Decide the representation of non-rectangular multi-cell selections in copy and bulk operations.
- [ ] Decide how a checked row outside the represented page remains visible and recoverable.
- [ ] Decide how query-backed operations expose exact totals when count queries are unavailable.
- [ ] Decide failure semantics for bulk writes when Jazz cannot provide an atomic transaction.
- [ ] Decide whether relation-link modifier clicks prioritize link navigation or cell-selection intent.
- [ ] Define a safe inspected-application metadata channel before exposing transform markers; stored WASM schema metadata does not contain transforms.

## Validation checklist

[28/07/26]

- [x] `pnpm --filter @inspector/ds test`
- [x] `pnpm --filter @inspector/ds typecheck`
- [x] `pnpm --filter @inspector/ds build`
- [x] `pnpm --filter regarde.inspector test`
- [x] `pnpm --filter regarde.inspector typecheck`
- [x] `pnpm --filter regarde.inspector build`
- [ ] `pnpm --filter inspector.design-system test`
- [x] `pnpm --filter inspector.design-system check:props`
- [x] `pnpm --filter inspector.design-system typecheck`
- [x] `pnpm --filter inspector.design-system build`
- [x] Changed value-presentation files pass focused lint.
- [x] Changed value-presentation and binary files pass focused tests.
- [x] `git diff HEAD --check` passes.
- [ ] Browser verification covers pointer, keyboard, pane, selection, scrolling, and navigation behavior.
