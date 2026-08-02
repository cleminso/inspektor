# Toaster

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[01/08/26]

- [x] Deduplicate matching notifications by using their content as the default semantic ID.
- [x] Preserve explicit IDs so callers can keep matching notification content separate.
- [x] Replay a reduced-motion-safe pulse when Base UI upserts a visible notification.
- [x] Use a neutral toast surface and text treatment for every status.
- [x] Express success, warning, and error status through semantic borders without colored backgrounds.

## Open product work

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- Promise notification identity remains managed by Base UI.

## Settled interaction decisions

[01/08/26]

- Matching notification content updates the mounted notification and refreshes its dismissal timer.
- The initial notification does not pulse; only repeated notifications pulse.
- Status does not change the toast text or surface color.

## Open design decisions

[27/07/26]

- None.

## Validation checklist

[01/08/26]

- [x] Run the focused toaster tests.
- [x] Run the design-system typecheck.
- [x] Run focused lint for the toaster files.
- [x] Build the design-system package.
- [x] Verify neutral status surfaces in the focused toaster tests.
