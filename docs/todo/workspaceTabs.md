# Workspace Tabs implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[13/08/26]

- [x] Compose the tab button and close action as normal-flow siblings inside the shared item.
- [x] Replace calculated close-action padding and overlay geometry with item-owned spacing.

[13/08/26]

- [x] Align the close button's hover surface flush with the tab's trailing edge without a second trailing rectangle.

[13/08/26]

- [x] Separate closable tab titles and close glyphs with the small spacing token.
- [x] Anchor Enter-opened reorder actions below the focused tab instead of the viewport origin.

[13/08/26]

- [x] Keep every enabled tab and close action in sequential focus order without activating a view on focus.
- [x] Open reorder actions from a focused tab with Enter.
- [x] Reserve an extra-extra-small gap plus close glyph width after closable tab titles.
- [x] Reveal the close hit area and trailing fade only when the close action is hovered or focused.

[13/08/26]

- [x] Keep the active tab as the list's single sequential focus target and exclude close actions from sequential focus.
- [x] Open reorder actions from the focused tab with Shift plus F10 or the Context Menu key.
- [x] Overlay the close action and trailing title fade so inactive tabs do not reserve hidden close width.

[13/08/26]

- [x] Preserve the selected view while pointer dragging an inactive tab.
- [x] Activate a dragged tab only after a successful drop and preserve selection after cancellation.
- [x] Keep normal clicks immediately activating their tab.
- [x] Skip deferred pointer-reorder loading and reorder actions when fewer than two tabs exist.

[13/08/26]

- [x] Center fixed-area separators at the nominal `20px` extra-small control height instead of stretching them across the bar.
- [x] Prevent horizontal boundary bounce on the native tab-list scroll owner with `overscroll-behavior-x: none`.

[13/08/26]

- [x] Rename the complete compound component to `WorkspaceTabs` with `Tab`, `LeadingArea`, and `TrailingArea` parts.
- [x] Activate a dragged tab only after a successful drop and preserve the active view when a drag is canceled.
- [x] Give both fixed areas an opaque surface, boundary separator, and navigation stacking layer above the scrolling list.
- [x] Remove full-title tooltips and the `details` prop while retaining the close-action tooltip.

[12/08/26]

- [x] Keep each view at its intrinsic full-title width and move horizontal overflow to the list.
- [x] Add a composed Workspace Tabs bar with a fixed trailing actions area outside the scrollable list.
- [x] Reveal the selected view at the nearest horizontal scroll edge.
- [x] Remove title overflow measurement, clipping, and the trailing fade.
- [x] Keep the close region in normal flow with stable reserved geometry.

[11/08/26]

- [x] Provide Shift-plus-Arrow and context-menu reordering independently of deferred pointer dragging, keep the semantic tab as the sole sequential tab stop, and exclude disabled tabs.

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

- [x] Forward focus and pointer intent events through `WorkspaceTabs.Tab`'s owned tab button without including its sibling close action.

[06/08/26]

- [x] Replace an open Workspace Tabs tooltip instantly and without entrance motion when the pointer targets another tab label or close action.

[06/08/26]

- [x] Reapply the tooltip hover delay when the pointer targets another tab label or close action.
- [x] Extend the close-action container to the trailing tab edge so pointer traversal does not expose the label trigger behind it.

[06/08/26]

- [x] Describe each tab close action with a `Close view` tooltip.

[05/08/26]

- [x] Keep every tab label in the shared tooltip group so moving across fitting and truncated siblings preserves fast tooltip opening.

[05/08/26]

- [x] Preserve Workspace Tabs state-driven presentation while its composed tooltip trigger opens.

[01/08/26]

