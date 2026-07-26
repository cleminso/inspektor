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

This checklist records the implemented Table Explorer selection and pane foundation and the open work identified through the
behavior discussion. Detailed acceptance rules remain in
[Table Explorer selection and pane behavior](./tableExplorerBehaviors.md). Product ownership and architecture remain in the
[design document](./design-document.md).

## Implemented foundation

### DataTable interaction API

[23/07/26]

- [x] Keep `DataTable` controlled through a TanStack `Table<TData>` instance.
- [x] Keep the internal `DataTable` context referentially stable across unrelated root renders without branding the public TanStack table prop.
- [x] Represent cell identity with stable row IDs and column IDs.
- [x] Expose controlled active-cell, selected-cell, active-column, and active-row state.
- [x] Report replace, additive, and range cell-selection intent without exposing raw pointer events as application state.
- [x] Separate single-click cell activation from explicit double-click cell opening.
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
- [x] Open one cell through double-click and replace a multi-cell selection with that target.
- [x] Double-click the open cell to close its pane, clear cell selection, and remove cell focus.
- [x] Double-click a different cell to retarget the cell pane.
- [x] Clear cell selection and close the cell pane when a column header receives focus.
- [ ] Click cell then right-click open context menu with action (copy, etc)

### Side-pane state and focus

[23/07/26]

- [x] Represent pane presentation explicitly as `closed`, `insert`, `rows`, or `cells`.
- [x] Keep selection state separate from pane presentation.
- [x] Give row-checkbox interaction, cell opening, and insertion explicit pane precedence.
- [x] Keep the row pane open when a cell in its focused row is clicked.
- [x] Focus the corresponding row-editor field when a cell in the focused row is clicked.
- [x] Focus the first available schema-derived control when a cell pane opens.
- [x] Keep cells in other rows from silently retargeting the focused row editor.
- [x] Close an open cell pane and activate the target column when its header is clicked.
- [x] Use progressive Escape dismissal for pane, cell selection, cell focus, and column focus.
- [x] Preserve checked rows when Escape dismisses a pane.
- [x] Remove the non-interactive resizable panel and panel-group focus outline.
- [x] Span the pane beside the action area, filter builder, table viewport, and footer.

### Schema-driven row forms and basic cell presentation

[23/07/26]

- [x] Build row fields from stored schema metadata rather than returned object keys.
- [x] Build table columns from stored schema metadata.
- [x] Render relation links when schema metadata provides a reference.
- [x] Keep synthetic IDs and unsupported binary mutations read-only.
- [x] Display query-relative row and column coordinates as orientation metadata rather than identity.
- [x] Format cell-inspector values for basic read-only inspection.
- [x] Pretty-serialize runtime JSON, array, and row values when creating editable drafts without rewriting user source while typing.
- [x] Preserve supplied nullable insert values instead of forcing every nullable field to NULL.
- [x] Seed empty structured Value mode with `{}` or `[]` while preserving an existing draft.
- [x] Keep structured editors mounted across NULL mode changes and connect visible errors to the editor control.
- [x] Expand one structured editor into the form's available pane height while preserving the fixed action footer and mounted sibling fields.

### Column and table behavior

[23/07/26]

- [x] Provide schema-aware initial column widths and constrained resizing.
- [x] Reset a resized column through resize-handle double-click.
- [x] Reorder data columns while keeping the checkbox column fixed.
- [x] Persist column order and visibility by connection, branch, schema hash, and table.
- [x] Highlight an activated column only after cell focus and selection are cleared.
- [x] Keep loaded-row extension from expanding an existing row or cell selection implicitly.
- [ ] Add header cell column type prefix/suffix
- [ ] Add a chevron button icon to open context menu that display column actions

### Documentation and regression coverage

[23/07/26]

- [x] Document the `DataTable` API through generated package-authoritative metadata.
- [x] Record row, cell, pane, column, lifecycle, visual, and bulk-operation behavior.
- [x] Cover DataTable click, double-click, modifier, checkbox, drag registration, and state attributes.
- [x] Cover individual row selection, row ranges, focus recovery, and pane precedence.
- [x] Cover additive cell selection, rectangular ranges, visibility changes, and column reorder.
- [x] Cover cell-pane focus, row-editor field focus, navigation restoration, header activation, and same-cell dismissal.
- [x] Validate package and application types, tests, generated props, and production builds.

## Open product work

### Cell rendering refactor

