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

[05/08/26]

- [x] Expose font choice as a constrained `sans` or `mono` component prop rather than a styling escape hatch.

## Open design decisions

[05/08/26]

No open design decisions are recorded.

## Validation checklist

[05/08/26]

- [x] Run focused tests, generated-props validation, typechecks, lint, builds, and browser verification.
