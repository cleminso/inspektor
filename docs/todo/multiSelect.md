# Multi Select implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/07/26]

- [x] Provide controlled and uncontrolled string-value selection.
- [x] Render searchable checkbox rows in a Base UI popover.
- [x] Keep the popup open across repeated checkbox changes.
- [x] Keep disabled selected options visible and immutable.
- [x] Expose contextual `Check all` and `Only` row actions on hover and focus.
- [x] Keep option text non-selectable and compose each option label and contextual hint inside one neutral native button.
- [x] Preserve disabled selections through bulk actions.
- [x] Support row navigation and checkbox/action focus switching with arrow keys.
- [x] Toggle focused checkboxes with Enter or Space.
- [x] Restore trigger focus after Escape dismissal.
- [x] Render a query-specific empty state.
- [x] Derive selection and mutable-option navigation indexes once per popup render.
- [x] Export and document the constrained compound API.

## Open product work

[28/07/26]

- [ ] Add asynchronous and externally filtered item support when a consumer requires it.
- [ ] Add virtualization when a represented collection exceeds bounded popup rendering.

## Work outside the foundation scope

[28/07/26]

- Arbitrary item renderers and styling slots.
- Reorderable items.
- Free-form values outside the known item collection.

## Settled interaction decisions

[29/07/26]

- [x] Checkbox activation changes one value without closing the popup.
- [x] The checkbox toggles one value while the adjacent label button runs the contextual bulk action.
- [x] Contextual actions use native button semantics without link coloring or a public Button variant.
- [x] The contextual action says `Check all` for a selected item in a partial selection.
- [x] The contextual action says `Only` for unchecked items and complete selections.
- [x] Up and Down preserve the focused checkbox or action column.
- [x] Left and Right switch between an item's checkbox and contextual action.
- [x] Tab leaves the popup through native focus order.

## Open design decisions

[28/07/26]

- [ ] Decide whether large item collections require persistent action labels on touch interfaces.

## Validation checklist

[29/07/26]

- [x] Package tests pass.
- [x] Package typecheck passes.
- [x] Package build passes.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [x] Product application tests, typecheck, lint, and build pass.
- [x] Browser verification covers pointer, keyboard, filtering, bulk actions, and focus restoration.