[23/07/26]

- [x] Define the compact table-cell representation for every supported schema type.
- [x] Define the expanded side-pane representation for every supported schema type.
- [ ] Extract shared schema-derived value renderers for table cells and the cell pane.
- [ ] Map Jazz schema metadata to constrained, Jazz-independent design-system value components in `apps/web`.
- [ ] Create dedicated design-system components for binary preview and inspection, timestamp presentation and date-time editing,
      structured-value preview and JSON viewing, and relation presentation and field actions.
- [x] Create a read-only structured tree component inspired by Geist JSON View with bounded expansion, keyboard tree navigation,
      selectable text, search highlighting, and accessible tree semantics.
- [x] Document and validate `JsonView` in `apps/design-system`.
- [x] Use the CodeMirror-backed `CodeEditor` for editable JSON, array, and row fields while keeping database NULL as an explicit application-owned value mode.
- [x] Provide enum labels and values in the item shape required by `Select` and keep relation links on the canonical typed table route.
- [x] Move editable structured type labels into the editor toolbar.
- [x] Render NULL structured values as compact read-only inputs without repeating NULL inside the field body.
- [ ] Keep primitive text, numeric, boolean, enum, copy, and null controls composed from existing design-system components unless a
      repeated semantic contract requires a dedicated component.
- [ ] Render text, numeric, enum, boolean, timestamp, structured, binary, nullable, and relation values through the shared
      renderers.
- [ ] Render enum arrays as repeatable `Select` rows that preserve order and duplicate values.
- [ ] Render reference arrays as repeatable relation fields with stored IDs and navigation actions.
- [ ] Preserve raw values for copying while displaying readable formatted values.
- [ ] Add readable previews and expanded inspection for long strings and structured values.
- [ ] Represent null distinctly from empty strings and unavailable values.
- [ ] Keep binary and unsupported values explicitly read-only.
- [ ] Replace indexed-object `Uint8Array` serialization with byte count only in table cells.
- [ ] Add a read-only binary input group with byte count and a `Copy as` menu for Hex, Base64, and Download raw actions.
- [ ] Render row IDs in full at their initial width and middle-truncate them only when the user narrows the column.
- [ ] Render the stored relation ID as the relation cell's primary value instead of replacing it with a resolved display label.
- [ ] Show target table, complete relation ID, resolved display value, and missing-target state in relation side-pane details.
- [ ] Keep relation navigation available in compact and expanded representations.
- [ ] Remove cell hover cards; expose complete values and alternate representations through the side pane and context commands.
- [ ] Format timestamp previews without fractional seconds in the browser timezone and show browser-local, UTC, relative, and raw
      epoch representations in the side pane.
- [ ] Show Jazz semantic type labels rather than SQL storage labels in side-pane fields.
- [ ] Keep editable field click and double-click behavior consistent with native text controls.
- [ ] Give the `NULL` suffix precedence over Copy when an editable input group cannot contain both.
- [ ] Define behavior for malformed values that do not match their schema metadata.
- [ ] Cover every supported representation with focused tests.

### Editable one-cell pane

[23/07/26]

- [ ] Replace the inspection-only affordance with an explicit editable state for writable fields.
- [ ] Keep IDs, binary values, generated values, and unsupported serializers read-only.
- [ ] Provide Save and Cancel actions for a writable cell.
- [ ] Submit a partial row patch containing only the represented field.
- [ ] Reuse schema-derived parsing and validation from the row editor.
- [ ] Keep validation errors attached to the represented field.
- [ ] Define dirty-state behavior when the user selects or opens another cell.
- [ ] Define dirty-state behavior when filter, sort, table, schema, or query scope changes.
- [ ] Define live-update reconciliation when the inspected value changes remotely during editing.
- [ ] Confirm that relation navigation does not discard an unsaved mutation silently.

### Row JSON representation

[24/07/26]

- [x] Add `Details` and `JSON` representations to the row side pane.
- [x] Switch row representations through a full-width, single-select `ToggleGroup`.
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

### Complete multi-cell pane

[23/07/26]

- [ ] Add a selected-cell context menu with an explicit `Open selection` command.
- [ ] Keep right-click inside the current selection from replacing it.
- [ ] Replace selection when right-click targets an unselected cell.
- [ ] Group opened cells by schema column in visible column order.
- [ ] Order cells inside each group by active query row order.
- [ ] Identify each cell by stable row ID with query position as supporting information.
- [ ] Render large selections incrementally instead of mounting every field control.
- [ ] Define pane behavior when cells are added to or removed from an already open clean selection.
- [ ] Define review and confirmation behavior for dirty multi-cell selections.

