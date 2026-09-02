# JSON View

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[02/09/26]

- [x] Place sticky root actions directly in the JSON root row.

[02/09/26]

- [x] Size sticky root actions to the compact JSON row so their hit surfaces remain unclipped.
- [x] Add a sticky expand-all or collapse-all action immediately before Copy.
- [x] Keep complete expansion within the existing branch and complete-tree render budgets.
- [x] Hide both sticky root actions when a containing document surface owns its own controls.

[27/08/26]

- [x] Isolate complete-tree render planning from React and jsdom while preserving package-private ownership.
- [x] Cover expansion depth, child batching, complete-tree limits, and budget reallocation in Node.
- [x] Keep focused jsdom coverage for continuation wiring, visible-limit communication, accessibility, and focus recovery.

[12/08/26]

- [x] Preserve the active match's ancestor branch when a successful search closes.
- [x] Correlate deferred search results with the query that produced them so consumers can reject stale result labels.
- [x] Support safe initial expansion through depth four for document-specific inspection surfaces.
- [x] Let containing surfaces reset expansion through React keys while preserving JsonView's mount-only default expansion.
- [x] Allow containing surfaces to hide the sticky JSON copy action and own copy placement.
- [x] Support safe initial expansion of every nested container while preserving branch and complete-tree rendering limits.

[11/08/26]

- [x] Defer complete-tree search while exposing stale-search status through the external Find Bar without changing occurrence results.

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
- [x] Keep the row JSON scroll container free of reserved gutter space while search-driven expansion remains inside its bounded viewport.

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

[02/09/26]

- The root expansion action changes every expandable path within the safe render budget; large branch continuation remains explicit.
- The JSON root row contains a flexible trigger group and a fixed action group; hover and focus stay on the chevron and punctuation content.
- Root actions use pressed state to communicate complete expansion.

[12/08/26]

- Closing a successful search removes its highlights but preserves the active match's ancestor branch.
- Closing a search with no active match restores the existing expansion state without retaining search-generated branches.

[12/08/26]

- Schema and permissions surfaces may place copy beside their document-level actions while `JsonView` continues to serialize the complete input.
- Safe complete expansion remains bounded by the existing branch and complete-tree safeguards.

[29/07/26]

- Search controls remain outside `JsonView`; the component accepts a controlled query and matching options.
- Search navigation uses ordered textual occurrences, wraps at both ends, highlights the active occurrence, and preserves focus in
  the external Find Bar.
- Copy stays in the sticky JSON root row.
- Copy serializes the complete input with two-space indentation, independent of disclosure, search, and rendering limits.
- Root action clicks do not toggle the root disclosure.
- Large branches continue in fixed batches even when complete expansion is requested.
- Branch, complete-tree, and string thresholds remain fixed internal safeguards rather than consumer configuration.
- Search reports when a real match falls outside the visible budget instead of mounting beyond the limit.
- The application-owned row JSON scroll container uses the shared scrollbar treatment below the external Find Bar without reserving an empty inline strip.

## Open design decisions

[24/07/26]

- [ ] Review semantic syntax-color tokens across supported themes.
- [ ] Decide whether normalization, search, and Copy traversal require a worker or traversal budget.
- [ ] Decide the accessible naming and visual representation of root-array indices.

## Validation checklist

[02/09/26]

- [x] Focused JSON View coverage verifies complete expansion, complete collapse, action order, and containing-surface ownership.
- [x] Design-system package tests, lint, typecheck, and build pass.
- [x] Documentation prop generation, prop checks, typecheck, lint, and build pass.

[27/08/26]

- [x] Render-plan Node tests and focused JSON View integration tests pass.
- [x] Design-system and web lint, typecheck, build, and complete workspace tests pass.

[24/07/26]

- [x] Documentation tests pass.
- [x] Generated prop metadata is current.
- [x] Documentation typecheck and focused lint pass.
- [x] Documentation production build passes.
- [ ] Re-run and record cross-package tests, typechecks, focused lint, generated-prop checks, and builds against the current
      application integration.
- [ ] Running-application verification covers narrow panes, keyboard navigation, search, copying, and row changes.
- [x] Row JSON search expansion preserves the tree and copy-action inline positions when vertical overflow changes.
