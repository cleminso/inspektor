# Tooltip implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[05/08/26]

- [x] Keep Tooltip-owned trigger presentation on the default trigger.
- [x] Preserve a composed trigger's state-driven presentation while the tooltip opens.
- [x] Preserve Base UI tooltip behavior and state attributes on composed triggers.

## Open product work

[05/08/26]

- None.

## Work outside the foundation scope

[05/08/26]

- Tooltip content design and positioning changes.

## Settled interaction decisions

[05/08/26]

- [x] A composed trigger owns its presentation; Tooltip contributes behavior and state attributes.

## Open design decisions

[05/08/26]

- None.

## Validation checklist

[05/08/26]

- [x] Tooltip, Tab View, and Field tests pass.
- [x] Browser verification confirms Tab View classes and geometry remain stable while its tooltip is open.
