# JsonView implementation tasks

## Table of contents

- [Tasks](#tasks)

## Tasks

- [x] 1. Establish the `JsonView` contract and failing component tests.
  - Verify whether the installed Base UI version provides a matching tree primitive before choosing intrinsic ARIA tree markup.
  - Add public prop and value types for strict JSON objects, arrays, and primitives.
  - Confirm the public API does not expose `className`, `style`, arbitrary renderers, mutation callbacks, or editable behavior.
  - Add failing tests for default expansion, JSON punctuation, primitive presentation, and empty containers.
  - Reference: [Public API](./design.md#public-api), [Data model](./design.md#data-model).

- [x] 2. Implement the normalized tree model and stable node identity.
  - Convert strict JSON data into path-addressed object, array, property, and primitive nodes.
  - Preserve object insertion order and array index order.
  - Derive level, position, set size, parent, children, container state, and visible-node order.
  - Reconcile valid expansion and focus paths when `data` changes.
  - Add focused tests for nested objects, primitive arrays, mixed arrays, empty containers, and equivalent-data identity replacement.
  - Reference: [Data model](./design.md#data-model), [Interaction model](./design.md#interaction-model).

- [x] 3. Implement the read-only syntax tree and code-surface presentation.
  - Add `jsonView.tsx` and `jsonView.styles.ts` under `packages/design-system/src/components/jsonView/`.
  - Render quoted keys and strings, JSON punctuation, numbers, booleans, and `null` through semantic syntax treatments.
  - Render empty containers inline and collapsed containers as `{…}` or `[…]`.
  - Add disclosure controls and complete-row pointer toggles for non-empty objects and arrays without selecting non-leaf text.
  - Wrap long primitive values while preserving native selection.
  - Add any required semantic syntax-color, focus, and search-highlight tokens rather than embedding theme values.
  - Reference: [Visual representation](./design.md#visual-representation).

- [x] 4. Implement accessible tree focus and keyboard behavior.
  - Add `tree`, `treeitem`, and `group` semantics with contextual labeling.
  - Add `aria-expanded`, logical level, position, and set-size metadata.
  - Implement roving `tabindex` so the tree contributes one Tab stop.
  - Implement Arrow Up, Arrow Down, Arrow Left, Arrow Right, Home, End, Enter, and Space behavior.
  - Restore focus to a collapsed ancestor when its focused descendant becomes hidden.
  - Keep primitive leaf text selection and platform Copy behavior intact.
  - Add interaction tests for value-node traversal, disclosure, focus recovery, and keyboard boundaries.
  - Reference: [Interaction model](./design.md#interaction-model), [Accessibility](./design.md#accessibility).

- [x] 5. Add search highlighting without coupling search controls to the component.
  - Accept controlled literal search terms through the constrained public API.
  - Match object keys and primitive display values safely without regular-expression injection.
  - Render matches with native `mark` semantics.
  - Keep search highlighting visually distinct from keyboard focus and selected text.
  - Temporarily expand matching ancestors, reveal the first match without stealing search focus, and communicate no matches.
  - Add tests for literal matching, keys, strings, visible and hidden matches, and empty search state.
  - Reference: [Public API](./design.md#public-api), [Accessibility](./design.md#accessibility).

- [x] 6. Add bounded rendering and continuation behavior.
  - Select fixed child, visible-node, and string budgets through representative fixtures.
  - Render large object and array branches incrementally through keyboard-accessible `Show more` continuation nodes.
  - Add deliberate reveal behavior for truncated primitive strings.
  - Preserve logical sibling metadata when only a child window is mounted.
  - Prevent unbounded expansion and omit an Expand all API.
  - Add tests for budget boundaries, repeated continuation, exhaustion behavior, and complete source preservation.
  - Reference: [Rendering safeguards](./design.md#rendering-safeguards).

- [x] 7. Export and validate the public design-system component.
  - Export `JsonView` and consumer-facing JSON value types from `packages/design-system/src/index.ts`.
  - Add package JSDoc for props, defaults, accessibility labeling, search terms, and accepted data.
  - Confirm refs, event behavior, and strict TypeScript settings remain valid.
  - Run component tests, package typecheck, lint, and build.
  - Reference: [Architecture](./design.md#architecture), [Public API](./design.md#public-api).

- [x] 8. Add executable design-system validation surfaces.
  - Register `JsonView` with a stable component ID in `apps/design-system`.
  - Add executable examples for default and collapsed expansion, nested arrays and objects, empty values, search highlighting, long
    strings, and bounded branches.
  - Import examples from `@inspektor/ds` and expose their source through the existing raw-source pattern.
  - Generate and check package-authoritative prop metadata.
  - Add focused playground or example tests where controls expose meaningful component states.
  - Reference: [Documentation](./design.md#documentation).

- [x] 9. Implement the Jazz-to-JSON presentation adapter.
  - Add an application-owned normalizer under the Table Explorer data feature.
  - Preserve strict JSON primitives, object order, and array order.
  - Represent bytes as an explicit tagged value with a named encoding instead of indexed `Uint8Array` properties.
  - Represent timestamps canonically, preserve stored reference IDs, and tag unsupported, unavailable, and non-finite values.
  - Produce a faithful whole-row Copy JSON serialization from the same normalized representation.
  - Add unit tests for schema ordering, unavailable fields, Date values, bytes, references, arrays, Row tuples, JSON containers,
    non-finite numbers, cycles, and unsupported values.
  - Reference: [Data model](./design.md#data-model), [Inspector integration](./design.md#inspektor-integration).

- [x] 10. Integrate read-only `JSON` representation into the row side pane.
  - Add `Details` and `JSON` representations through the design-system `ToggleGroup`.
  - Keep every row mutation, validation error, dirty field, and Save action in `Details`.
  - Render `JsonView` with every schema field, including fields hidden from the data grid.
  - Key the representation by stable row identity so a row change restores configured expansion.
  - Add application-owned search and whole-row Copy JSON controls around the tree.
  - Add integration tests for representation switching, hidden fields, search, copying, and read-only behavior.
  - Reference: [Inspector integration](./design.md#inspektor-integration).

- [x] 11. Reuse `JsonView` for read-only structured fallback inspection.
  - Use the CodeMirror-backed `CodeEditor` when a structured runtime value can be represented safely as source.
  - Use `JsonView` when normalization produces an object or array fallback instead.
  - Add field-level integration tests proving that read-only viewing and editable Details controls do not share mutation behavior.
  - Reference: [Inspector integration](./design.md#inspektor-integration).

- [ ] 12. Close final component correctness and evidence gaps.
  - Render selectable object and array punctuation as valid JSON.
  - Add continuation-item parent navigation and keyboard focus-continuity coverage.
  - Add replacement-data active-path recovery coverage and a keyboard-focused executable example.
  - Resolve the open full-source traversal and root-array representation decisions.

- [ ] 13. Complete cross-package and running-application verification.
  - Run design-system, documentation, and Inspector tests, typechecks, focused lint, prop extraction checks, and production builds.
  - Verify pointer selection, keyboard navigation, search highlighting, narrow panes, long values, large branches, and row switching in
    the running Inspector.
  - Confirm the complete-row `JSON` representation exposes no mutation path.
  - Reference: [Testing strategy](./design.md#testing-strategy).
