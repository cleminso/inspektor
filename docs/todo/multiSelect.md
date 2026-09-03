# Multi Select implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/09/26]

- [x] Expose the rendered trigger summary as its accessible description while preserving consumer descriptions.

[02/09/26]

- [x] Enter the contextual-action column from dialog focus with Up or Down, matching pointer activation of the row label.

[02/09/26]

- [x] Compose Popover and the public Checkbox Group component instead of owning selection rows and bulk actions.

[11/08/26]

- [x] Do not emit virtual set-position metadata for fully mounted checkbox options.
- [x] Defer offscreen rendering above 50 options while retaining the complete mounted collection, keyboard order, and stable item identity.

[05/08/26]

- [x] Size the option viewport to its collection until the configured maximum height is reached.
- [x] Replace the native option scrollbar treatment with an overflow-aware overlay track.

[05/08/26]

- [x] Present the complete known item collection without query state, filtering, or search-specific content props.
- [x] Focus the dialog surface on open and enter the first or last mutable row with Down or Up.

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

[05/08/26]

- [x] Keep asynchronous and externally filtered collection support in Combobox rather than Multi Select.

[28/07/26]

- [ ] Add asynchronous and externally filtered item support when a consumer requires it.
- [ ] Add virtualization when a represented collection exceeds bounded popup rendering.

## Work outside the foundation scope

[05/08/26]

- Search and filtered collection selection; use Combobox when query-driven filtering is required.

[28/07/26]

- Arbitrary item renderers and styling slots.
- Reorderable items.
- Free-form values outside the known item collection.

## Settled interaction decisions

[03/09/26]

- The trigger label names the action; its rendered summary describes the selected values.
- Composed render elements retain their own description relationships.

[02/09/26]

- [x] Up and Down from initial dialog focus enter the last or first mutable row's contextual action; Left then moves to its checkbox.
- [x] Pointer-focused contextual labels hide after pointer exit; keyboard-visible focus keeps the active label visible.

[05/08/26]

- [x] Keep scrollbar chrome hidden when the complete option collection fits in the viewport.

[05/08/26]

- [x] Multi Select presents a known collection directly rather than combining selection with search.
- [x] Initial dialog focus keeps checkbox and contextual-action focus as separate row columns.

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

[03/09/26]

- [x] Cover default and composed trigger descriptions.

[02/09/26]

- [x] Focused and package tests cover dialog entry into contextual actions.
- [x] Package formatting, lint, typecheck, build, documentation build, and product column-visibility tests pass.
- [x] Browser verification confirms Down enters the first mutable row action.

[05/08/26]

- [x] Focused Multi Select and Scroll Area tests pass.
- [x] Package typecheck, build, and changed-file lint pass.
- [x] Browser verification covers fitting and overflowing option collections.

[05/08/26]

- [x] Package tests, typecheck, build, and changed-file lint pass.
- [x] Documentation prop generation and check, typecheck, build, focused extractor test, and changed-file lint pass.
- [x] Product application typecheck and changed-file lint pass.
- [ ] Full documentation tests remain blocked by the unrelated Code Editor extractor expectation for the removed `toolbarLabel` prop.

[29/07/26]

- [x] Package tests pass.
- [x] Package typecheck passes.
- [x] Package build passes.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [x] Product application tests, typecheck, lint, and build pass.
- [x] Browser verification covers pointer, keyboard, filtering, bulk actions, and focus restoration.