- [x] Keep resting and active Workspace Tabs items free of a persistent outline.
- [x] Place the focus ring around the full item through a parent `:has(:focus-visible)` selector.
- [x] Keep the close action's independent focus treatment.
- [x] Keep static tab rendering independent from drag-and-drop modules.
- [x] Load reorder behavior from a separate dynamic chunk without making it a render dependency.
- [x] Keep DND imports, sensor setup, sortable hooks, and reorder calculations inside the deferred module.
- [x] Attach deferred sortable behavior through each tab item's ref instead of matching values to DOM positions.
- [x] Restore keyboard focus to the equivalent tab when the deferred boundary mounts.
- [x] Preserve the existing `WorkspaceTabs.List` reorder API while reorder behavior becomes available.
- [x] Use a nominal `26px` tab height between compact Button actions and `28px` form controls.
- [x] Keep close actions vertically centered within the tab height.
- [x] Compose close actions from the shared nominal `20px` icon-only Button with a nominal `14px` glyph and `2px` radius while retaining WorkspaceTabs-owned positioning and overflow fading.
- [x] Move sequential focus into panel content instead of outlining the full panel.

## Open product work

[13/08/26]

- None.

[01/08/26]

- None.

## Work outside the foundation scope

[12/08/26]

- Tab pinning state and interactions, including a pinned area within `WorkspaceTabs.List`.

[11/08/26]

- The earlier exclusions for selection color and drag interaction changes are superseded by the implemented foundation and settled decisions.

[01/08/26]

- Tab selection colors and typography.
- Further drag-and-drop interaction changes.
- Tab overflow and close-action behavior.

## Settled interaction decisions

[13/08/26]

- [x] Keep the close button outside the semantic tab button while composing both actions in one flex item.

[13/08/26]

- [x] Use the tab's inline-start and bottom coordinates as the keyboard reorder-menu anchor.
- [x] Keep a small visual gap between the complete tab title and resting close glyph.

[13/08/26]

- [x] Follow the workspace item model: Tab moves through tabs and close actions, while focus alone does not activate a view.
- [x] Use Enter on a focused tab to open reorder actions.
- [x] Keep the resting close glyph visible in reserved title spacing without applying the larger hit-area fade until close hover or focus.

[13/08/26]

- [x] Use the tabs roving-focus pattern: Tab enters the selected tab, Arrow keys navigate, and Tab leaves the composite.
- [x] Keep Delete as the keyboard close path and Shift plus Arrow as the direct keyboard reorder path.
- [x] Let selected and hovered titles fade beneath the overlaid close action instead of reserving close geometry in every inactive tab.

[13/08/26]

- [x] Use `none`, not `contain`, for horizontal list overscroll because `contain` preserves the local boundary effect while only stopping scroll chaining.

[13/08/26]

- [x] Use the `WorkspaceTabs` namespace for the complete system and `WorkspaceTabs.Tab` for one view tab.
- [x] Use explicit `LeadingArea` and `TrailingArea` composition instead of a side prop or generic actions part.
- [x] Activate pointer-dragged tabs on successful drop rather than drag start.
- [x] Keep full tab titles visible without supplementary title tooltips.

[12/08/26]

- [x] Keep full tab titles visible and let the tab list overflow horizontally instead of compressing items.
- [x] Keep fixed bar actions outside `WorkspaceTabs.List`; the future pinned area belongs inside the list.

[11/08/26]

- [x] Keep selection and focus visually distinct: neutral selected surface for persistent state and the shared blue ring for keyboard destination.
- [x] Keep pointer dragging as a supplemental reorder path while Shift and Arrow keys and the context menu own accessible keyboard reordering.

[07/08/26]

- [x] Use the trailing fade rather than an ellipsis only for tab names that actually clip.
- [x] Separate the title and close regions with the extra-extra-small spacing token.
- [x] Preserve the same leading prefix, visible title, and trailing close structure at every compressed width.
- [x] Reserve close-action width whether the action is visible or hidden so hover, focus, and selection do not shift title geometry.

[06/08/26]

- [x] Apply hover delay and subtle motion to the initial tooltip, then replace adjacent tooltips instantly without entrance motion.

[06/08/26]

- [x] Prefer delayed tooltip replacement over instant spatial jumps between Workspace Tabs targets.

[05/08/26]

- [x] Show the complete tab label in a tooltip whether the rendered label fits or truncates.

[01/08/26]

