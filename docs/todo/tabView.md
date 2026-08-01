# Tab View implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[01/08/26]

- [x] Keep resting and active Tab View items free of a persistent outline.
- [x] Place the focus ring around the full item through a parent `:has(:focus-visible)` selector.
- [x] Keep the close action's independent focus treatment.
- [x] Keep static tab rendering independent from drag-and-drop modules.
- [x] Load reorder behavior from a separate dynamic chunk without making it a render dependency.
- [x] Keep DND imports, sensor setup, sortable hooks, and reorder calculations inside the deferred module.
- [x] Attach deferred sortable behavior through each tab item's ref instead of matching values to DOM positions.
- [x] Restore keyboard focus to the equivalent tab when the deferred boundary mounts.
- [x] Preserve the existing `TabView.List` reorder API while reorder behavior becomes available.
- [x] Use a nominal `26px` tab height between compact Button actions and `28px` form controls.
- [x] Keep close actions vertically centered within the tab height.
- [x] Compose close actions from the shared nominal `20px` icon-only Button with a nominal `14px` glyph and `2px` radius while retaining TabView-owned positioning and overflow fading.
- [x] Move sequential focus into panel content instead of outlining the full panel.

## Open product work

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- Tab selection colors and typography.
- Further drag-and-drop interaction changes.
- Tab overflow and close-action behavior.

## Settled interaction decisions

[01/08/26]

- [x] Selection does not use the focus-ring color.
- [x] Keyboard focus uses the blue item outline without adding a resting item border.
- [x] Keep every `@dnd-kit` import in `tabViewReorder.tsx` so sortable code remains outside the initial application load.
- [x] Load reorder behavior after the static list mounts, then restore focus to the equivalent tab when the deferred boundary remounts the list.
- [x] Register each sortable tab through its owning `TabView.Item` ref.
- [x] Do not match controlled tab values to discovered DOM elements by position.
- [x] Keep Tab View panels out of sequential focus so workspace controls own visible keyboard focus.

## Open design decisions

[01/08/26]

- [ ] Add an `easy-*` animation when closing tabs?

## Validation checklist

[01/08/26]

- [x] Tab View tests pass.
- [x] Design-system typecheck passes.
- [x] Changed-file lint passes.
- [x] Browser verification confirms resting items have no visible outline.
- [x] Browser verification confirms focus-visible tabs retain a `2px` focus ring.
- [x] Static `TabView` module evaluation does not configure DND sensors.
- [x] Loading reorder behavior preserves the focused tab.
- [x] Sortable behavior registers through each owning tab item ref.
- [x] Product production build passes.
- [x] TabView-specific reorder setup is emitted in a deferred chunk.
- [x] Shared DND dependencies are absent from module-preloaded entry dependencies.
- [x] Panel tests cover content-owned sequential focus.
