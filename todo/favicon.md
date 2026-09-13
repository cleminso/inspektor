# Inspektor favicon

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [13/09/26]

- [x] Add the modular Inspektor I to both existing favicon assets.
- [x] Use the blue brand background and an off-white foreground.
- [x] Add a raster favicon fallback for Safari and older WebKit browsers.

## Open product work

### [13/09/26]

- None.

## Work outside the foundation scope

### [13/09/26]

- [ ] Application icons for installed or pinned experiences.

## Settled interaction decisions

### [13/09/26]

- [x] Preserve the existing theme-aware favicon metadata paths.
- [x] Keep the raster fallback independent of runtime theme switching.

## Open design decisions

### [13/09/26]

- None.

## Validation checklist

### [13/09/26]

- [x] Review the favicon at native and enlarged sizes.
- [x] Confirm both SVG files remain valid and build output preserves them.
- [x] Confirm the ICO fallback is valid and preserved in build output.
