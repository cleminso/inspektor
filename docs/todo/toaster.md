# Toaster

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[27/07/26]

- [x] Deduplicate matching notifications by using their content as the default semantic ID.
- [x] Preserve explicit IDs so callers can keep matching notification content separate.
- [x] Replay a reduced-motion-safe pulse when Base UI upserts a visible notification.

## Open product work

[27/07/26]

- None.

## Work outside the foundation scope

[27/07/26]

- Promise notification identity remains managed by Base UI.

## Settled interaction decisions

[27/07/26]

- Matching notification content updates the mounted notification and refreshes its dismissal timer.
- The initial notification does not pulse; only repeated notifications pulse.

## Open design decisions

[27/07/26]

- None.

## Validation checklist

[27/07/26]

- [x] Run the focused toaster tests.
- [x] Run the design-system typecheck.
- [x] Run focused lint for the toaster files.
- [x] Build the design-system package.
