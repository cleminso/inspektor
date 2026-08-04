# JSON View

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/07/26]

- [x] Register the exported `JsonView` with package-authoritative prop extraction.
- [x] Render JSON objects and arrays through a read-only syntax tree with native selectable text.
- [x] Add disclosure, initial expansion depth, literal search highlighting, and long-string reveal behavior.
- [x] Add WAI-ARIA tree semantics, roving focus, value-node keyboard navigation, and focus recovery.
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
- [x] Normalize Jazz row values into strict JSON-compatible values, representing bytes, unavailable values, non-finite numbers,
      cycles, and unsupported values through explicit tagged objects.
- [x] Add read-only row `JSON` beside editable `Details` in the Table Explorer pane.
- [x] Keep search application-owned while `JsonView` owns a sticky root action that copies the complete two-space-formatted JSON.
- [x] Use `JsonView` as an object-or-array fallback when a read-only structured runtime value cannot be represented safely as
      `CodeEditor` source.

[04/08/26]

- [x] Expose ordered occurrence results, wrap controlled navigation, distinguish the active mark, and preserve focus in
      an external Find Bar.
- [x] Support controlled case-sensitive, whole-word, and regular-expression matching without moving search controls into the tree.
- [x] Reserve the row JSON scroll gutter so search-driven expansion does not resize the tree or sticky copy action.

## Open product work

[24/07/26]

- [ ] Render object and array rows with a selectable representation whose punctuation is valid JSON.
- [ ] Add and test Arrow Left parent navigation from continuation tree items.
- [ ] Cover active-path recovery when replacement data removes the focused or expanded path.
- [ ] Add an executable keyboard-navigation and focus example.

## Work outside the foundation scope

[24/07/26]

- Editable JSON behavior is not part of the read-only component documentation.

## Settled interaction decisions

[29/07/26]

- Search controls remain outside `JsonView`; the component accepts a controlled query and matching options.
- Search navigation uses ordered textual occurrences, wraps at both ends, highlights the active occurrence, and preserves focus in
  the external Find Bar.
- Copy remains outside the ARIA tree while aligning with the root row and staying sticky within the JSON surface.
- Copy serializes the complete input with two-space indentation, independent of disclosure, search, and rendering limits.
- Root disclosure hover and focus treatment remains content-sized instead of extending beneath the separate copy action.
- Large branches continue in fixed batches instead of exposing an expand-all action.
- Branch, complete-tree, and string thresholds remain fixed internal safeguards rather than consumer configuration.
- Search reports when a real match falls outside the visible budget instead of mounting beyond the limit.
- The application-owned row JSON scroll container reserves a stable classic-scrollbar gutter below the external Find Bar.

## Open design decisions

[24/07/26]

- [ ] Review semantic syntax-color tokens across supported themes.
- [ ] Decide whether normalization, search, and Copy traversal require a worker or traversal budget.
- [ ] Decide the accessible naming and visual representation of root-array indices.

## Validation checklist

[24/07/26]

- [x] Documentation tests pass.
- [x] Generated prop metadata is current.
- [x] Documentation typecheck and focused lint pass.
- [x] Documentation production build passes.
- [ ] Re-run and record cross-package tests, typechecks, focused lint, generated-prop checks, and builds against the current
      application integration.
- [ ] Running-application verification covers narrow panes, keyboard navigation, search, copying, and row changes.
- [x] Row JSON search expansion preserves the tree and copy-action inline positions when vertical overflow changes.
