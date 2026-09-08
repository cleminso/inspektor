# Design system documentation

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

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

[08/09/26]

- [x] Focused layout and code-island tests pass.
- [x] Documentation app lint and typecheck pass.
- [x] Documentation app suite and build pass.
- [x] Interactive and fixed playgrounds are verified in supported color schemes.
