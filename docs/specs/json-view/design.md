# JsonView design

## Table of contents

- [Overview](#overview)
- [Goals](#goals)
- [Non-goals](#non-goals)
- [Visual representation](#visual-representation)
- [Interaction model](#interaction-model)
- [Accessibility](#accessibility)
- [Architecture](#architecture)
- [Public API](#public-api)
- [Data model](#data-model)
- [Rendering safeguards](#rendering-safeguards)
- [Inspector integration](#inspector-integration)
- [Documentation](#documentation)
- [Testing strategy](#testing-strategy)
- [Open questions](#open-questions)

## Overview

`JsonView` is a reusable `@inspector/ds` component for inspecting JSON objects and arrays as a read-only, syntax-colored,
collapsible tree. It takes inspiration from the observable behavior of Vercel Geist JSON View while using Inspector tokens,
component constraints, and an independent implementation.

The Table Explorer uses `JsonView` for the row side pane's `JSON` representation and for read-only structured field inspection.
The complete row remains editable only through the schema-derived `Details` representation. `JsonView` never parses mutations,
renders editable controls, or submits writes.

Research and source evidence are recorded in [Geist JSON View adaptation report](../../research/geistJsonView/report.md).

## Goals

- Render JSON objects and arrays as readable nested structure rather than a pre-stringified block.
- Preserve familiar JSON punctuation and syntax distinctions.
- Let users expand, collapse, search, select, and copy structured values.
- Provide complete keyboard tree navigation and visible focus.
- Remain usable in a narrow side pane with deeply nested and long values.
- Bound rendering work for large documents and large branches.
- Keep the public API independent from Jazz schema and application mutation state.
- Make off-system styling and arbitrary node rendering impossible through the public API.

## Non-goals

- Complete-row JSON mutation.
- Inline primitive, key, object, or array editing.
- JSON parsing or schema validation.
- Key insertion, deletion, rename, or reordering.
- Drag-and-drop tree editing.
- Per-node Copy buttons.
- Expand-all behavior.
- Monaco, CodeMirror, Shiki, or a third-party JSON viewer dependency.
- Rendering arbitrary JavaScript class instances, functions, symbols, maps, sets, or cyclic graphs directly.

## Visual representation

The component uses a code-surface appearance without using a `textarea`, `contenteditable`, or static code block:

- monospace typography
- semantic syntax colors for keys, strings, numbers, booleans, and `null`
- literal JSON punctuation and quoted keys and strings
- one visible tree row per property or array item
- disclosure chevrons for non-empty objects and arrays
- a restrained hover treatment across the complete interactive container row
- inline `{}` and `[]` for empty containers
- collapsed `{…}` and `[…]` summaries
- wrapped long primitive values with preserved selectable text
- indentation that communicates hierarchy without consuming the complete pane width
- visible keyboard focus distinct from search highlighting and browser text selection
- native `mark` semantics for search matches
- no line numbers, editing caret, validation gutter, or editor chrome

The root object is visible as a tree item. With expansion depth `1`, the row's top-level fields are visible while nested objects and
arrays remain collapsed.

## Interaction model

- Clicking the disclosure or complete row toggles a non-empty object or array.
- Expandable non-leaf rows do not participate in text selection, so repeated pointer presses only toggle disclosure.
- Primitive leaf rows remain non-interactive and available for text selection.
- Text selection and platform Copy remain native browser behavior.
- Arrow Down and Arrow Up move through visible tree items.
- Arrow Right expands a closed container or moves to its first child.
- Arrow Left collapses an open container or moves to its parent.
- Enter and Space toggle the focused container.
- Home and End move to the first and last visible tree item.
- Collapsing a branch moves focus to the branch when focus was inside a descendant.
- Search highlights matching keys and primitive display values without changing the source value.
- Search supports controlled case-sensitive, whole-word, and regular-expression matching.
- Search temporarily expands matching ancestor branches, reveals the first matching path within the visible budget, and scrolls it
  into view without moving keyboard focus away from the application-owned search control.
- An active search with no key or primitive match displays and announces `No matches` while preserving the tree.
- A match outside the visible budget displays and announces `Match outside visible limit` rather than bypassing the budget.
- Expansion state is local to the component. The Table Explorer keys the component by represented row identity when a row change
  should reset expansion to the configured depth.

## Accessibility

- The root uses `role="tree"` and requires a contextual accessible label.
- Every value node uses `role="treeitem"`.
- Child collections use `role="group"`.
- Container nodes expose `aria-expanded`.
- Tree items expose logical level, position, and set size when rendering is incremental.
- Roving `tabindex` keeps the tree to one Tab stop.
- The visual focus ring appears for Tab and tree-keyboard navigation, not pointer disclosure.
- Disclosure icons are hidden from assistive technology when the tree item's accessible name already communicates expansion.
- Color is not the only type distinction; punctuation and literal values remain present.
- Search matches, focus, and selected text use distinct treatments.
- `JsonView` announces an empty search result and the application announces Copy status without moving tree focus.

## Architecture

The component lives under `packages/design-system/src/components/jsonView/`:

- `jsonView.tsx` owns markup, expansion, visible-node traversal, keyboard navigation, and public types.
- `jsonView.styles.ts` owns StyleX rules and semantic token usage.
- `jsonView.test.tsx` covers rendering, tree semantics, expansion, keyboard behavior, search, and safeguards.

The application adapter remains in `apps/web` and converts Jazz row values into strict JSON presentation data. The design-system
component does not import Jazz packages or know about rows, columns, references, timestamps, permissions, or mutations.

## Public API

The implementation exports `JsonView` and consumer-facing value types from `packages/design-system/src/index.ts`.

The API does not expose `className`, `style`, arbitrary CSS values, arbitrary renderers, syntax-color overrides, node component
slots, Jazz schema objects, mutation callbacks, or an `editable` prop. Its controlled search contract accepts a query, matching
options, active occurrence index, and result callback.

## Data model

`JsonView` accepts strict JSON-compatible objects and arrays. The application adapter performs explicit normalization before data
crosses the package boundary:

```apps/web/src/components/table-explorer/data/jsonViewValue.ts#L1-18
type InspectorJsonValue =
  | null
  | boolean
  | number
  | string
  | InspectorJsonValue[]
  | { readonly [key: string]: InspectorJsonValue }

function createRowJsonViewValue(row: TableRow): InspectorJsonValue {
  return normalizeJazzValue(row)
}
```

Normalization preserves JSON primitives and recursively converts objects and arrays. Schema-aware adapters represent values that
JSON cannot preserve directly:

- bytes become an explicitly tagged object with a named encoding rather than indexed `Uint8Array` properties
- timestamps become a canonical machine representation selected by the application
- references remain stored IDs rather than resolved display labels
- unsupported or unavailable values become explicit tagged objects rather than disappearing or becoming `null`
- non-finite numbers receive an explicit tagged representation

The row JSON projection is Inspector JSON when normalization differs from the Jazz runtime object. The pane labels and Copy action
must not imply that tagged values are a direct runtime serialization.

## Rendering safeguards

The component enforces internal budgets rather than exposing arbitrary consumer limits:

- bounded initial expansion depth
- bounded rendered children per expanded container
- bounded displayed primitive string length with an explicit reveal action
- bounded total visible nodes
- incremental `Show more` continuation nodes for large objects and arrays
- no `Expand all`

Continuation nodes participate in keyboard order and expose the logical sibling metadata required by the tree pattern. The complete
source remains available to application-owned whole-value Copy when the adapter can serialize it faithfully.

The fixed internal safeguards are:

- `100` children per branch batch
- `500` visible tree items across the complete expanded tree, including continuation items
- `4,000` Unicode code points before a primitive string requires explicit full reveal

When the total budget is exhausted, affected branches render non-actionable `Visible limit reached` tree items. Collapsing another
branch releases capacity and recomputes the depth-first render plan. If the active keyboard item leaves that plan, focus recovers to
its nearest visible ancestor. These thresholds remain implementation details rather than consumer configuration.

## Inspector integration

The Table Explorer row pane uses a single-select `ToggleGroup` to switch between:

- `Details`: schema-derived fields and the only row mutation surface
- `JSON`: `JsonView` plus application-owned search and Copy JSON controls

The `JSON` representation receives every represented row field, including fields hidden from the grid. Row changes reset the tree
through component identity. The tree does not inherit table cell selection or grid keyboard commands while focus is inside it.

Read-only JSON or array fields may reuse `JsonView`. Editable JSON, typed JSON, and generic array fields remain text controls inside
`Details`; a JSON text-editor component is outside this specification.

## Documentation

Add a public component page under `apps/design-system` with executable examples for:

- default object expansion
- collapsed root
- nested arrays and objects
- empty containers and `null`
- search highlighting
- long strings and narrow width
- bounded large branches
- keyboard navigation and focus

Generated prop metadata remains authoritative. Examples import `JsonView` from `@inspector/ds` and do not demonstrate styling
escape hatches.

## Testing strategy

Design-system tests cover:

- punctuation and syntax representation for every JSON primitive and container
- empty and collapsed container output
- initial expansion depth
- disclosure through pointer, Enter, and Space
- Arrow, Home, and End navigation through visible nodes
- focus recovery when an ancestor collapses
- `tree`, `treeitem`, `group`, `aria-expanded`, and logical position metadata
- selectable text without per-value Tab stops
- literal and regular-expression search matching with case and whole-word options
- long-string and child-count continuation behavior
- stable behavior when `data` changes

An integration-style interaction test should exercise the complete visible-node model:

```packages/design-system/src/components/jsonView/jsonView.test.tsx#L1-17
it('navigates and collapses the visible JSON tree', async () => {
  render(
    <JsonView
      accessibilityLabel="Row data"
      data={{ profile: { name: 'Ada' }, active: true }}
      defaultExpandDepth={1}
    />,
  )

  await focusTree()
  await pressKeys('ArrowDown', 'Enter')

  expectFocusedTreeItem('profile')
  expectCollapsedTreeItem('profile')
})
```

Application tests cover Jazz normalization, tagged binary and unsupported values, hidden columns, row identity resets, Copy JSON,
and isolation from grid keyboard behavior.

## Open questions

- Decide the exact semantic syntax-color tokens after reviewing the component in supported themes.
- Decide whether full-source search and normalization need a worker or application-level traversal budget for unusually large data.
- Decide whether a root array uses numeric item labels, visual indices, or punctuation alone in its accessible names.
