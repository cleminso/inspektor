# DatePicker

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/09/26]

- [x] Expose the rendered trigger value as its accessible description while preserving consumer descriptions.

[03/09/26]

- [x] Apply the branded sans font to the deferred calendar loading and error fallback.

[28/08/26]

- [x] Keep `react-day-picker` and timestamp-calendar controls in a deferred implementation module.
- [x] Preserve the popup footprint with an accessible bounded fallback while the calendar loads.
- [x] Cache the deferred module and allow a later mount to retry after a load failure.

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

[03/09/26]

- The trigger label names the action; its rendered value describes the selected date.
- Composed render elements retain their own description relationships.

[28/08/26]

- [x] Defer only DatePicker calendar internals; keep the field-editor interaction loaded immediately.
- [x] Keep bundle assignment automatic instead of adding `manualChunks` or suppressing the chunk warning.

[20/08/26]

- [x] Popup collision measurement reserves the full picker footprint while the visible popup remains compact.

[20/08/26]

- [x] Content owns portal, popup positioning, dismissal, and focus restoration.
- [x] Panel renders the same timestamp workflow inline without popup semantics.
- [x] Calendar owns date navigation while DatePicker owns timestamp validation and application.

## Open design decisions

No unresolved DatePicker design decisions.

## Validation checklist

[03/09/26]

- [x] Cover default and composed trigger descriptions.

[03/09/26]

- [x] Run focused DatePicker tests, changed-file lint, and design-system typecheck.

[28/08/26]

- [x] Verify the production build emits the calendar as an 80.15 kB deferred chunk and reduces the tables route chunk from 570.83 kB to 489.79 kB.
- [x] Run DatePicker loading and behavior tests, affected web tests, package-wide tests, and the production browser timestamp-filter flow.
- [x] Run affected lint, typecheck, and builds.

[20/08/26]

- [x] Run focused Calendar and DatePicker component tests.
- [x] Run focused row-editor and filter-builder tests.
- [x] Run affected package lint, typecheck, build, and package-wide tests.
- [x] Verify popup and inline presentations in both color schemes.
