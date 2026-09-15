# Input Group

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[14/09/26]

- [x] Let the complete checkbox-label segment drive the nested checkbox hover border.
- [x] Add a full-segment icon-only navigation member for native and composed links.

[03/09/26]

- [x] Register checkbox tooltip guidance as the checkbox description.

## Open product work

None.

## Work outside the foundation scope

None.

## Settled interaction decisions

[14/09/26]

- Icon-only navigation uses anchor semantics and makes the complete trailing segment interactive.
- Input-group action segments remain transparent while their nested control affordances show hover state.

[03/09/26]

- Tooltip content is visual duplication and does not repeat the registered accessible description.

## Open design decisions

None.

## Validation checklist

[14/09/26]

- [x] Cover router-link composition and accessible naming with a focused component test.
- [x] Verify checkbox-label hover, navigation hit area, and focus visibility in the browser.

[03/09/26]

- [x] Query checkbox guidance through its accessible description.
