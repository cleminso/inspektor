# Theme Switch

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[20/09/26]

- [x] Provide a shared `ThemeProvider` adapter that restores persisted themes when a document returns from browser history.

[08/09/26]

- [x] Provide a controlled light and dark theme switch through `@inspektor/ds`.
- [x] Compose the control from Button, Button.Glyph, Tooltip, and Lucide artwork.
- [x] Animate icon changes with an exit-then-enter sequence and reduced-motion fallback.

## Open product work

[08/09/26]

- None.

## Work outside the foundation scope

[20/09/26]

- Application roots own provider placement and configuration, theme activation CSS, and browser metadata.

[08/09/26]

- Theme providers, persistence, system-theme resolution, and browser metadata remain application responsibilities.
- Additional theme modes require a separate interaction design.

## Settled interaction decisions

[08/09/26]

- The visible icon and accessible copy describe the destination theme.
- Activating the control requests the opposite explicit light or dark theme.
- The compact Button size and ghost treatment are fixed parts of the component contract.

## Open design decisions

[08/09/26]

- None.

## Validation checklist

[08/09/26]

- [x] Verify both animation directions and rapid changes.
- [x] Verify reduced-motion behavior.
- [x] Verify light and dark rendered states, accessible names, tooltip copy, and focus visibility.
