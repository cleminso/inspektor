# DatePicker

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[20/08/26]

- [x] Keep the popup on its initially resolved side while content changes between date, month, and year views.
- [x] Avoid reserving hidden timestamp-control space in month and year views.

[20/08/26]

- [x] Compose Calendar with timestamp input, Set now, and explicit Apply behavior.
- [x] Expose Trigger and Content for popup timestamp fields.
- [x] Expose Panel for inline timestamp-selection steps without nested popup behavior.
- [x] Preserve committed and pending timestamp boundaries when switching presentations.
- [x] Migrate row-editor timestamp fields and filter-builder timestamp steps.

## Open product work

[20/08/26]

- [ ] Compose the trigger onto the inline data-grid cell editor when inline editing is implemented.

## Work outside the foundation scope

[20/08/26]

- [ ] Range, preset, relative-date, and timezone-selection interfaces remain excluded.

## Settled interaction decisions

[20/08/26]

- [x] Popup collision measurement reserves the full picker footprint while the visible popup remains compact.

[20/08/26]

- [x] Content owns portal, popup positioning, dismissal, and focus restoration.
- [x] Panel renders the same timestamp workflow inline without popup semantics.
- [x] Calendar owns date navigation while DatePicker owns timestamp validation and application.

## Open design decisions

No unresolved DatePicker design decisions.

## Validation checklist

[20/08/26]

- [x] Run focused Calendar and DatePicker component tests.
- [x] Run focused row-editor and filter-builder tests.
- [x] Run affected package lint, typecheck, build, and package-wide tests.
- [x] Verify popup and inline presentations in both color schemes.
