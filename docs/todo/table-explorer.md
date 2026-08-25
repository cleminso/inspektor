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

[25/08/26]

- [x] Keep query ownership, cache-key, preservation-boundary, and active-draft invariants documented beside the code that enforces them.

[25/08/26]

- [x] Reuse one selection-scope shape across render and route handlers and remove the obsolete guarded-transition wrapper.
- [x] Keep fulfilled query-window state reactive so live row-count changes can immediately stop invalid page projection.

[25/08/26]

- [x] Use one connection, branch, and schema workspace identity for tabs, pins, table preferences, mutation state, provider remounts, and table view resets.

[25/08/26]

- [x] Preserve workspace-bar geometry while hiding unresolved tab controls during connection entry.
- [x] Keep the reserved table-list area blank while schema table names load instead of presenting skeleton rows.

[25/08/26]

- [x] Keep one centered connection-entry status until the runtime schema is ready and the initial table route is selected.

[25/08/26]

- [x] Use the `inspektor-` localStorage namespace for table preferences, pins, and workspace tabs.

[25/08/26]

- [x] Supersede persisted schema projections with verified Jazz schema loading as the only runtime schema source.
- [x] Persist column order and hidden column IDs together in one versioned per-table preference record.
- [x] Persist pinned tables and tabs with recent views in independent versioned records per workspace instead of rewriting shared multi-workspace objects.

[24/08/26]

- [x] Mount a route-reconciled table without forcing an intermediate opening frame.
- [x] Keep the `Opening table` status for route and active-tab mismatches and center it within the workspace panel.
- [x] Let the table-owned toolbar remain visible while the Data Grid presents its centered row-loading state.

[22/08/26]

- [x] Use the table name alone for schema workspace tabs while retaining the schema-specific icon and workspace identity.

[22/08/26]

- [x] Present runtime initialization failures with a `Try again` action while keeping raw errors out of the table workspace.
- [x] Reset schema loading and the Jazz client boundary through one explicit retry action without unmounting the route-owned workspace.
- [x] Keep runtime recovery visible when schema loading cannot select an initial table.

[22/08/26]

- [x] Toggle the insert-row pane with `Alt+I` from the active table view and expose the shortcut in the toolbar Insert row tooltip.
- [x] Register Insert row as a table-scoped command-palette command, disabled when the editor cannot open.

[21/08/26]

- [x] Present binary clipboard encodings as direct `Copy as Hex` and `Copy as Base64` actions instead of duplicating the default format across `Copy` and a submenu.

[21/08/26]

- [x] Describe clipboard confirmation as `Cell value copied`, including the selected binary format when relevant.
- [x] Deduplicate repeated copy notifications by table cell identity while keeping notifications for different cells separate.

[21/08/26]

- [x] Open one semantic cell context menu from a direct right-click without requiring prior selection.
- [x] Offer Edit only for writable cells and route it through the existing inline and complete-row editor logic.
- [x] Build Filter by clauses from the displayed cell value, including staged overlays, through the shared Filter Builder parser.
- [x] Copy the focused cell with `Mod+C` and expose matching Copy actions in the cell context menu.
- [x] Copy binary cells as Hex or Base64 while keeping Hex as the default keyboard-copy representation.
- [x] Render a success toast after keyboard, Copy, and Copy as clipboard writes.

[21/08/26]

- [x] Keep column-order and column-width reset actions visible in both header menus while disabling each action when its reset would not change the grid.

[21/08/26]

- [x] Restore schema-definition column order from both header action menus through TanStack Table's column-order reset API.
- [x] Place the edit-pane `Close` action in the footer after the row-deletion action instead of in the pane header.

[21/08/26]

- [x] Keep complete table-list names in normal text flow and apply native end truncation without replacing the visible value from resize measurements.
- [x] Enable the complete-name tooltip only when the rendered label's scroll width exceeds its available width.

[21/08/26]

- [x] Present an unfiltered empty table with centered `This table is empty` copy and a contextual `Insert row` action.
- [x] Keep the empty-table prompt centered in the visible Data Grid viewport when wide columns enable horizontal scrolling.
- [x] Announce unfiltered emptiness through the Data Grid's stable polite status region.

[19/08/26]

- [x] Highlight a grid row in a green success tint with an inline-start success bar for a short hold-then-fade window after its
      insert succeeds.
- [x] Keep the highlight ephemeral: the DataGrid `recentlyInserted` row status owns a 1200ms hold-then-fade animation and the table
      view clears the status when that feedback completes.
- [x] Keep staged deletion authoritative over the recently inserted highlight when both apply to one row.
- [x] Highlight cells whose staged updates applied with the ephemeral staged-change (yellow) tint: the apply hook reports the applied
      field set per row, the table view projects a `recentlyApplied` cell status, and each apply expires after 1200ms.
      Green stays reserved for inserted rows.
- [x] Release the applied-cell tint as one continuous 1200ms ease-out drain starting when the staged treatment is withdrawn, so the
      staged border removal and the background release read as a single event instead of a snap followed by a later fade.
- [x] Keep a staged update authoritative over the recently applied cell highlight when both apply to one cell.
- [x] Drop the redundant `N updates staged` segment from the mutation dock trigger label; the count prefix already communicates
      staged size, and `Applying changes` and `Needs attention` stand alone.

[17/08/26]

- [x] Keep the page-level `Undo2` header action visually neutral when all loaded rows are staged for deletion.

[17/08/26]

- [x] Mark checked rows with the selection-blue inline-start marker used by the grid selection treatment.

[17/08/26]

- [x] Replace the page selection checkbox with one `Undo2` action when every loaded row is staged for deletion.
- [x] Undo all loaded-row deletions from the header action and restore focus to the page checkbox.

[17/08/26]

- [x] Keep tab close-policy commands referentially stable while scoped draft state changes.
- [x] Preserve staged changes without confirmation when another view of the same table remains open.

[17/08/26]

- [x] Show the visible-column toolbar trigger with the shared pressed-button treatment while any grid column is hidden.

[16/08/26]

- [x] Replace a staged-deletion row's checkbox with an `Undo2` icon action and `Undo deletion` tooltip.
- [x] Restore focus to the row checkbox after undoing from the grid.
- [x] Exclude staged-deletion cells from cell selection and active-column emphasis so their danger treatment remains visible.

[16/08/26]

- [x] Supersede the recoverable staged-deletion pane with disabled row selection.
- [x] Disable each staged-deletion row's checkbox through TanStack row-selection eligibility.
- [x] Keep staged-deletion rows visible with the semantic danger treatment until Apply, removal, or discard.

[16/08/26]

