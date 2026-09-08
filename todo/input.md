# Input

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks the reusable Input component.

## Implemented foundation

[11/08/26]

- [x] Share one token-backed focus-visible outline across Input, Select, and Input Group, switching to danger only for focus-visible invalid state.

[06/08/26]

- [x] Show a solid blue border and subtle blue outer ring while standalone and grouped inputs are focused.
- [x] Keep the neutral border and remove the outer ring while inputs are unfocused.

[05/08/26]

- [x] Provide constrained proportional and monospace font variants.
- [x] Keep proportional typography as the default for general-purpose inputs.
- [x] Document raw data entry as the intended use for the monospace variant.

## Open product work

[05/08/26]

No open product work is recorded.

## Work outside the foundation scope

[05/08/26]

- [x] Keep application-specific decisions about which values use monospace in consuming features.

## Settled interaction decisions

[11/08/26]

- [x] Supersede pointer-focused outlines with focus-visible outlines so pointer interaction does not retain keyboard-focus presentation.

[06/08/26]

- [x] Apply the focused treatment for pointer focus and focus-visible interaction.
- [x] Let `InputGroup` own the focused border and ring for grouped inputs.

[05/08/26]

- [x] Expose font choice as a constrained `sans` or `mono` component prop rather than a styling escape hatch.

## Open design decisions

[05/08/26]

No open design decisions are recorded.

## Validation checklist

[06/08/26]

- [x] Run focused tests, typecheck, lint, and package build.
- [ ] Verify standalone and grouped focus treatments in the browser.

[05/08/26]

- [x] Run focused tests, generated-props validation, typechecks, lint, builds, and browser verification.
