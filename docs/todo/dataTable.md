# Data Table

## Table of contents

- [Implemented foundation](#implemented-foundation)
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
- [x] Document the complete border, fill, ring, focus, resize, and drag model in `docs/notes/dataTableStyleModel.md`.

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

- [x] Keep every `@dnd-kit` import in `dataTableReorder.tsx`; a static import originally placed the shared sortable code in the initial application load.
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

## Open design decisions

[29/07/26]

- [ ] Decide whether active-row presentation should use fill, a leading edge, or cell-owned horizontal edges.
- [ ] Decide whether selected row, selected cell, and active column surfaces should remain visually equal or use distinct semantic values.
- [ ] Decide whether pointer resizing should gain a full-column guide after rendered and TanStack sizing geometry are aligned.

## Validation checklist

[26/07/26]

- [x] Verify static `DataTable` module evaluation does not configure DND sensors.
- [x] Verify loading reorder behavior preserves the focused header.
- [x] Verify sortable behavior registers through the owning header and cell refs.
- [x] Run focused Data Table behavior tests.
- [x] Run design-system typecheck and focused lint.
- [x] Run design-system and product production builds.
- [x] Confirm shared DND dependencies are absent from module-preloaded entry dependencies.

[29/07/26]

- [x] Verify the focused Data Table tests pass.
- [x] Verify design-system typecheck passes.
- [x] Verify focused Data Table lint passes.
- [x] Verify the design-system build passes.
- [x] Verify active-header keyboard focus, resize hover, and active-cell presentation in a browser.
