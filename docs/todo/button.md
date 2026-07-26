# Button

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[26/07/26]

- [x] Optically balance centered buttons with a prefix, suffix, or loading spinner on only one side.
- [x] Share optical alignment behavior between `Button` and `ButtonLink`.
- [x] Preserve symmetric padding for text-only, two-sided, square, flush, start-aligned, and distributed buttons.

## Open product work

[26/07/26]

- None.

## Work outside the foundation scope

[26/07/26]

- Select, tab, accordion, menu, and arbitrary-child control alignment remain separate component concerns.

## Settled interaction decisions

[26/07/26]

- Optical padding is automatic and is not exposed as a consumer styling prop.
- One-sided content redistributes existing inline padding without changing the button width.

## Open design decisions

[26/07/26]

- None.

## Validation checklist

[26/07/26]

- [x] Run focused Button and ButtonLink tests, type checking.
