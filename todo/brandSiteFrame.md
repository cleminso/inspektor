# Brand site frame

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [17/09/26]

- [x] Scope soft-neutral browser text selection to the brand frame.

### [16/09/26]

- [x] Replace public page-region parts with one closed `BrandSiteFrame` content API.
- [x] Keep the header, main surface, passive columns, and decorative bottom strip private.
- [x] Set the selected 52px header, 46px bottom strip, 1216px center, and 4px canvas geometry.
- [x] Keep header gutters on its private content frame rather than its outer surface.
- [x] Verify the selected 360px, 620px, 1280px, 1440px, and 1621px frames.

### [16/09/26]

- The following block records the replaced compound frame and is not current.

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

### [17/09/26]

- Browser text selection uses gray300 behind gray900 text in light mode and neutral700 behind neutral50 text in dark mode.
- Descendant components can override the inherited brand selection when they own a specialized text-selection treatment.

### [16/09/26]

- The header contains the canonical wordmark. The empty bottom strip is decorative and does not create a content-info landmark.
- Main children remain application-ordered sections on one continuous surface.

### [16/09/26]

- The header contains the canonical wordmark. The empty footer remains decorative.

### [15/09/26]

- Passive side columns are private presentation and do not enter the accessibility tree.

## Open design decisions

### [15/09/26]

- None for the current frame contract.

## Validation checklist

### [17/09/26]

- [x] Verify inherited text-selection colors in both supported color schemes.

### [16/09/26]

- [x] Cover the closed content API, one main landmark, and decorative bottom strip in component tests.
- [x] Verify exact geometry and both color schemes in a production browser build.

### [15/09/26]

- [x] Verify mobile fill and desktop track arithmetic in a production browser build.
- [x] Verify semantic landmarks and closed styling props.