- [x] Replace editors with a recoverable deletion state when a staged-deletion row is reopened.
- [x] Prevent staged-deletion rows from accepting pane or inline updates until deletion is undone.
- [x] Mark staged-deletion grid rows with a semantic danger treatment.

[15/08/26]

- [x] Keep one contextual deletion action in the complete-row pane: `Delete row` for one checked row and `Delete N checked rows`
  for several checked rows.
- [x] Confirm deletion in the pane, then close it and uncheck the affected rows after staging.

[15/08/26]

- [x] Prevent the flexible summary text column from stretching the content-sized Review changes trigger.

[15/08/26]

- [x] Keep Review changes neutral and content-sized while limiting accent open-state text to the dock trigger.

[15/08/26]

- [x] Keep the Review changes trigger content-sized while retaining the shared expanded-trigger treatment.
- [x] Explicitly render semantic affected-row list items as flex rows so their remove action stays on the same line.

[15/08/26]

- [x] Align affected-row review entries with their accordion triggers and keep row details in one flexible inline group.
- [x] Let the affected-row review fit short content while bounding and scrolling longer reviews.
- [x] Align the Review changes summary trigger label to the start of its available row.

[12/08/26]

- [x] Show the active row's one-based page position and the selected data column's one-based visible position in the edit-pane title.
- [x] Show column position zero in the edit-pane title when no grid cell is selected.
- [x] Omit edit-pane coordinates when the active row is outside the loaded page.
- [x] Keep Insert more enabled across repeated inserts and reset it when insert mode closes.

[12/08/26]

- [x] Separate schema and permissions with an explicit vertical divider and keep each JSON tree in its own bounded scroll viewport.
- [x] Place each JSON scroll owner in a bounded remaining-height body beneath its fixed document header, with content padding inside the viewport.
- [x] Keep each JSON content wrapper intrinsic so expanded trees overflow their viewport, and stretch the divider across the shared panel height.
- [x] Expand schema to depth four and permissions to depth three by default.
- [x] Replace raw table schema and permissions text with independently searchable, scrollable JSON trees.
- [x] Group search, safe complete expansion, and copy actions in each schema document header.
- [x] Reset schema document search and expansion state when table identity changes.

[12/08/26]

- [x] Keep unavailable Tables navigation controls focusable so their authored tooltips remain discoverable.
- [x] Render Back and Forward as independent buttons so each keeps its selected radius.

[12/08/26]

- [x] Replace the active route when opening, closing, or retargeting the row editor so Tables Back navigates directly to the preceding route.

[12/08/26]

- [x] Limit Tables history to route navigation and keep cell selection local to the active table view.
- [x] Keep Tables history in memory rather than restoring transient navigation and selection state across reloads.
- [x] Remove selection-history persistence, validation, replay, and subscription infrastructure.

[12/08/26]

- [x] Render Tables history controls as direct design-system Button Group members so Button radius and grouped-edge styles apply to the interactive elements.
- [x] Reconcile native browser back and forward navigation against existing Tables history entries instead of resetting the Tables history stack.

[12/08/26]

- [x] Size the row-editor header and action footers from shared compact padding instead of a fixed panel-bar height.
- [x] Align row-editor header, representation control, fields, and footer content to the same pane inset.

[11/08/26]

- [x] Render table-list accordion sections as level-two headings beneath the Tables page heading.

[11/08/26]

- [x] Share one table-list context menu per section while retaining visible per-row action menus.
- [x] Defer offscreen rendering above 50 schema-table rows while preserving complete navigation and selection semantics.

[11/08/26]

- [x] Keep row-editor text updates urgent while deferring semantic dirty-state parsing and preserving immediate navigation protection.
- [x] Announce row refresh, refresh completion, filtered emptiness, and query failures without replacing settled rows.
- [x] Mark branch and schema identifiers as non-translatable technical content.

[10/08/26]

- [x] Keep a broader fulfilled Jazz row query active while route pagination projects a fully covered smaller page from its rows.
- [x] Start a bounded page query when the active loaded window does not contain the complete page and pagination probe.
- [x] Reuse a final loaded window for larger pages only when its short result proves that no additional rows exist.

[10/08/26]

- [x] Keep schema navigation and insert drafting available from cached schema metadata while verified runtime mutations remain unavailable.
- [x] Limit runtime-readiness disabling to the insert form submission control and begin form preloading from schema readiness.
- [x] Restore one shared preload and render request per deferred row form so a completed preload renders synchronously.
- [x] Keep speculative import failures retryable and render-consumed failures available to an error boundary with a component-level loader API.
- [x] Keep cached schema metadata available for structural rendering while withholding the Jazz client from queries until the selected stored schema is verified.
- [x] Prevent a cached schema from initializing one Jazz `Db` before a different network schema reaches the same client.

[08/08/26]

- [x] Keep non-suspense Jazz query renders side-effect free by computing and peeking keys during render while registering cache entries only from React's subscription lifecycle.
- [x] Observe Jazz query resets so stale fulfilled snapshots return to pending.
- [x] Preserve only committed fulfilled row results during compatible same-manager refreshes.

[07/08/26]

- [x] Persist stored schemas in Jazz's JSON wire representation without a cache reviver that can reinterpret unknown fields.

[07/08/26]

- [x] Scope preserved query rows to the Jazz manager that produced them so runtime replacement restores an explicit row-loading state.
- [x] Read runtime client and schema once in the table-view state boundary and pass them to internal query and mutation hooks.
- [x] Cache decoded stored-schema metadata in memory after its first validated browser-storage read.
- [x] Keep schema and permissions serialization behind independent memoization boundaries.

[07/08/26]

- [x] Keep the row-editor pane visible while its deferred form module or requested live row resolves, with explicit `Loading editor` and `Loading row` status content.
- [x] Render non-native row-editor field labels and the Insert more switch with elements that match their Base UI native contracts.
- [x] Run the Inspector client through Jazz's registry-backed React lifecycle so rapid table navigation and development remounts cannot create overlapping WASM runtimes.

[07/08/26]

- [x] Restore the stored WASM schema from a versioned connection-and-schema cache so table navigation and grid columns remain stable across a document reload.
- [x] Preserve Jazz `Uint8Array` schema values through an explicit cache codec and treat unavailable browser storage as an optional optimization.
- [x] Subscribe table navigation, columns, queries, mutations, schema views, and prefetch to granular read-only runtime projections.
- [x] Keep live rows uncached so reconnecting a table remains an explicit row-body loading state.

[07/08/26]

- [x] Keep the selected table toolbar and Data Grid mounted while the Jazz client and stored schema resolve, with loading limited to the row body.
- [x] Keep unresolved schema navigation distinct from a resolved schema containing no tables so the dock never flashes a false empty state.
- [x] Read table queries and mutations from the app-owned runtime client instead of inserting a Jazz React provider that remounts the workspace.

