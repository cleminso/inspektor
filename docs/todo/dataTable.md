# Data Table

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Settled implementation decisions](#settled-implementation-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[26/07/26]

- [x] Keep static table rendering independent from drag-and-drop modules.
- [x] Load column reorder behavior from a separate dynamic chunk without making it a render dependency.
- [x] Keep DND imports, sensor setup, sortable header hooks, cell drop-target hooks, and drag overlay behavior inside the deferred module.
- [x] Attach deferred sortable behavior through each header and cell ref instead of discovering rendered DOM elements.
- [x] Restore keyboard focus to the equivalent header when the deferred boundary mounts.
- [x] Preserve the existing `columnOrder` and `onColumnOrderChange` API while reorder behavior becomes available.

## Settled implementation decisions

[26/07/26]

- [x] Keep every `@dnd-kit` import in `dataTableReorder.tsx`; a static import originally placed the shared sortable code in the initial application load.
- [x] Load reorder behavior after the static table mounts, then restore focus to the equivalent column when the deferred boundary remounts the table.
- [x] Register sortable headers and cells through their owning React refs.
- [x] Do not restore the discarded sibling-runtime approach based on DOM queries, mutation observers, or external element registration. It made behavior depend on private rendered markup and added synchronization complexity.

## Validation checklist

[26/07/26]

- [x] Verify static `DataTable` module evaluation does not configure DND sensors.
- [x] Verify loading reorder behavior preserves the focused header.
- [x] Verify sortable behavior registers through the owning header and cell refs.
- [x] Run focused Data Table behavior tests.
- [x] Run design-system typecheck and focused lint.
- [x] Run design-system and product production builds.
- [x] Confirm shared DND dependencies are absent from module-preloaded entry dependencies.
