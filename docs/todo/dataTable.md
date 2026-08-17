# Data Grid

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [TanStack Table v9 selection](#tanstack-table-v9-selection)
- [Message and empty states](#message-and-empty-states)
- [Stable column geometry](#stable-column-geometry)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled implementation decisions](#settled-implementation-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[17/08/26]

- [x] Place the CodeEditor cursor at the end of its seeded value when mount focus is requested.

[17/08/26]

- [x] Render structured FloatingWidget editors with intrinsic height instead of the constrained-pane fill layout.
- [x] Keep the FloatingWidget code editor's expand and collapse state local to the field editor.

[17/08/26]

- [x] Keep FloatingWidget editing scoped to one local field input instead of cloning and validating a complete row draft on each keystroke.
- [x] Derive ledger, review, staged-field, and staged-value views through one memoized mutation projection.

[17/08/26]

- [x] Keep FloatingWidget field edits local until Save commits the field into the table mutation ledger.
- [x] Preserve an existing staged field value when a reopened editor closes without saving.

[17/08/26]

- [x] Project valid staged field values into their grid cells while retaining query rows as the mutation source baseline.
- [x] Keep decoded structured values available to grid presentation while preserving Jazz-specific encoding at the persistence boundary.

[17/08/26]

- [x] Remove the persistent active-cell outline from the drag origin when a multi-cell range is selected.
- [x] Keep the range perimeter and keyboard-only focus-visible treatment independent from the origin cell.

[17/08/26]

- [x] Share one contained focus-ring treatment between header and body cells.
- [x] Keep an ordinary focused cell on the light cell treatment and use the strong header treatment for multi-cell focus.
- [x] Keep range-selection edges on their independent inset-shadow paint layer.

[13/08/26]

- [x] Prevent horizontal and vertical overscroll from escaping the Data Grid viewport into browser navigation or ancestor scrolling.
- [x] Suppress local boundary effects on the Data Grid's native two-axis scroll owner.

[12/08/26]

- [x] Replace the browser-owned rounded header focus outline with a contained Data Grid focus-visible outline.
- [x] Render selected headers with a one-pixel perimeter and increase that same perimeter to the shared focus-ring width when selected and keyboard-focused.
- [x] Remove the redundant active-header pseudo-element and duplicated inherited structural styles.

[12/08/26]

- [x] Follow TanStack's cell-selection example by letting each selected body cell paint the edges from `getSelectionEdges()` with composable inset shadows.
- [x] Remove adjacent-cell edge inspection and neighbor-owned selection painting while keeping header selection styling unchanged.

[12/08/26]

- [x] Paint body-cell selection bottom and inline-end edges from adjacent cells when those neighbors exist, leaving only outer table edges on the selected cell itself.
- [x] Preserve the active-header perimeter implementation independently from body-cell edge ownership.

[12/08/26]

- [x] Keep the focused-cell ring and TanStack selection perimeter on one paint layer so selected cells do not stack lighter bottom or inline-end strokes.
- [x] Keep active-header structural seams neutral beneath its internal selection perimeter so top, bottom, and inline-end edges render once.
- [x] Remove the active-row top stroke so the documentation example matches the product grid's cell-selection treatment.

[12/08/26]

- [x] Draw active body-cell and header rings inside their measured boxes so sticky headers, paint containment, and table edges cannot clip or extend them.
- [x] Use TanStack cell-selection edges to draw one layout-neutral perimeter around resolved selection ranges.

[11/08/26]

- [x] Keep the Data Grid's native two-axis viewport available for programmatic scrolling while removing its redundant sequential-focus stop in favor of the grid's interactive controls and roving body-cell entry point.

[11/08/26]

- [x] Keep noninteractive schema type-marker tooltip triggers free of `aria-label`; their visual tooltip remains available without assigning an invalid ARIA attribute to the native span.

[11/08/26]

- [x] Preserve native `columnheader` semantics on reorderable headers by excluding DnD Kit's generic button-role accessibility plugin and retaining the grid's dedicated keyboard reorder commands.

[11/08/26]

- [x] Provide one roving body-cell entry point with arrow navigation and Enter or Space activation, mounting virtual destinations before focus transfer.
- [x] Keep reorderable headers in sequential keyboard traversal and provide bounded keyboard resizing and reset through accessible separators.
- [x] Expose busy state and stable polite result announcements without replacing settled rows.

[11/08/26]

- [x] Keep column-header menu actions borderless by preserving ghost Button presentation across Menu Trigger composition.
- [x] Preserve the 20px `xs` header-menu target and compact 12px glyph inside the 32px header row.

### Message and empty states

[10/08/26]

- [x] Establish size containment on the actual scrolling viewport so message container-query units do not resolve against a taller ancestor.
- [x] Keep loading and empty message centers aligned to the visible body region below the active-density header.

[07/08/26]

- [x] Render loading and empty message content in a flow-content wrapper so composed React children retain valid HTML structure.

[07/08/26]

- [x] Let `DataGrid.Content` render only its header when `emptyContent` is `null` instead of reserving a message row.
- [x] Keep non-empty loading and empty messages attached to the visible leading edge while the intrinsic-width table scrolls horizontally.
- [x] Preserve native table structure, loading status semantics, and shared column geometry for message rows.

### TanStack Table v9 selection

[05/08/26]

- [x] Make TanStack column-order state the single rendered-order authority and expose only reorderable column membership from `DataGrid.Root`.
- [x] Commit pointer-driven column order once on a successful drop instead of publishing transient orders during drag-over.
- [x] Keep canceled drags state-free, preserve fixed-column slots when merging the reordered subset, and retain hidden columns in the complete order.
- [x] Namespace header, body-cell, and row-group drag identities so arbitrary row and column IDs cannot collide.
- [x] Namespace the Inspector selection column separately from schema column IDs and preserve composable TanStack order updaters through persistence.

[05/08/26]

- [x] Replace the application row-range calculation and anchor state with TanStack's row-selection handler.
- [x] Use TanStack's page row-selection predicates for the header checkbox.
- [x] Keep column drag sensors, drop targets, overlays, constraints, and rollback in the deferred dnd-kit module because TanStack owns column order state but does not provide drag-and-drop behavior.
- [x] Remove redundant migration tests while retaining interaction and application-policy coverage.

[05/08/26]

- [x] Register the exact sorting, visibility, ordering, sizing, resizing, row-selection, and cell-selection features used by `DataGrid`.
- [x] Export one feature-aware `DataGridTable<TData>` contract for the design system, product, tests, and examples.
- [x] Use TanStack cell-selection ranges as the canonical selection state instead of duplicating expanded cell targets in `DataGrid.Root`.
- [x] Bind primary-mouse-button selection start and drag extension through the owning body-cell element.
- [x] Keep links, buttons, form controls, checkbox cells, and secondary mouse buttons outside parent cell selection.
- [x] Render selected and focused cells through `cell.getIsSelected()` and `cell.getIsFocused()`.
- [x] Preserve cell-selection ranges across live data refreshes and loaded-row extension with stable row IDs and `autoResetCellSelection: false`.
- [x] Remove the obsolete application-owned rectangular cell-selection engine.
- [x] Audit the migration against the installed TanStack Intent v9 migration, feature, state, TypeScript, and cell-selection guidance.
- [x] Keep controlled TanStack state slices paired with their update callbacks and render headers and cells through the v9 `FlexRender` component.
- [x] Keep capped query-row arrays referentially stable so cell-selection updates do not invalidate the core row model.

[26/07/26]

- [x] Keep static table rendering independent from drag-and-drop modules.
- [x] Load column reorder behavior from a separate dynamic chunk without making it a render dependency.
- [x] Keep DND imports, sensor setup, sortable header hooks, cell drop-target hooks, and drag overlay behavior inside the deferred module.
- [x] Attach deferred sortable behavior through each header and cell ref instead of discovering rendered DOM elements.
- [x] Restore keyboard focus to the equivalent header when the deferred boundary mounts.
- [x] Preserve the existing `columnOrder` and `onColumnOrderChange` API while reorder behavior becomes available.

[29/07/26]

- [x] Keep permanent header gridline ownership on the header cell during resize hover and active resizing.
- [x] Recolor the header's existing inline-end edge instead of replacing it with a resize-handle shadow.
- [x] Use the same outline channel for controlled active-cell state and focus-visible state.
- [x] Give the resize handle its own focus-visible outline without changing table geometry.
- [x] Give a pointer-active column header a complete one-pixel seam-aligned perimeter.
- [x] Upgrade the active-header perimeter to two pixels for keyboard focus without stacking strokes.
- [x] Align active header and cell rings with shared seams so they cover neutral neighboring borders.
- [x] Raise active headers and cells locally while preserving structural border widths.
- [x] Make active elements' owned bottom and inline-end border colors transparent beneath the state ring.
- [x] Use a one-pixel active-cell perimeter and upgrade it to two pixels only for focus-visible.
- [x] Restore the active header's blue inline-end border only for resize hover, focus, and active resizing.
- [x] Keep the active header's structural top border blue when its outward perimeter is clipped by the viewport.
- [x] Document the complete border, fill, ring, focus, resize, and drag model in `docs/notes/dataGridStyleModel.md`.

[05/08/26]

- [x] Give schema type markers and structured-value count markers a shared fixed leading rail so labels and preview payloads use the same content anchor.

[01/08/26]

- [x] Align compact header-content and body-cell inline padding through one shared style contract.
- [x] Keep the compact column drag preview on the same inline padding as the rendered header and body cells.
- [x] Align each live schema type marker to the shared header and body content inset instead of centering it inside its reserved marker slot.
- [x] Size schema type-marker slots to their content and use an `xs` gap between each marker and column name.

### Stable column geometry

[05/08/26]

- [x] Remove viewport-driven semantic-table expansion so TanStack `minSize`, `size`, and `maxSize` remain the only column-width model.
- [x] Keep the row-selection header and cells at their configured `36px` width when the table is narrower than its viewport.
- [x] Keep the scroll surface filling unused viewport space behind the intrinsic-width semantic table.

[29/07/26]

- [x] Make each visible TanStack leaf-column size the authoritative rendered border-box width for its header and body cells.
- [x] Render one shared native `colgroup` definition for the table instead of asking each header and body cell to participate independently in native table width resolution.
- [x] Give the table an explicit width equal to the sum of its visible leaf-column sizes and remove viewport-driven minimum width expansion that redistributes width between columns.
- [x] Keep the fixed row-selection column at the same width before rows load, after rows render, and while row selection changes.
- [x] Keep every column width unchanged when the row side pane opens, closes, or resizes; represent reduced space through viewport clipping and horizontal scrolling.
- [x] Keep empty, loading, and spanning rows from changing column geometry when they replace or precede data rows.
- [x] Preserve the resized width of the target column while visibility and reorder changes derive table width from the remaining visible column order.
- [x] Calculate visible column sizes once per sizing state and reuse them for table width and rendered columns instead of calling `getSize()` in every body cell.
- [x] Fill unused viewport space with a scroll surface behind the exact-width semantic table instead of adding a layout-participating column.
- [x] Size the scroll surface to the larger of the viewport and the sum of TanStack column widths so horizontal scrolling ends at the final data-column edge.
- [x] Keep the semantic table at the exact sum of TanStack column widths so constrained space never redistributes unaffected columns.

## Open product work

[17/08/26]

- [ ] Open the Calendar immediately when a timestamp field enters the floating editor, without changing staged or persisted value boundaries.

[11/08/26]

- [x] Stop `Menu.Trigger` presentation styles from overriding the Button-owned border, surface, radius, and height on column-header menu actions.
- [x] Keep the `xs` column-header chevron target while removing the accidental 28px composed Menu treatment.

[11/0826]

- [ ] List all wrong interactions with the grid, row select when opening rowEditor
- [x] Think about cell reactivity UI feedback when value changes.
- [ ] Investigate how to improve grid cell selection border.
- [ ] During Column resizing, should the column cell moves as well, or simply keep header? Change the current behavior to adopt spreadheet like column border moves?
- [ ] Add actions "Hide other columns" and "Show all columns" from context menu.

[29/07/26]

- [ ] Add visual regression coverage for header corners, active cells, active columns, resizing, and drag states.
- [ ] Define and implement keyboard-operable column resizing.
- [ ] Define forced-colors fallbacks for active-cell and selection presentation.
- [ ] Define sticky offsets and associations before supporting grouped sticky headers.

## Work outside the foundation scope

[29/07/26]

- [ ] Do not add a measured table-wide gridline or resize-guide overlay.
- [ ] Do not switch the interactive table to collapsed-border conflict resolution.
- [ ] Do not add a selected-range perimeter until product design requires it.

## Settled implementation decisions

[17/08/26]

- [x] Reserve fill-layout code editors for height-constrained surfaces and use intrinsic layout in floating surfaces.

[17/08/26]

- [x] Validate only the active FloatingWidget field during editing and defer row-wide mutation projection until the field is saved.

[17/08/26]

- [x] Treat Save as the field-to-ledger boundary and Apply as the ledger-to-Jazz persistence boundary.
- [x] Make Close and Escape discard only the FloatingWidget's uncommitted field edit.

[17/08/26]

- [x] Show valid staged values in grid cells and keep the staged-update treatment until Apply persists them.
- [x] Keep invalid editor input out of grid value projection while retaining it in the mutation draft for correction.

[10/08/26]

- [x] Use the Data Grid viewport as the CSS size-query container for message placement instead of synchronizing viewport dimensions into React state.

[07/08/26]

- [x] Treat `emptyContent={null}` as an intentional header-only empty presentation rather than defaulting it to generic copy.
- [x] Keep message placement inside design-system-owned semantic table markup instead of positioning application overlays over the viewport.

[26/07/26]

- [x] Keep every `@dnd-kit` import in `dataGridReorder.tsx`; a static import originally placed the shared sortable code in the initial application load.
- [x] Load reorder behavior after the static table mounts, then restore focus to the equivalent column when the deferred boundary remounts the table.
- [x] Register sortable headers and cells through their owning React refs.
- [x] Do not restore the discarded sibling-runtime approach based on DOM queries, mutation observers, or external element registration. It made behavior depend on private rendered markup and added synchronization complexity.

[29/07/26]

- [x] Structural borders describe table geometry and retain one permanent owner.
- [x] Backgrounds describe selected sets and active column scope.
- [x] A complete inset outline describes the active cell and keyboard target without changing cell dimensions.
- [x] The resize handle owns the hit area and events; the header cell owns the visible resize edge.
- [x] Active and focus treatments compose through one outline channel instead of coincident outline and inset-shadow rings.
- [x] Active-header inline-start stroke is state decoration; its top stroke uses the header-owned structural border.
- [x] Active rings visually replace shared neutral seams through paint order rather than neighbor-aware border mutation.
- [x] Active states may suppress structural border color, but never structural border width.
- [x] TanStack column sizing is the source of truth for grid geometry; native table intrinsic sizing must not produce a second width model.
- [x] The fixed selection column has one width shared by its header and every represented row.
- [x] Opening, closing, or resizing a companion pane changes the available viewport, not the column widths.
- [x] When the viewport becomes narrower than the table, columns keep their widths and the viewport provides horizontal scrolling.
- [x] Loading, empty, data, and selection state changes do not move existing column boundaries.
- [x] Resizing one column changes that column and the table's total width without redistributing the delta across unaffected columns.
- [x] Double-click reset restores the column's configured initial width without changing neighboring columns.

## Open design decisions

[11/08/26]

- [x] The composed control owns persistent open-state presentation when Menu behavior is rendered through another design-system control.

[29/07/26]

- [ ] Decide whether active-row presentation should use fill, a leading edge, or cell-owned horizontal edges.
- [ ] Decide whether selected row, selected cell, and active column surfaces should remain visually equal or use distinct semantic values.
- [ ] Decide whether pointer resizing should gain a full-column guide after rendered and TanStack sizing geometry are aligned.

## Validation checklist

[17/08/26]

- [x] Verify field-scoped validation ignores invalid sibling input while preserving Save-only staging behavior.
- [x] Verify one mutation projection produces consistent Apply, review, staged-status, and grid-value views.

[17/08/26]

- [x] Verify typing does not change the ledger or projected grid value before Save.
- [x] Verify Save stages the edited field and Close or Escape preserves any previously staged value.

[17/08/26]

- [x] Verify primitive, timestamp, null, and structured staged values use the existing schema-aware cell presentations.
- [x] Verify clearing staged value overlays restores query-owned grid values.

[11/08/26]

- [x] Cover the overflowing viewport focus contract with a regression test that exercises Base UI's measured-overflow state.
- [ ] Verify keyboard traversal moves from the table toolbar directly to the first grid control in a connected table route.

[11/08/26]

- [x] Focused column tests preserve the `xs` header action and compact `xs` glyph while retaining sorting, context-menu, move, reset, and hide behavior.
- [x] Application type checking and production build pass.
- [x] The application suite passes 428 of 429 tests; the remaining dock fixed-height assertion is unrelated to header actions.
- [ ] Verify the borderless header action in a connected table route.

[10/08/26]

- [x] Reproduce the vertical offset from the supplied recording and cover scrolling-viewport containment with a focused regression test.
- [x] Verify focused Data Grid and Scroll Area tests, full design-system tests, typecheck, and build.
- [ ] Verify regular and compact message centers against the visible scrolling viewport in a browser.

[07/08/26]

- [x] Verify loading and empty message wrappers accept flow content while preserving loading status semantics.

[07/08/26]

- [x] Verify header-only empty content, sticky message structure, loading semantics, and unchanged column geometry through focused Data Grid tests.
- [x] Run design-system tests, typecheck, lint, declaration build, generated-props checks, documentation tests, and documentation build.

[05/08/26]

- [x] Verify intrinsic semantic-table width preserves TanStack column sizes while the background scroll surface fills the viewport.
- [x] Verify package and application tests, typechecks, changed-file lint, generated props, and production builds.
- [x] Verify browser geometry reports the exact configured column sum instead of the wider viewport width.

[05/08/26]

- [x] Verify pointer reorder keeps committed header and body order stable until drop and publishes no order for canceled drags.
- [x] Verify fixed-column merging, collision-safe drag IDs, schema `_select` support, and composable persisted order updaters.
- [x] Verify focused Data Grid and Inspector interaction tests, full Inspector tests, package and application typechecks, production builds, generated props, and changed-file lint.
- [x] Verify the Data Grid documentation example reorders matching headers and body cells after drop in a browser.

[05/08/26]

- [x] Verify TanStack row range selection through rendered checkbox interactions.
- [x] Verify focused-row and pane routing remain application-owned after native row-range selection.
- [x] Verify the reduced design-system and Inspector test suites, typechecks, lint, generated props, and production builds.

[05/08/26]

- [x] Verify TanStack replacement, Shift-range, and pointer-drag cell selection through `DataGrid`.
- [x] Verify checkbox cells and secondary mouse buttons do not start cell selection.
- [x] Verify `@inspector/ds` and Inspector tests, typechecks, lint, and production builds.
- [x] Verify generated Data Grid prop metadata no longer exposes duplicate active-cell or selected-cell props.
- [x] Verify the documentation example renders native focused and selected cell state without console errors.
- [x] Verify the production table route contains `cellSelectionFeature` without unused spanning, pagination, or grouping features.
- [x] Verify the migration contains no v8 constructor, row-model, state, sizing, sorting, pinning, legacy, or internal API residue.

[26/07/26]

- [x] Verify static `DataGrid` module evaluation does not configure DND sensors.
- [x] Verify loading reorder behavior preserves the focused header.
- [x] Verify sortable behavior registers through the owning header and cell refs.
- [x] Run focused Data Grid behavior tests.
- [x] Run design-system typecheck and focused lint.
- [x] Run design-system and product production builds.
- [x] Confirm shared DND dependencies are absent from module-preloaded entry dependencies.

[29/07/26]

- [x] Verify the focused Data Grid tests pass.
- [x] Verify design-system typecheck passes.
- [x] Verify focused Data Grid lint passes.
- [x] Verify the design-system build passes.
- [x] Verify active-header keyboard focus, resize hover, and active-cell presentation in a browser.
- [ ] Add a browser geometry regression that compares selection header and body cell widths before and after rows render.
- [ ] Add a browser geometry regression that compares every visible column boundary before and after a companion pane opens, closes, and resizes.
- [ ] Add behavior coverage for pointer resize, constrained minimum and maximum widths, and double-click reset.
- [x] Verify horizontal scroll appears without column redistribution when the viewport becomes narrower than the explicit table width.
- [x] Verify hidden and reordered columns update the explicit table width without changing retained column sizes.

[01/08/26]

- [x] Verify compact header and body computed inline padding match in a browser.
- [x] Verify row-ID, text, and reference marker edges have zero horizontal offset from their corresponding body-cell content in the live column composition.
- [x] Verify row-ID, text, and reference markers use the shared `xs` gap before their column names.
