# JSON View

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[24/07/26]

- [x] Register the exported `JsonView` with package-authoritative prop extraction.
- [x] Render JSON objects and arrays through a read-only syntax tree with native selectable text.
- [x] Add disclosure, initial expansion depth, literal search highlighting, and long-string reveal behavior.
- [x] Add WAI-ARIA tree semantics, roving focus, complete tree keyboard navigation, and focus recovery.
- [x] Scope pointer hover and keyboard focus treatment to the interactive row rather than the complete descendant subtree.
- [x] Toggle expandable containers from the complete row without selecting non-leaf text on repeated pointer presses.
- [x] Show the row focus ring for keyboard navigation without retaining it after pointer disclosure.
- [x] Expand matching ancestors, reveal the first search result without moving focus, and communicate `No matches`.
- [x] Bound each expanded branch through keyboard-accessible continuation items.
- [x] Bound the complete expanded tree to 500 tree items with explicit non-actionable exhaustion nodes and focus recovery.
- [x] Keep 4,000-code-point string truncation Unicode-safe with deliberate full reveal.
- [x] Reveal truncated strings from the tree-item keyboard interaction and expose matches beyond the visible prefix.
- [x] Keep initial expansion mount-only so equivalent data identities do not reset user interaction state.
- [x] Derive visible-search budget status from the render plan without synchronized effect state.
- [x] Keep truncated primitive accessible names within the same display budget as visible content.
- [x] Add executable examples for expansion, nested data, empty values, search, narrow long content, and bounded branches.
- [x] Add a focused expansion and search playground.
- [x] Add the static `/components/json-view` documentation route.
- [x] Normalize Jazz rows without indexed `Uint8Array` serialization or loss of unsupported values.
- [x] Add read-only row `JSON` beside editable `Details` in the Table Explorer pane.
- [x] Keep search and whole-row Copy JSON application-owned.

## Open product work

[24/07/26]

- [x] Add a fixed total visible-node budget across simultaneously expanded branches.
- [x] Reuse `JsonView` for read-only structured fields where the normalized root is an object or array.

## Work outside the foundation scope

[24/07/26]

- Editable JSON behavior is not part of the read-only component documentation.

## Settled interaction decisions

[24/07/26]

- Search controls remain outside `JsonView`; the component accepts literal controlled terms.
- Large branches continue in fixed batches instead of exposing an expand-all action.
- Branch, complete-tree, and string thresholds remain fixed internal safeguards rather than consumer configuration.
- Search reports when a real match falls outside the visible budget instead of mounting beyond the limit.

## Open design decisions

[24/07/26]

- None.

## Validation checklist

[24/07/26]

- [x] Documentation tests pass.
- [x] Generated prop metadata is current.
- [x] Documentation typecheck and focused lint pass.
- [x] Documentation production build passes.
- [x] Design-system and Inspector tests, typechecks, focused lint, and builds pass with the application integration.
- [ ] Running-application verification covers narrow panes, keyboard navigation, search, copying, and row changes.