[07/08/26]

- [x] Remove the pristine empty-table sentence while retaining the viewport-independent toolbar Insert row action.
- [x] Keep filtered-empty and row-query failure content distinct from pristine empty data.
- [x] Present schema loading and runtime failure inside the selected-table workspace instead of returning a blank panel.

[07/08/26]

- [x] Keep schema-tab creation route-owned instead of reconciling tab state before navigation and again after navigation.
- [x] Preserve tab-state identity when schema sanitization makes no semantic change so context consumers and persistence remain idle.
- [x] Use the workspace provider's scope key as the single reset boundary for Table Explorer state.
- [x] Document the schema sanitizer's reference-preserving no-op contract at its public function boundary.

[06/08/26]

- [x] Use tabular numerals for the page label so equal-length page numbers retain one width.
- [x] Remove row-ID resize lag and incomplete initial rendering by replacing measured middle truncation with CSS clipping.

[06/08/26]

- [x] Keep toolbar DOM order as content, pagination, then actions.
- [x] Keep a 48-row virtual overscan and remove mocked virtualizer tests that only verified the mock implementation.
- [x] Restrict virtual rendering to `DataGrid.Content`; custom `DataGrid.Body` children always render directly.
- [x] Share speculative table-row subscription ownership between table-list and tab intent surfaces.
- [x] Add deterministic ID tie-breaking, reject unsafe page values, and return empty out-of-range pages to page one.
- [x] Stop preserving preceding rows when a replacement query rejects.
- [x] Preserve guarded insert-save destinations instead of resetting their page.

[06/08/26]

- [x] Isolate the scrolling table behind a paint containment boundary so Chromium and WebKit can repaint it independently from the surrounding workspace.
- [x] Remove the Data Grid vertical track's trailing inset so its thumb reaches the bottom edge at maximum vertical scroll.

[06/08/26]

- [x] Increase the virtual row buffer to 48 rows after removing body-cell drag registration so rapid scrolling keeps more painted content around the viewport.
- [x] Mark the Data Grid viewport as a frequent scroll surface and disable supported-browser scroll anchoring that can override explicit page resets.
- [x] Reset the viewport again when a page or page-size query moves from initial loading to ready so replacement rows cannot retain the previous offset.

[06/08/26]

- [x] Supersede direct rendering through 500 rows by virtualizing row models above the 100-row default.
- [x] Reduce virtual overscan to 12 rows and keep the virtual item-key callback stable while the row model is unchanged.
- [x] Disable dnd-kit's optimistic DOM reordering while preserving its keyboard plugin, then commit one TanStack column order on drop.
- [x] Reset page scroll without key-remounting the Data Grid viewport.
- [x] Keep schema-derived column definitions stable when only column order changes.
- [x] Move live column-width propagation outside React and subscribe resize indicators to their own TanStack state.

[06/08/26]

- [x] Render row models through 500 records directly instead of trying to mask delayed browser painting with larger virtual overscan.
- [x] Keep virtualization for larger row models with a bounded 60-row overscan.
- [x] Move pagination after the table actions at the right edge of the toolbar.
- [x] Align the reset-width tests with the schema-aware 294px identifier column width.

[06/08/26]

- [x] Restore the reserved source-header state and default sortable transition while a column drop settles.
- [x] Preserve the last settled row range and page label while a page-size query loads, and disable page navigation until it resolves.
- [x] Show `0–0 of 0` for empty results so row status retains the same information structure.
- [x] Keep the page-size trigger at one compact width for 100, 500, and 1000 rows.
- [x] Wrap previous-page and next-page icon actions with shared tooltips.
- [x] Scale virtual overscan from 60 rows for small row models to 90 and 120 rows for larger models.

[06/08/26]

- [x] Keep body cells outside dnd-kit registration so header-drop work does not scale with every visible row cell, then apply the TanStack column order atomically on drop.
- [x] Use a 24-row virtual overscan to keep mounted content ahead of rapid scrolling without making drag layout work measure an unnecessarily large table.
- [x] Move the row status, compact page-size selector, previous, `Page x`, and next controls to the left side of the table toolbar and remove the product Data Grid footer.
- [x] Show a truthful total lower bound while another page exists and an exact total when the final page proves it.
- [x] Disable dnd-kit sortable transitions and post-drop header visuals so column order applies without a synthetic settling delay.

[06/08/26]

- [x] Replace cumulative 50-row loading with URL-backed pages using a 100-row default and constrained 100, 500, and 1000 row sizes.
- [x] Query one page plus a sentinel row from its page-derived offset and expose previous and next navigation without claiming an unavailable total count.
- [x] Virtualize the current page inside the existing semantic Data Grid table so scrolling and live column resizing only mount the visible row window plus overscan.
- [x] Replace literal skeleton records with the shared spinner and visible `Loading rows` status.
- [x] Prefetch inactive tabs using their stored page and page size as part of exact Jazz query identity.

[06/08/26]

- [x] Prefetch an inactive data tab's exact stored filter and sort query from settled pointer intent, keyboard focus, and pointer-down navigation intent.
- [x] Keep tab prefetch bounded to one speculative subscription and release it after intent, closure, runtime replacement, or destination handoff.

[06/08/26]

- [x] Document the table-row prefetch, Jazz cache-entry reuse, subscription lifecycle, and grid-state projection in [Table row prefetch and query lifecycle](../tableRowsPrefetch.md).

[06/08/26]

- [x] Prefetch the exact default Jazz table-row subscription from settled pointer intent, keyboard focus, and pointer-down navigation intent.
- [x] Reuse one shared query builder and options object for speculative and rendered table-row subscriptions.
- [x] Replace the blank initial row-loading message with column-aligned Data Grid skeleton rows while preserving an accessible loading status.
- [x] Surface failed Jazz row queries as errors instead of leaving the grid in an indefinite loading state.

[06/08/26]

- [x] Replace native browser titles on column-type markers, schema navigation, tab creation, dock controls, and theme controls with shared Tooltip composition.

[05/08/26]

- [x] Reset an individually resized data column to its schema-aware initial width from both header action menus.

[05/08/26]

- [x] Keep the selection column strictly `36px` and render data columns at their TanStack constrained sizes without proportional viewport redistribution.
- [x] Keep a compact gap between schema markers and header labels while structured preview counts use a fixed leading rail.
- [x] Supersede viewport-stretched semantic-table columns with an intrinsic-width table over a viewport-filling background surface.

[05/08/26]

- [x] Use monospace typography for raw values in insert and edit form inputs while keeping labels, type captions, helper text, and actions proportional.

