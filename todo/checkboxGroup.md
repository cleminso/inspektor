# Checkbox Group implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[02/09/26]

- [x] Hide contextual action labels after pointer activation and pointer exit while retaining them for keyboard-visible focus.

[02/09/26]

- [x] Provide controlled and uncontrolled string-value selection.
- [x] Own checkbox toggling, contextual `Check all` and `Only` actions, and disabled-item preservation as one stateful unit.
- [x] Support row and action-column navigation with Arrow, Home, and End keys.
- [x] Retain the complete collection while optionally deferring offscreen row layout and paint.
- [x] Export and document the constrained `Root` and `List` compound API.

## Open product work

No open product work is recorded for the implemented foundation.

## Work outside the foundation scope

[02/09/26]

- Search, asynchronous items, free-form values, and arbitrary row renderers remain outside Checkbox Group.
- Standalone bulk-action components remain outside the design system because their meaning depends on complete checkbox group state.

## Settled interaction decisions

[02/09/26]

- [x] Contextual action labels are visible on row hover or keyboard-visible focus, not persistent pointer focus.

[02/09/26]

- [x] Checkbox activation changes one value.
- [x] `Check all` selects every mutable item while preserving selected disabled items.
- [x] `Only` selects its row while preserving selected disabled items.
- [x] Up and Down preserve the focused checkbox or action column.
- [x] Left and Right switch between an item's checkbox and contextual action.

## Open design decisions

No open design decisions are recorded for the implemented foundation.

## Validation checklist

[02/09/26]

- [x] Focused and package tests, formatting, lint, typecheck, build, and documentation build pass.
- [x] Browser verification confirms pointer-focused action labels hide after pointer exit and keyboard-focused labels remain visible.

[02/09/26]

- [x] Focused Checkbox Group and Multi Select tests pass.
- [x] Package formatting, lint, typecheck, build, and tests pass.
- [x] Documentation prop generation, lint, typecheck, and build pass.
- [ ] Documentation Vitest coverage passes; the complete documentation test command remains blocked by the unrelated Tooltip extractor expectation for the `delay` default.
- [x] Browser verification covers standalone and popup composition.
