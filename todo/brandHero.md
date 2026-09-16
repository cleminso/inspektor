# Brand hero

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [16/09/26]

- [x] Replace public layout parts and generic text roles with semantic string inputs.
- [x] Render the primary title and muted continuation inside one page-level heading.
- [x] Apply 42px block padding and 16px inline padding to the private content frame at every supported width.
- [x] Set the description maximum measure to 710px.

### [16/09/26]

- The following block records the replaced compound hero and is not current.

### [16/09/26]

- [x] Add a top-aligned hero frame with 42px block padding and a message with 12px inline padding.
- [x] Increase block padding to 84px at 1471px desktop breakpoint.
- [x] Add message and heading groups with the selected 18px and zero-gap relationships.
- [x] Keep the section unpadded and expose separate content, padded frame, and message layers.

## Open product work

### [16/09/26]

- [ ] Add an action input and internal action region only when the website call to action is accepted.

## Work outside the foundation scope

### [16/09/26]

- Call-to-action behavior and destination remain website concerns.

## Settled interaction decisions

### [16/09/26]

- The route owns hero copy; the component owns heading semantics, typography, and internal wrappers.
- The semantic section remains unpadded; its private content frame owns the responsive gutters.
- The hero does not render an empty action region.

### [16/09/26]

- Hero content remains aligned to the top while the main surface fills the viewport.

## Open design decisions

### [16/09/26]

- None for the accepted message composition.

## Validation checklist

### [16/09/26]

- [x] Verify the hero exposes one `h1`, no `h2`, and no consumer-owned children or styling props.
- [x] Verify responsive typography and spacing in a production browser build.

### [16/09/26]

- [x] Verify hierarchy and spacing at the selected responsive frame sizes.
- [x] Verify the hero API excludes consumer styling escape hatches.