[05/08/26]

- [x] Keep Data Grid content in its committed TanStack order while a header drag is in progress and apply one persisted order on drop.
- [x] Preserve the fixed selection-column slot while the reorderable data-column subset changes order.
- [x] Use collision-safe drag identities and an internal selection-column namespace that does not consume `_select` from inspected schemas.

[04/08/26]

- [x] Keep the Data Grid header group sticky above body rows and use an opaque semantic header surface so scrolling text cannot show through it.

### DataGrid interaction API

[05/08/26]

- [x] Keep dnd-kit as the renderer-owned column drag interaction while TanStack owns the resulting column-order state.

[05/08/26]

- [x] Keep `DataGrid` controlled through a TanStack table instance.
- [x] Configure the controlled table through the feature-aware `DataGridTable<TData>` contract exported by `@inspector/ds`.
- [x] Represent range corners with stable row IDs and column IDs while resolving range interiors against displayed row and column order.
- [x] Keep cell-selection ranges in TanStack state while exposing controlled active-column and active-row product state.
- [x] Bind TanStack replacement, include, exclude, Shift-extension, and drag-selection behavior without exposing raw pointer events as application state.
- [x] Keep single-click cell activation separate from double-click and do not expose cell opening until inline editor routing exists.
- [x] Register body cells only as column drop targets so dnd-kit does not consume normal cell clicks.
- [x] Preserve header dragging, resizing, sorting, checkbox controls, relation links, and context-menu hooks.
- [x] Disable native text selection on the table surface so pointer gestures select cells instead of glyphs.

### Row selection

[12/08/26]

- [x] Clear checked rows when Insert row replaces the complete-row editor with the insert form.

[05/08/26]

- [x] Use TanStack's row toggle handler and table-owned range anchor for Shift-click selection.
- [x] Keep focused-row choice, nearest-row fallback, pane routing, and draft guards in the application.

[05/08/26]

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

[05/08/26]

- [x] Make an unmodified single click replace the cell selection and focus the target cell.
- [x] Keep single-click cell focus independent from side-pane presentation.
- [x] Add or subtract cell ranges through Command/Control pointer selection.
- [x] Select a rectangular visible range from the anchor through Shift-click.
- [x] Preserve range-corner identity through column reorder and recompute the visible rectangle in the reordered layout.
- [x] Keep hidden-column ranges in TanStack state so they contract, become dormant, or restore with column visibility.
- [x] Clear row and cell selections when filter, sort, table, schema, or query scope changes.
- [x] Render selected-cell background independently from the focused-cell border.
- [x] Keep double-click from opening an inspection-only cell pane while inline editor routing is unavailable.
- [x] Clear cell selection when a column header receives focus.
- [x] Open cell context actions from either a selected cell or a direct right-click target.

### Side-pane state and focus

[12/08/26]

- [x] Uncheck the active edited row when Escape dismisses its pane while preserving other checked rows.

[23/07/26]

- [x] Represent pane presentation explicitly as `closed`, `insert`, or `rows`.
- [x] Keep selection state separate from pane presentation.
- [x] Give row-checkbox interaction and insertion explicit pane precedence.
- [x] Keep the row pane open when a cell in its focused row is clicked.
- [x] Focus the corresponding row-editor field when a cell in the focused row is clicked.
- [x] Keep cells in other rows from silently retargeting the focused row editor.
- [x] Activate a target column after clearing cell state.
- [x] Use progressive Escape dismissal for pane, cell selection, cell focus, and column focus.
- [x] Remove the non-interactive resizable panel and panel-group focus outline.
- [x] Span the pane beside the action area, filter builder, table viewport, and footer.

### Schema-driven row forms and basic cell presentation

[05/08/26]

- [x] Remove sibling fields from layout while a structured editor fills the pane, while keeping them mounted for draft and editor-state restoration.
- [x] Replace JSON and array editors with a single NULL presentation without an editor toolbar while NULL mode is active, then restore the retained draft when Value mode returns.

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

[05/08/26]

- [x] Present every fixed and hideable data column directly in the action-bar Multi Select without query filtering.

[29/07/26]

- [x] Render accessible muted base-type column markers before names, with compact spacing and dedicated key and relation icons.
- [x] Add a quiet trailing chevron menu and direct header context menu for ascending sort, descending sort, and hide-column actions.
- [x] Balance column-header markers and trailing chevrons with matching 20px slots and the shared icon-only Button.
- [x] Activate a column before its chevron or context menu opens so selection does not wait for a bubbled header click.
- [x] List fixed and hideable data columns in a searchable action-bar Multi Select, keep checkbox selection open, and provide contextual `Check all` and `Only` actions.
- [x] Move columns left, right, to the start, or to the end through matching chevron and context-menu submenus.
- [x] Move a focused reorderable column with Shift plus Left or Right and show those shortcuts in the move submenu.
- [x] Expose each sortable header's current direction through `aria-sort` and toggle sorting with Enter when the header owns focus.
- [x] Open table actions from the complete table-list item, including its checkbox, label, and surrounding item area.
- [x] Keep resolved rows visible while a new sorting subscription resolves instead of replacing the body with loading content.
- [x] Give the workspace toolbar an explicit one-pixel separator instead of relying on the browser's implicit border width.
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

[25/08/26]

- [x] Keep route-derived active tab identity read-only while retaining previous-route provenance for New view replacement.
- [x] Preserve another replaceable table when a destination replaces the active New view.
- [x] Traverse native browser history for Tables-local Back and Forward replay instead of appending replay entries.

[20/08/26]

- [x] Keep one canonical Data tab per table and store its current filter, sort, and pagination route state on that tab.
- [x] Remove filtered-view tab identity and labels while keeping Schema as a separate canonical representation.
- [x] Open a missing table in one replaceable slot and replace that slot when another missing table opens.
- [x] Keep a replaceable table open from a table-list or tab double click and from the tab context menu.
- [x] Open bulk-selected tables as persistent tabs while preserving their visible list order.
- [x] Preserve an existing table tab's stored route search when it is opened from the table list.

[12/08/26]

- [x] Add Tables-scoped Go Back and Go Forward controls before the workspace tabs without changing native browser history behavior.
- [x] Disable each navigation control at its Tables-history boundary and expose authored Go Back and Go Forward tooltips.
- [x] Replay route-backed table navigation, reopen route-backed closed tabs, and preserve replace navigation semantics.
- [x] Keep cell selection local to its table view and outside Tables navigation history.
- [x] Keep Tables navigation history scoped to the mounted workspace without persisting it across reloads.

[07/08/26]

