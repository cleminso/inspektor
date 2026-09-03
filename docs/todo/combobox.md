# Combobox

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/09/26]

- [x] Keep item labels and descriptions visually distinct and expose them as separate accessible name and description content.

## Open product work

None.

## Work outside the foundation scope

None.

## Settled interaction decisions

[03/09/26]

- `Combobox.Item` owns required label content and an optional description; a separate `ItemText` part is unnecessary.
- Consumer-provided accessible names and descriptions take precedence and remain composed with generated descriptions.

## Open design decisions

None.

## Validation checklist

[03/09/26]

- [x] Cover generated and consumer-provided item names and descriptions.
- [x] Regenerate and verify public prop metadata.
