# Design system documentation

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[09/09/26]

- [x] Render component documentation sections inside one center surface with one scroll owner.
- [x] Pass registry items directly to the shared component page instead of joining them by source path.
- [x] Remove unused package import metadata left behind by the removed installation UI.
- [x] Support coordinated examples with matching right-dock control groups in one playground.
- [x] Use overlay scrolling for component and foundation pages so overflow does not change content width.

[09/09/26]

- [x] Integrate the collapsible source footer into the playground surface.

[08/09/26]

- [x] Use one center playground for every component page.
- [x] Place copyable source in a separate collapsible code island.
- [x] Reserve the right dock for interactive controls and Reset.
- [x] Support fixed playgrounds without invented controls.
- [x] Remove generated props tables and their metadata pipeline.

## Open product work

[08/09/26]

- [ ] Define and author component Best practices guidance using the Geist documentation pattern as a reference.

## Work outside the foundation scope

[08/09/26]

- [x] Do not add an empty Best practices section or placeholder.
- [x] Do not change TanStack routing behavior.

## Settled interaction decisions

[09/09/26]

- [x] One center surface owns the header, playground, code, and vertical scrolling.
- [x] Section dividers replace separate header, playground, and code islands.
- [x] Component pages omit upstream API-reference blocks.
- [x] A playground can render several coordinated instances when comparison is the component's clearest example.
- [x] These decisions supersede the separate-island treatment recorded below.

[09/09/26]

- [x] The collapsed `Code` footer sits at the bottom of the playground without reducing the preview height.
- [x] Expanded source renders at full height and uses the playground's reserved vertical scroll track.

[08/09/26]

- [x] The `Code` island header uses the shared Accordion trigger.
- [x] Code is collapsed by default and exposes copy when expanded.
- [x] Long code scrolls inside the code block without widening the center view.
- [x] Component name and description belong in the center header, not the right dock.
- [x] Right-dock controls use content-aware rows with actions aligned to the right edge.
- [x] Header, playground, and code render as separate borderless surface islands.
- [x] The center canvas remains visible through the gap between islands.
- [x] Right-dock content fills the available dock width.

## Open design decisions

[08/09/26]

- None.

## Validation checklist

[09/09/26]

- [x] Focused page, code, controls, Button, and Accordion tests pass.
- [x] Documentation app lint and typecheck pass.
- [x] Documentation app suite and build pass.
- [x] Shared surface and exemplars are verified in both color schemes.
- [x] Component pages render without API-reference blocks.
- [x] Component and foundation pages preserve center width across short and overflowing content.

[09/09/26]

- [x] Focused playground nesting and scroll-ownership tests pass.
- [x] Documentation app lint, typecheck, and suite pass.
- [x] Collapsed and expanded playgrounds are verified without horizontal layout shift in both color schemes.
- [x] Long expanded source is fully rendered and scrolls on the playground surface.

[08/09/26]

- [x] Focused layout and code-island tests pass.
- [x] Documentation app lint and typecheck pass.
- [x] Documentation app suite and build pass.
- [x] Interactive and fixed playgrounds are verified in supported color schemes.