- [x] Replace the active New View when a new table, schema, or recent view opens, including when other tabs already exist.
- [x] Preserve New View when an existing workspace tab is activated rather than newly opened.
- [x] Give each table schema one canonical workspace identity and activate the existing schema tab instead of creating a duplicate.
- [x] Open schema beside every data view, including filtered and sorted views, without replacing the source tab.
- [x] Remove data-only route search from schema tab identity and persisted schema state.
- [x] Repair persisted schema identities, duplicate tab IDs, and tabs that reference unavailable tables.

[31/07/26]

- [x] Keep data grid as the default table content and remove the table-list Data/Schema toggle.
- [x] Open the selected table schema in its own workspace tab from a `Layers` action beside column visibility.

[30/07/26]

- [x] Keep active workspace-item identity internal while filters and sorting remain URL-backed.
- [x] Update an active filtered table item in place instead of creating a new item for each route-search edit.
- [x] Reconcile completed route navigation through one atomic tab-state update without a pending-navigation ref gate.
- [x] Highlight an activated column only after cell focus and selection are cleared.
- [x] Keep loaded-row extension from expanding an existing row or cell selection implicitly.

### Table-list dock

[07/08/26]

- [x] Keep the table workspace, tab strip, and resizable dock mounted across table and New View child-route changes.
- [x] Preserve a collapsed table-list dock while New View opens or the final table tab closes.
- [x] Consume side-panel controls from an explicit provider descendant instead of a provider render callback.

[04/08/26]

- [x] Keep table overflow inside constrained Accordion panels so section headers and the outer dock width remain stable as sections open and close.
- [x] Hide constrained Table List scrollbar chrome across standard and WebKit scrollbar APIs while preserving wheel, touch, and keyboard scrolling.
- [x] Preserve inter-section spacing inside each indexed fill-layout item so flex shrinking cannot remove it.
- [x] Lock the Inspector shell to the viewport so the page never becomes a scroll owner and the header and bottom dock remain stationary.
- [x] Give the bottom dock a fixed semantic height and use extra-small dock icons.
- [x] Provide shell dock controls directly from `SidePanelLayoutProvider` so the route does not consume layout context outside its provider boundary.
- [x] Stretch a Data Grid table to its viewport when its intrinsic column width is smaller, while retaining horizontal overflow for wider grids.
- [x] Keep complete Accordion triggers above shrinkable panel viewports so sections cannot paint over one another at short viewport heights.
- [x] Use overlay scrollbars for the Table List, Row Editor, and Data Grid so overflow does not change content width.
- [x] Start the Data Grid vertical track below the sticky header while retaining one semantic table and one native two-axis viewport.

[03/08/26]

- [x] Use the semantic layout canvas color behind page surfaces instead of the secondary interaction color.
- [x] Express shell separation as a row gap and derive both shell and resizable gutters from the four-pixel spacing token.
- [x] Remove the resize handle and its gutter while the table-list dock is collapsed; reopen it from the application dock.

[02/08/26]

- [x] Let the application shell own four-pixel gutters above and below the workspace.
- [x] Render the header and bottom dock as page surfaces over the shell gutter surface.
- [x] Separate the table-list dock from the workspace with a transparent four-pixel resizable gutter.
- [x] Round the adjacent dock and workspace top and bottom corners with the two-pixel radius token.

[31/08/26]

- [x] Start the table-list dock open at 200px while keeping its 160px to 360px resize range.
- [x] Delegate dock collapse and expansion directly to the design-system panel ref.

[31/07/26]

- [x] Keep left-dock visibility and resizable-panel ownership inside the Tables feature.
- [x] Compose the feature-owned visibility control into the application dock at the Tables parent route.
- [x] Open and close the table-list dock through one persistent dock icon.
- [x] Remove the duplicate table-list toggle from the workspace tab bar.
- [x] Remove table search and its empty-result state from the table-list dock.

[29/07/26]

- [x] Give the selection header and row cells the same full-width centered layout inside their fixed column.

### Compact grid value presentation

[05/08/26]

- [x] Delegate text overflow to value renderers instead of imposing end truncation from the generic cell.
- [x] Middle-truncate row and relation identifiers while keeping relation navigation indicators visible.

[05/08/26]

- [x] Replace proportional compact-grid value typography with monospace typography for raw database values.
- [x] Keep headers, controls, and descriptive UI proportional while retaining tabular numerals and right alignment for quantities.

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

[31/07/26]

- [x] Replace application-owned table workspace layout `div` elements with constrained `Box` composition while retaining test fixture elements.

[23/07/26]

- [x] Document the `DataGrid` API through generated package-authoritative metadata.
- [x] Record row, cell, pane, column, lifecycle, visual, and bulk-operation behavior.
- [x] Cover DataGrid click, double-click, modifier, checkbox, drag registration, and state attributes.
- [x] Cover individual row selection, row ranges, focus recovery, and pane precedence.
- [x] Cover additive cell selection, rectangular ranges, visibility changes, and column reorder.
- [x] Cover row-editor field focus, navigation restoration, and header activation.
- [x] Validate every package and application test, generated-props check, typecheck, and production build without unrelated repository failures.

### Deferred row editor boundary

[07/08/26]

- [x] Share retryable edit and insert form loaders between direct-intent prefetch and `React.lazy` rendering.
- [x] Prefetch the insert form from toolbar intent and the edit form from row-selection intent without importing either form into the base table graph.
- [x] Keep the detail-pane structure stable and remove the visible row-editor loading sentence while the selected form resolves.
- [x] Keep CodeMirror behind its independent deferred boundary.

[30/07/26]

- [x] Keep the active edited row available through a dedicated `useTableRowById` query when filters or pagination remove it from the visible grid query.

[27/07/26]

- [x] Keep insert and edit form modules outside the static table-view import graph.
- [x] Load the selected row form only after the detail pane opens.
- [x] Keep row-field focus lookup in a dependency-light module shared by the table state and deferred forms.
- [x] Render a stable detail-pane loading state while the selected form resolves.
- [x] Cover the table-view import boundary with a regression test.

## Open product work

### Table query prefetch

[06/08/26]

- [ ] Replace the isolated alpha `SubscriptionsOrchestrator` adapter when Jazz exposes a supported prefetch API with shared pending work, release, and bounded retention.
- [ ] Measure speculative query hit rate, transferred rows, failed queries, and duplicate server work before broadening prefetch beyond direct table navigation intent.
- [ ] Decide whether durable inspected-row caching is an explicit opt-in; keep the default admin runtime non-persistent.

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
- [x] Add direct contract tests around the generic Jazz query adapter.

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
- [x] Keep right-click inside the current selection from replacing it.
- [x] Replace selection when right-click targets an unselected cell.
- [ ] Group bulk-operation targets by schema column in visible column order.
- [ ] Order targets inside each group by active query row order.
- [ ] Identify each target by stable row ID with query position as supporting information.
- [ ] Render large operation reviews incrementally instead of mounting every field control.
- [ ] Define review and confirmation behavior for dirty multi-cell operations.

