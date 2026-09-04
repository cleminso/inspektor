# Geist JSON View — Inspector adaptation

## Table of contents

- [Credit](#credit)
- [What it is](#what-it-is)
- [Verified Geist behavior](#verified-geist-behavior)
- [What we did not verify](#what-we-did-not-verify)
- [Inspector decisions](#inspektor-decisions)
- [Component boundary](#component-boundary)
- [Initial scope](#initial-scope)
- [Sources](#sources)

## Credit

Based on [Vercel Geist JSON View](https://vercel.com/geist/json-view). This is an independent Inspector implementation informed by Geist's documented behavior and public DOM, not a reuse of its source code or package artifacts.

## What it is

A read-only, keyboard-navigable tree for inspecting structured values. It lives in the row side pane's `JSON` tab, next to `Details`, which remains the editing surface.

## Verified Geist behavior

- Accepts objects/arrays directly; do not pre-stringify.
- Objects and arrays expand and collapse.
- `defaultExpandDepth` starts levels strictly below the value expanded. Use `1` for detail panes, `0` for dense surfaces.
- Syntax coloring for structure and primitives.
- `highlightPattern` matches field names and primitive values.
- Text remains selectable.
- Arrow keys move through visible nodes; Enter/Space toggle; Home/End jump to boundaries.
- Uses `role="tree"` with `treeitem`/`group` semantics and roving `tabindex`.

## What we did not verify

Do not assume Geist provides:

- Copy buttons or branch-copy formatting.
- Controlled expansion.
- Virtualization or large-document guarantees.
- Depth, node, string, or child limits.
- Long-value wrapping or truncation.
- Handling for `Date`, `Uint8Array`, non-finite numbers, unsupported JavaScript values, or cycles.
- Public source, dependency graph, or reusable license.

## Inspector decisions

### Scope

- Read-only viewer. No inline editing, key insertion/deletion/reordering, or schema validation.
- Default expansion depth `1` for row JSON; `0` for compact previews.
- Search and whole-row **Copy JSON** live in the pane toolbar, outside the tree.
- One tree Tab stop with arrow-key navigation.

### Rendering safeguards

- Cycle detection and explicit budgets for depth, node count, string length, and binary length.
- Large branches paginate via `Show more`; no `Expand all`.
- Cycles, unsupported values, and exhausted budgets render as explicit terminal nodes.

### Non-JSON values

Normalize Jazz values before crossing into the design-system component:

- `Uint8Array`: render as `Uint8Array(<byte length>)` with a bounded hex/base64 preview; copy actions for hex, base64, and decoded text where valid.
- Timestamps: keep the canonical ISO 8601/Z machine value plus an optional localized display.
- `Date`, `undefined`, non-finite numbers, bigint, maps, sets, references: explicit display kind and copy representation, or a labeled unsupported terminal.
- Identify the projection as Inspector JSON when it differs from a direct Jazz runtime value.

### Accessibility

- Use a contextual accessible name such as `Row data`, via `aria-labelledby`.
- Use `tree`, `treeitem`, `group`; apply `aria-expanded` only to nodes with children.
- Use roving focus or `aria-activedescendant`; keep one Tab stop.
- Keep visible focus distinct from search highlighting and selected text.
- Right Arrow opens a closed branch or enters an open branch; Left Arrow closes an open branch or moves to its parent; Up/Down move between visible nodes.
- Do not expose `aria-selected` unless node selection has application meaning.
- Preserve `aria-level`, `aria-setsize`, `aria-posinset` when paging.

## Component boundary

### `packages/design-system`

- Read-only tree markup, indentation, disclosure, punctuation, syntax presentation.
- Accessible tree semantics, labeling hooks, roving focus, keyboard navigation.
- Initial or controlled expansion.
- Search highlighting hooks.
- Selectable text.
- Bounded child rendering and continuation nodes.
- Generic primitives plus terminal kinds for unsupported or adapted values.

### `apps/web`

- Convert Jazz row values into the constrained presentation model.
- Interpret timestamps, binary, references, and unsupported values.
- JSON and clipboard serialization.
- Search input, match navigation, status messages.
- Pane tabs, row identity, toolbar actions, permissions.
- All editing, validation, mutation, and conflict workflows.

The design-system component must not accept Jazz schema objects, arbitrary node renderers, styling slots, or an `editable` boolean.

## Initial scope

Include:

- Read-only object and array trees.
- Strings, numbers, booleans, `null`.
- Initial expansion depth.
- Branch expand/collapse.
- Keyboard tree navigation.
- Selectable text.
- Search highlighting.
- Whole-row Copy JSON owned by the pane.
- Bounded rendering and continuation states.

Exclude:

- Inline editing.
- Key insertion, deletion, or reordering.
- Schema validation inside the viewer.
- Per-node copy buttons.
- Expand all.
- Assumption that arbitrary JavaScript objects are valid JSON.
- Direct reuse of unavailable Geist source or package artifacts.

## Sources

- [Vercel Geist JSON View](https://vercel.com/geist/json-view)
- [Vercel Geist JSON View Markdown](https://vercel.com/geist/json-view.md)
- [Vercel Geist Introduction](https://vercel.com/geist/introduction)
- [WAI-ARIA Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [MDN `JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [Vercel Labs Visual JSON](https://github.com/vercel-labs/visual-json)
