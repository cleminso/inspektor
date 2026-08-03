# Context switcher

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/08/26]

- [x] Preserve the shared ghost Button hover and active backgrounds on switcher triggers.

[01/08/26]

- [x] Keep the trigger background visible while its popup is open.
- [x] Use the selected text color for context switcher trigger content while open.
- [x] Preserve shared combobox trigger behavior and button visuals.

## Open product work

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- No changes to popup layout, search behavior, or item styling.

## Settled interaction decisions

[03/08/26]

- The design-system trigger owns ghost Button visuals; application switchers provide inherited text content.

[01/08/26]

- The combobox trigger owns popup-open state styling.
- Context switcher content consumes the combobox trigger text-color contract instead of duplicating open state.

## Open design decisions

[01/08/26]

- None.

## Validation checklist

[01/08/26]

- [x] Run focused context switcher and combobox tests.
- [x] Run design-system typecheck.
- [x] Run changed-file lint.
- [x] Build the design-system package.