### Context menus and commands

[28/07/26]

- [ ] Implement remaining cell commands for copying a row and opening selected cells.
- [ ] Implement row context commands derived from row state and schema capabilities.
- [ ] Implement column-header context commands with explicit visible-result and matching-query scope.
- [x] Complete `Filter by value` through the generic filter builder with `eq` as the initial operator.
- [ ] Keep context-menu availability schema-driven and generic across inspected applications.

### Keyboard data-grid behavior

[23/07/26]

- [ ] Implement directional cell navigation.
- [ ] Implement Home, End, page movement, and row-boundary behavior.
- [ ] Implement Enter as the keyboard equivalent of opening a focused cell.
- [ ] Implement Space and Shift+Space for focused row-checkbox selection.
- [ ] Implement keyboard additive and range cell selection.
- [ ] Define keyboard focus restoration after pane dismissal.
- [x] Provide a copy shortcut for the focused cell.
- [ ] Provide copy shortcuts for selected cells.
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

[06/08/26]

- [x] Supersede cumulative load-more state with explicit page and page-size route identity.
- [ ] Add count-query support before presenting an exact matching-row total.
- [ ] Define selection behavior when rows leave the represented page because of live updates.

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
- [ ] Review relation links and other interactive cell descendants under include, exclude, and range-selection modifiers.

## Work outside the foundation scope

[21/08/26]

- The earlier editable single-cell mutation exclusion is superseded by the implemented cell Edit action and existing editor flow.

[06/08/26]

- [x] Supersede the earlier virtualization exclusion with fixed-height virtual rendering for standard Data Grid rows.
- [ ] Keep dynamic-height expanded rows outside the virtual body until their measurement and focus behavior is specified.

[05/08/26]

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

[25/08/26]

- Connection entry preserves workspace geometry but does not expose tab controls until the initial table route resolves.
- The table-list pane remains blank during schema loading; the centered connection status owns loading feedback for the complete workspace. This supersedes the earlier stable loading-row decision.

[25/08/26]

- Connection entry does not use `NewTableView` as an initialization placeholder; the explicit New view route remains available after schema readiness.

[25/08/26]

- Structural rendering, editor warming, queries, and mutations wait for the selected stored schema fetched from Jazz. This supersedes cached-schema availability decisions.

[21/08/26]

- Binary cell menus name the copied encoding explicitly; `Mod+C` maps to the direct Hex action.
- Two available binary encodings remain direct menu actions rather than introducing a submenu.

[21/08/26]

- Cell copy notifications use the Toaster's brief auto-dismiss duration.
- Repeated copies of one cell update its mounted notification and refresh dismissal; copies from different cells remain distinct.

[21/08/26]

- [x] Preserve stable header-menu structure and action discoverability by disabling unavailable reset actions instead of hiding them.

[21/08/26]

- [x] Supersede column-local-only reset: either column-header menu may restore the complete grid to schema-definition order.
- [x] Supersede the toolbar-only pristine-empty action with a contextual action that opens the existing insert-row pane.
- [x] Do not represent insertion as a synthetic first row until inline row creation has complete editing, validation, save,
      cancel, and keyboard contracts.

[12/08/26]

- Schema and permissions own independent search state and may remain open concurrently.
- Escape closes only the focused document search, clears its query, and restores depth-based expansion.
- Document expansion toggles between its document-specific default depth and complete safe expansion rather than bypassing JSON rendering limits.

[12/08/26]

- Unavailable Back and Forward actions retain disabled semantics and keyboard focus for tooltip discovery.

[12/08/26]

- Row-editor identity remains URL-backed, but pane interactions replace the active route instead of creating navigation-history entries.

[11/08/26]

- Treat row-action popups as inside the selection boundary and commit selection-changing commands after popup closure.

[10/08/26]

- A loaded row window may serve contained page and page-size routes without opening redundant exact-page subscriptions.
- An uncovered page starts a bounded query; prior page-size selection does not imply proactive block prefetching.
- Loaded-window reuse is invalid across Jazz manager, schema, table, filter, or sort changes.

[10/08/26]

- Cached schema metadata may stabilize table structure, but only the selected schema fetched from Jazz may initialize the query client.
- Row-editor forms remain deferred from the base table bundle and are warmed once cached schema metadata is available.

[08/08/26]

- Equivalent serialized query keys retain one subscription even when inline query-builder identity changes.
- Abandoned fulfilled renders cannot become the source of preserved rows.

[07/08/26]

- Live rows may remain visible only while a query refreshes through the same Jazz manager.
- A replacement Jazz manager starts with row-body loading even when route and query identity are unchanged.
- Failed speculative row-editor preloads may retry; render-consumed failures remain error-boundary failures.

[07/08/26]

- [x] Keep Insert row in the table toolbar as the sole pristine-empty insertion action instead of adding a synthetic data row.
- [x] Do not introduce selected-row resolving or missing-row product states without evidence that the normal row-selection path requires them.

[06/08/26]

- [x] Use 100 rows as the default page size and constrain alternatives to 500 and 1000 rows.
- [x] Keep page controls honest without an exact total: show the represented row range, current page, and available previous or next navigation.
- [x] Reset pagination to page one when filters, sorting, or page size change.
- [x] Use a spinner with visible `Loading rows` copy instead of record-shaped skeleton placeholders.

[05/08/26]

- [x] A column header action resets only that column; a grid-wide reset requires a separate table-level action.

[05/08/26]

Checked markers in this section mean the interaction decision is settled; they do not mean the behavior is implemented.

- [x] A single click selects and focuses a cell without opening a pane.
- [x] Double-click or Enter starts schema-appropriate inline editing for supported cells.
- [x] JSON, Array, and Row cells use an expanded code editor in an anchored inline dialog whose expand action opens the complete-row pane focused on the field.
- [x] Relation and binary cells open the complete-row pane focused on their field.
- [x] Timestamp cells use an inline calendar when that control is implemented.
- [x] Generated, unsupported, and otherwise read-only cells remain read-only in the grid.
- [x] Command/Control interaction includes a range when it starts outside the selection and excludes a range when it starts inside.
- [x] Shift-click selects a rectangular visible cell range.
- [x] Table pointer gestures select cells rather than native text.
- [x] Text remains selectable inside side-pane field controls.
- [x] Clicking a header clears cell state and activates the column.
- [x] Escape closes the pane and unchecks its active row while preserving other checked rows.
- [x] Individual row checkboxes remain a single-row clear control outside pane dismissal.
- [x] The header checkbox remains the bulk row clear control.
- [x] Cell-range corners use row IDs and column IDs while range interiors follow the displayed table layout.
- [x] Keep pane and inline editing simultaneously available without a workspace mode preference.
- [x] Keep full inspection in the complete-row pane without adding a separate cell-inspection pane or hover cards.
- [x] Close a clean row pane before starting inline editing on a double-clicked cell.
- [x] Guard a dirty row-pane transition with Save and continue, Discard and continue, or Keep editing.
- [x] Keep mutation parsing, validation, dirty tracking, save, and discard independent from the editing surface.
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
- [x] The application dock icon is the only table-list visibility toggle: the first activation opens the dock and the next activation closes it.

