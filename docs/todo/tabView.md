# Tab View implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[07/08/26]

- [x] Keep title overflow observation stable when callers recreate an equivalent prefix element.
- [x] Verify reserved close spacing through the applied style instead of exposing test-only closable state in the DOM.
- [x] Document why title observation depends on content rather than prefix ReactNode identity.

[07/08/26]

- [x] Supersede end ellipsis with clipped title text and show the trailing fade only when that title overflows.
- [x] Keep an extra-extra-small gap between the title region and the reserved close action.
- [x] Size short tabs from their content and cap long tabs at the existing `180px` semantic maximum.
- [x] Compress tabs to a semantic `64px` minimum before horizontal overflow takes over.
- [x] Keep prefixes leading, titles visible, and close actions in a reserved trailing region.
- [x] Remove the compact title-hidden and centered-close substitution so compression preserves tab structure and geometry.

[06/08/26]

- [x] Forward focus and pointer intent events through `TabView.Item`'s owned tab button without including its sibling close action.

[06/08/26]

- [x] Replace an open Tab View tooltip instantly and without entrance motion when the pointer targets another tab label or close action.

[06/08/26]

- [x] Reapply the tooltip hover delay when the pointer targets another tab label or close action.
- [x] Extend the close-action container to the trailing tab edge so pointer traversal does not expose the label trigger behind it.

[06/08/26]

- [x] Describe each tab close action with a `Close view` tooltip.

[05/08/26]

- [x] Keep every tab label in the shared tooltip group so moving across fitting and truncated siblings preserves fast tooltip opening.

[05/08/26]

- [x] Preserve Tab View state-driven presentation while its composed tooltip trigger opens.

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

[07/08/26]

- [ ] Add programmatic selected-item nearest-edge reveal after drag state can be observed without competing with DND auto-scroll or transformed sortable geometry.

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- Tab selection colors and typography.
- Further drag-and-drop interaction changes.
- Tab overflow and close-action behavior.

## Settled interaction decisions

[07/08/26]

- [x] Use the trailing fade rather than an ellipsis only for tab names that actually clip.
- [x] Separate the title and close regions with the extra-extra-small spacing token.
- [x] Preserve the same leading prefix, visible title, and trailing close structure at every compressed width.
- [x] Reserve close-action width whether the action is visible or hidden so hover, focus, and selection do not shift title geometry.

[06/08/26]

- [x] Apply hover delay and subtle motion to the initial tooltip, then replace adjacent tooltips instantly without entrance motion.

[06/08/26]

- [x] Prefer delayed tooltip replacement over instant spatial jumps between Tab View targets.

[05/08/26]

- [x] Show the complete tab label in a tooltip whether the rendered label fits or truncates.

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

[07/08/26]

- [x] Cover stable title observation across equivalent prefix element identities.
- [x] Cover the reserved close region through its applied Tab View style.
- [x] Verify Tab View changed-file lint and the design-system typecheck, build, and package-wide tests.

[06/08/26]

- [x] Cover focus, blur, pointer-enter, pointer-leave, and pointer-down event forwarding from the tab button.
- [x] Confirm close-button pointer and focus interaction does not emit tab intent.
- [x] Verify generated Tab View item metadata includes the forwarded event contract.
- [x] Verify Tab View tests, design-system typecheck, lint, and production builds.

[06/08/26]

- [x] Cover instant, motion-free pointer retargeting between tab-label tooltips.
- [x] Browser verification confirms an adjacent tooltip is marked instant and renders without starting or ending transition state.

[06/08/26]

- [x] Cover delayed pointer retargeting between tab-label tooltips.
- [x] Browser verification confirms the close-action container reaches the trailing tab edge while the button keeps its inset position.

[06/08/26]

- [x] Cover the close-action tooltip through pointer interaction.

[05/08/26]

- [x] Cover tooltip availability for a fitting tab label.

[05/08/26]

- [x] Browser verification confirms tooltip opening preserves the tab's classes and `180px` by `26px` geometry.

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
