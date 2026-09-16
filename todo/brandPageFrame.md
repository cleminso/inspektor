# Brand page frame

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [16/09/26]

- [x] Give the header, main, and footer regions their selected surfaces and boundaries.
- [x] Fix the header and footer at 46px while allowing the main region to fill the remaining viewport.
- [x] Verify the selected 360px, 620px, 1280px, and 1440px frames.

### [15/09/26]

- [x] Added the responsive 1216px central track, 4px canvas spacing, and equal passive desktop columns.
- [x] Added semantic `Header`, `Main`, and `Footer` regions through `@inspektor/ds/brand`.

## Open product work

### [15/09/26]

- [ ] Define same-origin publication separately from the reusable frame.

## Work outside the foundation scope

### [15/09/26]

- Product routing, copy, analytics, and deployment remain application concerns.

## Settled interaction decisions

### [16/09/26]

- The header contains the canonical wordmark. The empty footer remains decorative.

### [15/09/26]

- Passive side columns are generated presentation and do not enter the accessibility tree.

## Open design decisions

### [15/09/26]

- None for the current frame contract.

## Validation checklist

### [15/09/26]

- [x] Verify mobile fill and desktop track arithmetic in a production browser build.
- [x] Verify semantic landmarks and closed styling props.