## Open design decisions

[17/08/26]

- [x] Supersede direct review resizing with fixed operation triggers and independently bounded ten-row operation lists.
- [x] Supersede exhaustive affected-row review with operation summaries, operation Undo, and grid-scoped cell and row recovery.

[15/08/26]

- [ ] Decide whether the bounded affected-row review also needs direct vertical resizing.

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

[25/08/26]

- [x] Cover canonical workspace and table scope formatting, including incomplete runtime identity.
- [x] Verify tabs, pins, preferences, mutation state, and table view composition consume the shared scope contract.

[25/08/26]

- [x] Cover connection-entry status through schema readiness and initial table-route selection while preserving explicit New view behavior.
- [x] Cover blank table-list loading space without false rows, row actions, or empty-state copy.

[25/08/26]

- [x] Cover verified-schema-only runtime initialization and remove schema-cache identity, hydration, and browser-storage tests.
- [x] Cover combined table preferences, per-workspace pins, tabs, and recent views with version rejection, scope isolation, and unavailable storage.
- [x] Verify focused and package-wide Inspector tests, lint, typecheck, and production build.

[24/08/26]

- [x] Cover immediate reconciled-table mounting and mismatch feedback with focused workspace tests.
- [x] Verify connected table switches keep the toolbar and Data Grid mounted, avoid the opening flash, and center row loading within the grid viewport.
- [x] Verify focused and package-wide Inspector tests, lint, typecheck, and production build.
- [x] Profile opening the wide-table fixture after removing synchronous middle-truncation measurement and painting reconciliation feedback: INP reduced from 1877ms to 618ms.
- [x] Re-profile wide-table closing against a connected Inspector Test fixture: INP reduced from 1460ms to 523ms.

[22/08/26]

- [x] Cover generic runtime error presentation, hidden raw details, and explicit retry invocation.
- [x] Verify focused and package-wide Inspector tests, changed-file lint, typecheck, and production build.
- [ ] Verify the retry control through keyboard and pointer interaction against a connected runtime failure.

[21/08/26]

- [x] Cover focused-cell copy, binary formats, staged-value filtering, context-menu focus behavior, and clipboard failure feedback with focused tests.
- [x] Run application and design-system typechecks and builds.
- [ ] Verify context actions and copy feedback in the connected Inspector runtime.

[21/08/26]

- [x] Cover disabled pristine reset actions and enabled reordered or resized reset actions in both header menus, then verify focused tests, changed-file lint, typecheck, build, and package tests.

[21/08/26]

- [x] Cover complete in-flow table-list names, overflow-only tooltip disclosure, and fitting-label suppression with a focused test.
- [ ] Verify long table names at the minimum dock width through pointer and keyboard tooltip interaction.

[21/08/26]

- [x] Reproduce unfiltered empty-table silence with a failing table-view regression test.
- [x] Cover empty copy, polite announcement, contextual insertion, and the existing toolbar action.
- [x] Verify the focused table-view test, complete Inspector test suite, typecheck, and production build.
- [ ] Verify the centered prompt in a connected empty table whose columns overflow the viewport horizontally.

[20/08/26]

- [x] Cover canonical Data identity, replaceable-slot replacement, stored-search activation, table-list and tab promotion, bulk persistence, and legacy tab collapse.
- [x] Verify focused and package-wide Inspector tests, changed-file lint, typecheck, and production build.
- [x] Verify replaceable presentation and pointer and keyboard context actions in the Workspace Tabs browser fixture.

[10/08/26]

- [x] Reproduce contained-page refetching with a failing loaded-window regression test.
- [x] Cover contained smaller pages, the first uncovered page, known result-set ends, larger uncovered pages, live end-boundary changes, and repeated out-of-range navigation.
- [x] Verify focused and package-wide Inspector tests, lint, typecheck, and production build.
- [ ] Verify the 500-to-100 page-size sequence against a connected table containing more than 500 rows.

[10/08/26]

- [x] Reproduce the resolved-preload suspense gap with a failing loader regression test.
- [x] Verify a prefetched editor module renders without committing its Suspense fallback.
- [x] Reproduce cached-schema query readiness through focused runtime and provider tests.
- [x] Verify the client remains unpublished until the selected stored schema replaces cached metadata.
- [x] Verify focused loader, runtime, provider, and bundle-boundary tests, full Inspector tests, typecheck, and build.
- [ ] Verify the connected first table load no longer reports Jazz's different-schema error.
- [ ] Verify first insert and edit pane openings do not expose `Loading editor` in a connected browser.

[08/08/26]

- [x] Cover preserved-row reset when table, schema, filters, page, or page-size scope changes.

[08/08/26]

- [x] Cover render-safe query snapshots, commit-phase subscription acquisition, query reset, and equivalent-key subscription stability.
- [x] Cover that an abandoned fulfilled render cannot replace the last committed preserved rows.
- [x] Verify focused query tests, Inspector lint and typecheck, the production build, and package-wide tests.

[07/08/26]

- [x] Cover plain-JSON schema-cache round trips for unknown fields that resemble the removed serialization tag.
- [x] Verify focused runtime tests, Inspector typecheck and lint, and the production build.

[07/08/26]

- [x] Cover same-manager row preservation and replacement-manager loading behavior.
- [x] Cover shared runtime inputs for table queries and mutations without duplicate projection subscriptions.
- [x] Cover failed speculative editor preload retry and retained deferred bundle boundaries.
- [x] Cover decoded schema-cache reuse without repeated browser-storage parsing.

[07/08/26]

- [x] Cover schema cache identity, malformed data, unavailable storage, and Jazz binary default round trips.
- [x] Cover synchronous cached-schema hydration, independent schema publication, and projection-level render isolation.

[07/08/26]

