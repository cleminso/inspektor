# Middle Truncate

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks responsive middle truncation for identity-bearing strings.

## Implemented foundation

[05/08/26]

- [x] Preserve balanced leading and trailing grapheme clusters around one ellipsis.
- [x] Recalculate the preview from the rendered width and inherited typography.
- [x] Keep the complete value available to assistive technology when the visible preview is truncated.

## Open product work

[05/08/26]

No open product work is recorded.

## Work outside the foundation scope

[05/08/26]

- [x] Keep the low-level truncation utility out of the design-system documentation navigation; demonstrate it through components that use it.

[05/08/26]

- [x] Keep tooltips and copy actions owned by the surface presenting the value.

## Settled interaction decisions

[05/08/26]

- [x] Keep end truncation for prefix-oriented structured previews; reserve middle truncation for identity-bearing values.

[05/08/26]

- [x] Use end truncation for ordinary labels and prose.
- [x] Keep fixed actions and navigation indicators outside the truncation boundary.

## Open design decisions

[05/08/26]

No open design decisions are recorded.

## Validation checklist

[05/08/26]

- [x] Verify focused component tests, package checks, documentation generation, and browser resizing.
