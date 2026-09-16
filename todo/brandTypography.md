# Brand typography

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [16/09/26]

- [x] Move page-title and description typography into the semantic hero that owns their DOM.
- [x] Use one `h1` with primary and muted spans instead of separate heading roles.
- [x] Apply the selected responsive type scale and 710px description measure.
- [x] Preload the initial Latin variable WOFF2 to prevent fallback-font layout movement.
- The following blocks record the removed `BrandText` API and are not current.

### [16/09/26]

- [x] Match the selected heading hierarchy and display breakpoints.
- [x] Add intentional block lines for the muted hero continuation.
- [x] Apply the selected muted description treatment and 600px measure.

### [15/09/26]

- [x] Added fixed page-heading, section-heading, and description roles.
- [x] Added the accepted responsive sizes, weight, line heights, tracking, wrapping, and description measure.

## Open product work

### [15/09/26]

- [ ] Compare Instrument Sans stylistic set `ss02` in a representative brand composition.

## Work outside the foundation scope

### [15/09/26]

- Arbitrary elements, type metrics, and consumer styling overrides are unsupported.

## Settled interaction decisions

### [16/09/26]

- Visual hierarchy does not create an additional document heading level.

### [16/09/26]

- The page heading and muted continuation stay in one zero-gap heading group.

### [15/09/26]

- Each role selects a fixed native heading or paragraph element.

## Open design decisions

### [15/09/26]

- Decide whether a future brand revision enables `ss02` for headings.

## Validation checklist

### [16/09/26]

- [x] Verify one heading, responsive typography, description measure, and WOFF2 loading.

### [15/09/26]

- [x] Verify type roles and runtime styling-prop stripping.
- [x] Verify responsive typography and WOFF2 loading in a production browser build.
