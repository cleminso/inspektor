# Data Grid

## Table of contents

- [Implemented foundation](#implemented-foundation)
  - [Stable column geometry](#stable-column-geometry)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled implementation decisions](#settled-implementation-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

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

[01/08/26]

- [x] Align compact header-content and body-cell inline padding through one shared style contract.
- [x] Keep the compact column drag preview on the same inline padding as the rendered header and body cells.
- [x] Align each live schema type marker to the shared header and body content inset instead of centering it inside its reserved marker slot.
- [x] Size schema type-marker slots to their content and use an `xs` gap between each marker and column name.

### Stable column geometry

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

[29/07/26]

- [ ] Decide whether active-row presentation should use fill, a leading edge, or cell-owned horizontal edges.
- [ ] Decide whether selected row, selected cell, and active column surfaces should remain visually equal or use distinct semantic values.
- [ ] Decide whether pointer resizing should gain a full-column guide after rendered and TanStack sizing geometry are aligned.

## Validation checklist

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