- [x] Selection does not use the focus-ring color.
- [x] Keyboard focus uses the blue item outline without adding a resting item border.
- [x] Keep every `@dnd-kit` import in `workspaceTabsReorder.tsx` so sortable code remains outside the initial application load.
- [x] Load reorder behavior after the static list mounts, then restore focus to the equivalent tab when the deferred boundary remounts the list.
- [x] Register each sortable tab through its owning `WorkspaceTabs.Tab` ref.
- [x] Do not match controlled tab values to discovered DOM elements by position.
- [x] Keep Workspace Tabs panels out of sequential focus so workspace controls own visible keyboard focus.

## Open design decisions

[01/08/26]

- [ ] Add an `easy-*` animation when closing tabs?

## Validation checklist

[13/08/26]

- [x] Cover the normal-flow close-action composition without changing prefix, title, or close semantics.

[13/08/26]

- [x] Verify close-button hover has one contiguous square surface ending at the tab edge.

[13/08/26]

- [x] Cover Enter menu anchor coordinates and verify the menu position and title-to-close spacing in the browser.

[13/08/26]

- [x] Cover sequential tab and close focus, focus without activation, Enter reorder actions, and close presentation states.
- [x] Verify tab order and resting, focused, and active close presentation in the browser.

[13/08/26]

- [x] Cover Shift plus F10, the Context Menu key, close-action tab order, and overlay composition.
- [x] Verify keyboard traversal and the close overlay in the browser.

[13/08/26]

- [x] Cover successful drag, canceled drag, and normal click selection behavior.
- [x] Verify a real pointer drag preserves content until drop; cover canceled selection with the focused regression test.

[13/08/26]

- [x] Verify the centered `20px` separators and `overscroll-behavior-x: none` on the overflowing native list in the browser.
- [x] Verify Workspace Tabs focused tests, changed-file lint, typecheck, and build.

[13/08/26]

- [x] Cover the renamed compound API, fixed-area composition, drop activation, canceled drag, and title-tooltip removal.
- [x] Verify focused tests, metadata, changed-file lint, typechecks, builds, and package tests.
- [x] Verify opaque fixed-area occlusion, both separators, and successful-drop activation in the browser; cover canceled-drag behavior with the focused DND regression test.

[12/08/26]

- [x] Cover intrinsic item width, fixed actions composition, and selected-item nearest-edge reveal.
- [x] Verify Workspace Tabs and Tables workspace focused tests, changed-file lint, typechecks, builds, and package tests.
- [x] Verify list overflow and fixed action visibility in the browser.

[11/08/26]

- [x] Verify the actual tabs remain the only semantic and sequential-focus targets after deferred reorder behavior loads.

[07/08/26]

- [x] Cover stable title observation across equivalent prefix element identities.
- [x] Cover the reserved close region through its applied Workspace Tabs style.
- [x] Verify Workspace Tabs changed-file lint and the design-system typecheck, build, and package-wide tests.

[06/08/26]

- [x] Cover focus, blur, pointer-enter, pointer-leave, and pointer-down event forwarding from the tab button.
- [x] Confirm close-button pointer and focus interaction does not emit tab intent.
- [x] Verify generated Workspace Tabs item metadata includes the forwarded event contract.
- [x] Verify Workspace Tabs tests, design-system typecheck, lint, and production builds.

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

- [x] Workspace Tabs tests pass.
- [x] Design-system typecheck passes.
- [x] Changed-file lint passes.
- [x] Browser verification confirms resting items have no visible outline.
- [x] Browser verification confirms focus-visible tabs retain a `2px` focus ring.
- [x] Static `WorkspaceTabs` module evaluation does not configure DND sensors.
- [x] Loading reorder behavior preserves the focused tab.
- [x] Sortable behavior registers through each owning tab item ref.
- [x] Product production build passes.
- [x] WorkspaceTabs-specific reorder setup is emitted in a deferred chunk.
- [x] Shared DND dependencies are absent from module-preloaded entry dependencies.
- [x] Panel tests cover content-owned sequential focus.