### Context menus and commands

[23/07/26]

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
- Dirty-pane reconciliation with navigation, selection changes, and live updates.
- Virtualized rendering for large represented result windows.
- Persistent bookmarked rows and developer reference workflows.

## Settled interaction decisions

[23/07/26]

- [x] A single click selects and focuses a cell without opening a pane.
- [x] Double-click opens a cell and focuses its schema-derived representation.
- [x] Double-clicking the same open cell closes the pane and clears that cell's selection and focus.
- [x] Double-clicking a different cell retargets the pane.
- [x] Command/Control-click toggles arbitrary cells.
- [x] Shift-click selects a rectangular visible cell range.
- [x] Table pointer gestures select cells rather than native text.
- [x] Text remains selectable inside side-pane field controls.
- [x] Clicking a header clears cell state, closes the cell pane, and activates the column.
- [x] Escape does not uncheck rows.
- [x] Individual row checkboxes remain the single-row clear control after pane dismissal.
- [x] The header checkbox remains the bulk row clear control.
- [x] Cell identity uses row IDs and column IDs rather than displayed coordinates.
- [x] Editing stays in the side pane rather than inline in table cells.
- [x] Row IDs render in full at the initial width and truncate only when the user narrows the column.
- [x] Relation cells show the stored relation ID as their primary value and keep click navigation to the target row.
- [x] Relation details may resolve a target display value, but that value does not replace the stored relation ID.
- [x] Binary grid cells show byte count only rather than complete, preview, or indexed-object serialization.
- [x] Binary clipboard actions state their encoding explicitly: Copy as hex or Copy as Base64.
- [x] PostgreSQL byte literals and JavaScript indexed-object serialization are not primary Jazz Inspector copy formats.
- [x] Transforms use the effective value renderer and remain schema modifiers rather than standalone value presentations.
- [x] Reusable type-specific presentation and editor components belong in the design system without depending on Jazz schema
      objects.
- [x] Cell values do not open hover cards; complete and alternate representations belong in the side pane.
- [x] Timestamp previews use the browser timezone without trying to infer the sync server's deployment timezone.
- [x] Side-pane field type labels use Jazz semantics rather than SQL storage labels.
- [x] The row pane provides editable `Details` and a read-only `JSON` tree.
- [x] The `NULL` suffix takes precedence over Copy when an editable field cannot display both actions.
- [x] Editable inputs preserve native single-click focus, double-click text selection, and clipboard behavior.

## Open design decisions

[23/07/26]

- [ ] Decide whether opening a writable cell enters edit state directly or begins in an inspect state with an explicit Edit action.
- [ ] Decide how unsaved cell changes are reviewed, saved, or discarded when selection changes.
- [ ] Decide whether a clean open cell pane follows additive selection or remains pinned to its original target.
- [ ] Decide the visible-page versus loaded-result scope of `Open visible column cells`.
- [ ] Decide the representation of non-rectangular multi-cell selections in copy and pane operations.
- [ ] Decide how a checked row outside the represented page remains visible and recoverable.
- [ ] Decide how query-backed operations expose exact totals when count queries are unavailable.
- [ ] Decide failure semantics for bulk writes when Jazz cannot provide an atomic transaction.
- [ ] Decide whether relation-link modifier clicks prioritize link navigation or cell-selection intent.

## Validation checklist

[24/07/26]

- [x] Every JsonView behavior change begins with a failing regression test.
- [x] `pnpm --filter @inspector/ds test`
- [x] `pnpm --filter @inspector/ds typecheck`
- [x] `pnpm --filter @inspector/ds build`
- [x] `pnpm --filter regarde.inspector test`
- [x] `pnpm --filter regarde.inspector typecheck`
- [x] `pnpm --filter regarde.inspector build`
- [x] `pnpm --filter inspector.design-system test`
- [x] `pnpm --filter inspector.design-system check:props`
- [x] `pnpm --filter inspector.design-system typecheck`
- [x] `pnpm --filter inspector.design-system build`
- [x] Changed JsonView files pass focused lint.
- [x] `git diff HEAD --check` passes.
- [ ] Browser verification covers pointer, keyboard, pane, selection, scrolling, and navigation behavior.
