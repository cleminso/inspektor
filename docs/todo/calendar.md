# Calendar

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[20/08/26]

- [x] Use the same accent-filled selected treatment for dates, months, years, and active selector headers.
- [x] Preserve compact month and year grids without reserved empty control space.

[20/08/26]

- [x] Separate the standalone date-selection surface from timestamp picker composition.
- [x] Keep day, month, year, boundary, and keyboard-navigation behavior in Calendar.
- [x] Support controlled and uncontrolled standalone date selection.

[20/08/26]

- [x] Hide time and Apply controls while month or year selection is active.
- [x] Let month and year grids size to compact content, superseding the earlier stable-height behavior for selector views.

[20/08/26]

- [x] Replace native month and year selectors with in-calendar selection grids.
- [x] Keep month and year navigation separate from the pending timestamp until a day is selected.
- [x] Add roving focus, directional keyboard navigation, selection focus, and selector Escape handling.
- [x] Keep the calendar body height stable across day, month, and year views.

[13/08/26]

- [x] Compact the popup controls, calendar cells, spacing, and actions.
- [x] Let InputGroup own grouped trigger styling without affecting popup controls.
- [x] Initialize an empty Calendar with the current date and time when opened.
- [x] Show applied timestamps in row-editor triggers and disabled empty inputs in NULL mode.

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

[20/08/26]

- [x] Supersede the Calendar trigger item below; inline timestamp trigger work is tracked by DatePicker.

[13/08/26]

- [ ] Compose the Calendar trigger onto the inline data-grid cell editor when inline editing is implemented.

## Work outside the foundation scope

[20/08/26]

- [ ] Timestamp input, explicit Apply, trigger, and popup behavior belong to DatePicker.

[13/08/26]

- [ ] Range, multiple-date, preset, relative-date, and timezone-selection interfaces are excluded.
- [ ] Inline row draft ownership and save behavior remain part of inline editing.

## Settled interaction decisions

[20/08/26]

- [x] Treat the timestamp-specific decisions below as DatePicker contracts; Calendar owns date selection only.

[20/08/26]

- [x] Selected dates, months, and years use the same accent background and on-accent foreground.

[20/08/26]

- [x] Timestamp controls appear only in the day-selection view.

[20/08/26]

- [x] Month selection uses a twelve-month grid and disables header navigation while the grid is open.
- [x] Year selection uses twenty-year pages controlled by the header navigation buttons.
- [x] Selecting a month or year returns to the day grid without changing the pending timestamp.
- [x] Escape returns from a month or year grid before it closes the Calendar surface.
- [x] Month and year header buttons do not use dropdown chevrons.

[13/08/26]

- [x] Time validation uses `HH:MM:SS` and reports timestamp boundary violations beside the control.
- [x] Minimum and maximum values constrain complete timestamps rather than calendar days alone.

[13/08/26]

- [x] Form fields use the default input-styled button trigger.
- [x] Data-grid cells may provide another native button through Calendar.Trigger composition.
- [x] Closing without Apply discards pending changes.
- [x] Opening an empty value selects the current local date and time as the pending value.
- [x] Selecting an outside-month date changes the visible month.
- [x] Jazz receives the applied instant through UTC ISO text and epoch-millisecond conversion.

## Open design decisions

No unresolved Calendar design decisions.

## Validation checklist

[20/08/26]

- [x] Cover standalone controlled and uncontrolled selection with focused tests.
- [x] Cover standalone month and year selector composition with focused tests.

[20/08/26]

- [x] Run focused Calendar tests and changed-file lint.
- [x] Run design-system package tests, typecheck, and build.
- [x] Run design-system documentation checks, tests, typecheck, lint, and build.
- [x] Verify day, month, and year views in light and dark themes.
- [x] Verify selector keyboard navigation, focus restoration, and Escape behavior in the browser.

[13/08/26]

- [x] Run focused Calendar and row-editor timestamp tests.
- [x] Run changed-file lint and affected package validation.
- [x] Verify the compact grouped Calendar popup in the browser.

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
