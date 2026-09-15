# Combobox

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[15/09/26]

- [x] Reserve the trailing indicator track only for items that render the standard check indicator.
- [x] Let items without indicators determine content-width popup geometry without empty trailing space.

[04/09/26]

- [x] Use the focused border for the search input group without adding an outer focus ring.

[03/09/26]

- [x] Keep item labels and descriptions visually distinct and expose them as separate accessible name and description content.

## Open product work

None.

## Work outside the foundation scope

None.

## Settled interaction decisions

[15/09/26]

- Check-bearing item collections reserve a stable indicator column; indicator-free collections do not.

[04/09/26]

- The compound search input communicates focus through its border rather than an additional outer ring.

[03/09/26]

- `Combobox.Item` owns required label content and an optional description; a separate `ItemText` part is unnecessary.
- Consumer-provided accessible names and descriptions take precedence and remain composed with generated descriptions.

## Open design decisions

None.

## Validation checklist

[15/09/26]

- [x] Run focused StyleX lint and affected component checks.
- [x] Verify check-bearing and indicator-free item geometry in both color schemes in a fresh browser context.

[04/09/26]

- [x] Remove React-managed focus-visible state and its implementation-only test.
- [x] Run changed-file lint, design-system typecheck, build, and package tests.
- [ ] Verify the focused search input border in a fresh browser context.

[03/09/26]

- [x] Cover generated and consumer-provided item names and descriptions.
- [x] Regenerate and verify public prop metadata.
