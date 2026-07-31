# Tabs View

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Settled implementation decisions](#settled-implementation-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[26/07/26]

- [x] Keep static tab rendering independent from drag-and-drop modules.
- [x] Load reorder behavior from a separate dynamic chunk without making it a render dependency.
- [x] Keep DND imports, sensor setup, sortable hooks, and reorder calculations inside the deferred module.
- [x] Attach deferred sortable behavior through each tab item's ref instead of matching values to DOM positions.
- [x] Restore keyboard focus to the equivalent tab when the deferred boundary mounts.
- [x] Preserve the existing `TabView.List` reorder API while reorder behavior becomes available.
- [x] Use a fixed 26px tab height between compact Button actions and 28px form controls.
- [x] Keep close actions vertically centered within the tab height.
- [x] Compose close actions from the shared 20px icon-only Button with a 14px glyph and 2px radius while retaining TabView-owned positioning and overflow fading.

## Settled implementation decisions

[26/07/26]

- [x] Keep every `@dnd-kit` import in `tabViewReorder.tsx`; a static import originally placed the shared sortable code in the initial application load.
- [x] Load reorder behavior after the static list mounts, then restore focus to the equivalent tab when the deferred boundary remounts the list.
- [x] Register each sortable tab through its owning `TabView.Item` ref.
- [x] Do not restore the discarded sibling-runtime approach that matched controlled values to discovered DOM elements by position. That approach caused tabs to jump and reorder unpredictably during dragging.

## Open design decisions

[24/07/26]

- [ ] Add an `easy-*` animation when closing tabs?

## Validation checklist

[26/07/26]

- [x] Verify static `TabView` module evaluation does not configure DND sensors.
- [x] Verify loading reorder behavior preserves the focused tab.
- [x] Verify sortable behavior registers through each owning tab item ref.
- [x] Run focused `TabView` behavior tests.
- [x] Run design-system typecheck and focused lint.
- [x] Run design-system and product production builds.
- [x] Confirm TabView-specific reorder setup is emitted in a deferred chunk.
- [x] Confirm shared DND dependencies are removed from module-preloaded entry dependencies.