- [x] Cover pristine, filtered, and failed row-query empty content with focused tests.
- [x] Cover schema loading and runtime failure workspace states without exposing raw runtime errors.
- [x] Cover retryable row-editor module loading, direct edit intent, direct insert intent, and static import boundaries.
- [x] Verify the product build retains separate edit-form, insert-form, shared editor-fields, and CodeMirror chunks.

[07/08/26]

- [x] Cover reference-preserving no-op tab sanitization with a focused regression test.
- [x] Verify focused workspace tab tests after simplifying route-owned schema reconciliation.
- [x] Verify Inspector changed-file lint, typecheck, production build, and package-wide tests.

[06/08/26]

- [x] Cover the frequent-scroll viewport treatment, expanded virtual buffer, and query-completion scroll key with focused tests.
- [x] Verify immediate 1000-row jumps keep rendered rows intersecting the viewport in the browser fixture.
- [ ] Verify rapid scrolling and page-size reset behavior in a connected Orion session.

[06/08/26]

- [x] Verify focused Data Grid and Table Explorer regression tests.
- [x] Verify design-system and Inspector typechecks and lints.
- [x] Profile a large-grid header drag after removing optimistic DOM reordering.
- [ ] Verify page-size round trips and virtual scrolling in a connected Safari or Orion session.

[06/08/26]

- [x] Cover the 309-row non-virtual boundary and the larger-model virtual window with focused Data Grid tests.
- [x] Cover right-edge pagination order and the corrected schema-aware reset width with focused Inspector tests.
- [ ] Verify the 309-row connected table in Orion or Safari; the automated browser does not provide those engines.

[06/08/26]

- [x] Cover settled pagination status during page-size loading, empty ranges, compact page-size width, page-navigation tooltips, dynamic overscan, and restored drop settling with focused tests.
- [x] Verify the Select documentation fixture renders `width="compact"` at a fixed 72px.
- [x] Verify a 1000-row Data Grid fixture mounts rows across immediate quarter-page jumps without an empty virtual window.
- [x] Verify affected typechecks, lints, generated metadata checks, and production builds.

[06/08/26]

- [x] Cover page offsets, sentinel rows, route normalization, page-size reset, pagination controls, and exact paginated prefetch identity.
- [x] Cover virtual row-window rendering, full scroll geometry, semantic row counts, and spinner loading presentation.
- [x] Verify Inspector and design-system tests, typechecks, lints, generated metadata, and production builds.
- [x] Verify a 1000-row Data Grid fixture keeps mounted rows bounded while scrolling across the complete page and preserves live column resizing.
- [ ] Verify scrolling and live column resizing with 100, 500, and 1000 rows in a browser-held Inspector connection.

[06/08/26]

- [x] Cover inactive-tab focus, settled pointer intent, transient pointer cancellation, exact stored filter and sort resolution, and speculative release.
- [x] Verify Inspector tests, typecheck, lint, and production build after adding tab prefetch.
- [x] Verify design-system tests, typecheck, lint, generated metadata, and production builds after extending Tab View events.
- [ ] Verify tab-to-table handoff with a browser-held Inspector connection; the automated browser profile has no saved connection.

[06/08/26]

- [x] Cover exact query identity, orchestrator ownership, pointer and keyboard intent, transient pointer cancellation, rejected query state, and skeleton row geometry with focused tests.
- [x] Verify Inspector and design-system tests, typechecks, lints, and production builds.
- [x] Verify generated Data Grid prop metadata, design-system documentation typecheck, and production build.
- [ ] Repeat the recorded connected-table interaction with browser-held connection credentials; the automated browser profile has no saved Inspector connection.

[06/08/26]

- [x] Cover authored column-type, tab-creation, and dock-control tooltips without native titles.

[05/08/26]

- [x] Verify a context-menu width reset restores the selected column's schema-aware size without changing another resized column.

[05/08/26]

- [x] Verify the selection column keeps its configured width through intrinsic Data Grid geometry tests.
- [x] Verify compact column-marker spacing and structured-preview rendering in focused application tests and browser rendering.

[05/08/26]

- [x] Verify focused row-ID and relation-cell tests, application typecheck, and production build.

[05/08/26]

- [x] Verify insert and edit form inputs expose monospace typography while labels and actions retain proportional typography.
- [x] Verify binary grid and form values use compact units without spaces.

[05/08/26]

- [x] Verify generic Data Grid cells and application-owned primitive, relation, binary, timestamp, and structured previews use the mono font token.
- [x] Verify quantities remain tabular and right-aligned while headers and surrounding documentation remain proportional.
- [x] Verify focused value-renderer and grid tests, package and application typechecks, changed-file lint, production builds, and browser rendering.

[05/08/26]

- [x] Verify dropped data-column order preserves the fixed selection-column slot and updates matching header and body content.
- [x] Verify canceled and in-progress drags do not persist transient column order.
- [x] Verify Inspector tests, typecheck, lint, production build, and browser interaction.

[05/08/26]

- [x] Verify native TanStack row-range selection and application pane focus through rendered checkbox interactions.
- [x] Verify Inspector tests, typecheck, lint, and production build.
- [x] Verify design-system tests, typecheck, lint, generated props, and production builds.

[04/08/26]

- [x] Accordion, Table List, shell layout, and bottom dock regression tests pass.
- [x] Inspector application tests and production build pass.
- [x] Changed Accordion, Table List, shell, dock, and documentation files pass focused lint.
- [x] Design-system and documentation production builds pass.
- [x] Browser verification confirms the constrained Accordion root and trigger retain their width while panel content owns vertical overflow.
- [x] Browser verification confirms constrained Accordion panels use overlay scrollbars, preserve indexed item spacing, and keep complete triggers at short heights.
- [x] Browser verification confirms Data Grid tables fill unused viewport width.
- [x] Browser verification confirms the Data Grid has no native gutter and its compact vertical track starts at the 28px body boundary.

[02/08/26]

- [x] Focused resizable-handle, token, table-layout, and playground tests pass.
- [x] `pnpm --filter @inspector/ds test`
- [x] `pnpm --filter @inspector/ds typecheck`
- [x] `pnpm --filter @inspector/ds build`
- [x] `pnpm --filter @inspector/ds lint`
- [x] `pnpm --filter inspector.design-system test`
- [x] `pnpm --filter inspector.design-system check:props`
- [x] `pnpm --filter inspector.design-system typecheck`
- [x] `pnpm --filter inspector.design-system lint`
- [x] `pnpm --filter inspector.design-system build`
- [x] `pnpm --filter regarde.inspector lint`
- [x] Browser verification confirms line, transparent four-pixel gutter, and grip handle rendering.
- [x] `pnpm --filter regarde.inspector test`
- [x] `pnpm --filter regarde.inspector typecheck` and `pnpm --filter regarde.inspector build`

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
