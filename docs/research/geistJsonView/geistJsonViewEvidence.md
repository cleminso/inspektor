# Geist JSON View — implementation evidence

## Table of contents

- [What we inspected](#what-we-inspected)
- [Public API](#public-api)
- [DOM structure](#dom-structure)
- [Library comparison](#library-comparison)
- [Limitations of this evidence](#limitations-of-this-evidence)
- [Sources](#sources)

## What we inspected

- Public Geist documentation and examples.
- Server-rendered DOM from `vercel.com/geist/json-view`.
- React Server Components flight payload.
- Referenced Next.js/Turbopack chunks.
- Public fingerprint and code searches.

## Public API

```ts
import {
  JsonView,
  makeJsonViewHighlightPattern,
} from '@vercel/geistcn/components';
```

Documented props:

- `data`: object or array. Do not pre-stringify.
- `defaultExpandDepth`: number. Initial expansion only; levels strictly below this depth expand.
- `highlightPattern`: pattern from helper, or `null`.

No verified public source or npm package was available. `@vercel/geistcn` returned 404 from the public npm registry and no authoritative GitHub repository was found.

## DOM structure

- Root: `span role="tree" aria-label="JSON"`.
- Nodes: `span role="treeitem"` with `aria-level`, `aria-posinset`, `aria-setsize`, `aria-label`, `data-json-tree-label`.
- Child collections: `span role="group"`.
- Expandable nodes: `aria-expanded`; toggle child has `data-json-node-toggle="true"`; chevron SVG is `aria-hidden="true"`.
- Roving `tabindex`: active root item `0`, descendants `-1`.
- Keys and primitives as separate inline spans with Geist utility classes and token colors.
- Search matches rendered as native `<mark>` elements.
- Component classes include `group/json-child`, `group/json-toggle`.

No Monaco, CodeMirror, contenteditable, textarea, gutter, or Shiki code-block structure exists inside the JSON View.

## Library comparison

No fingerprints found for:

- Monaco — no `.monaco-editor`, `.view-lines`, inputarea, overlays, or gutters.
- CodeMirror — no `.cm-editor`, `.cm-scroller`, `.cm-content`, `.cm-line`, or contenteditable.
- Shiki as the interactive renderer — no `pre > code > span.line`; docs code blocks are separate.
- `react-json-view` / `react-json-tree` — no package names or class fingerprints; public API differs.

The custom `data-json-*` attributes, Geist classes, recursive punctuation, native `<mark>` highlighting, and complete ARIA tree/focus model point to a purpose-built Geist component.

Confidence:

- Not Monaco/CodeMirror/Shiki: very high.
- Not `react-json-view`/`react-json-tree`: high.
- Custom Geist implementation: high.

## Limitations of this evidence

- Static inspection only; no instrumented browser events were executed.
- Only targeted chunks were downloaded; Turbopack splits modules across many hashed chunks.
- No source map was advertised; no proprietary source is reproduced here.

## Sources

- Public page and DOM: <https://vercel.com/geist/json-view>
- Next.js/Turbopack chunks:
  - <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/317k9zz7258b8.js>
  - <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/0octl46c6ywov.js>
  - <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/3n3q1mhdjiobx.js>
- GitHub search: <https://github.com/search?q=%22makeJsonViewHighlightPattern%22&type=code>
