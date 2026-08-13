# Calendar

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[13/08/26]

- [x] Preserve canonical timestamp milliseconds when opening and applying unchanged values.
- [x] Enforce minimum and maximum bounds against the complete pending timestamp.
- [x] Restore the committed month after dismissing calendar navigation.
- [x] Replace native required-field copy with format-specific time guidance.

[13/08/26]

- [x] Compose the time control from design-system Field and Input primitives.
- [x] Show time validation after blur and expose touched and invalid Base UI states.
- [x] Vertically center default trigger content without horizontally centering it.
- [x] Show visible keyboard focus on the native month and year selectors.

[13/08/26]

- [x] Preserve React DayPicker's roving day focus so arrow keys move through dates.
- [x] Keep month, year, and previous and next navigation in the tab order.
- [x] Keep invalid time text editable, mark it invalid, and disable Apply until corrected.
- [x] Center the default timestamp trigger with flex alignment as well as text alignment.

[13/08/26]

- [x] Keep date entry on the calendar grid and expose only the time input below it.
- [x] Initialize the time input from local time when an empty Calendar opens.
- [x] Use compact design-system typography and center timestamp control values.

[13/08/26]

- [x] Add one compound Calendar with an interchangeable trigger and shared timestamp popup.
- [x] Use React DayPicker for single-date selection, keyboard navigation, and calendar semantics.
- [x] Use separate month and year selectors with previous and next navigation.
- [x] Show six stable weeks with selectable outside-month dates.
- [x] Preserve the existing time when selecting another date.
- [x] Initialize the current time when selecting the first date from an empty value.
- [x] Keep Set now pending until Apply.
- [x] Integrate the Calendar into timestamp fields without changing DEFAULT or NULL modes.

## Open product work

[13/08/26]

- [ ] Compose the Calendar trigger onto the inline data-grid cell editor when inline editing is implemented.

## Work outside the foundation scope

[13/08/26]

- [ ] Range, multiple-date, preset, relative-date, and timezone-selection interfaces are excluded.
- [ ] Inline row draft ownership and save behavior remain part of inline editing.

## Settled interaction decisions

[13/08/26]

- [x] Time validation uses `HH:MM:SS` and reports timestamp boundary violations beside the control.
- [x] Minimum and maximum values constrain complete timestamps rather than calendar days alone.

[13/08/26]

- [x] Form fields use the default input-styled button trigger.
- [x] Data-grid cells may provide another native button through Calendar.Trigger composition.
- [x] Closing without Apply discards pending changes.
- [x] Opening an empty value focuses today without selecting it.
- [x] Opening an empty value initializes the time control without selecting a date.
- [x] Selecting an outside-month date changes the visible month.
- [x] Jazz receives the applied instant through UTC ISO text and epoch-millisecond conversion.

## Open design decisions

[13/08/26]

- [ ] None within the timestamp form foundation.

## Validation checklist

[13/08/26]

- [x] Run focused Calendar, timestamp field, and timestamp presentation tests.
- [x] Run changed-file StyleX lint.
- [x] Run design-system, application, and documentation package validation.

[13/08/26]

- [x] Run focused Calendar and timestamp field tests.
- [x] Run changed-file StyleX lint.
- [x] Verify focus restoration and popup dismissal in the browser.
- [x] Verify light and dark theme rendering.
- [x] Run design-system and application typecheck and build.
- [x] Run design-system documentation generation, tests, typecheck, lint, and build.
