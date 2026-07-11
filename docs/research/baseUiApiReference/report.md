# Base UI API reference recommendation

## Table of contents

- [Decision](#decision)
- [How Base UI works](#how-base-ui-works)
- [What to adopt](#what-to-adopt)
- [What not to copy](#what-not-to-copy)
- [Recommended local pipeline](#recommended-local-pipeline)
- [Default-value policy](#default-value-policy)
- [Inherited-prop policy](#inherited-prop-policy)
- [`componentId` role](#componentid-role)
- [Shiki optimization](#shiki-optimization)
- [Sources](#sources)

## Decision

Use a Polar-sized extraction script with Base UI's source-authority model:

1. `packages/design-system` owns public TypeScript declarations, runtime defaults, JSDoc descriptions, and optional metadata conventions.
2. A docs-side TypeScript extractor reads public package exports and emits deterministic JSON keyed by `componentId`.
3. Component pages select and order prop names but cannot override generated type, requiredness, default, or public description.
4. Validation regenerates the artifact and fails when it is stale.

Do not reproduce Base UI's custom loader, HAST payload, Markdown synchronization, type-link registry, or generic callable/class renderers.

## How Base UI works

The Button page explicitly renders a generated API component:

- `page.mdx` imports `TypesButton` from a colocated `types.ts`.
- `types.ts` imports the public `Button` package export and calls `createTypes(import.meta.url, Button)`.
- a Next.js loader intercepts that call, resolves the public export, and runs `typescript-api-extractor` through `@mui/internal-docs-infra`.
- the extractor creates a TypeScript program and uses the type checker to resolve props, inheritance, optionality, JSDoc, related types, data attributes, and CSS variables.
- the loader commits a readable `types.md` derivative and injects richer precomputed metadata into the transformed `types.ts` module.
- `ReferenceTable` renders the injected metadata as props, data attributes, CSS variables, and related types.

The package source and public export graph are authoritative. The page does not maintain Button prop rows.

Base UI filters ordinary DOM props because their declarations are external while retaining shared Base UI props declared in its own source. This is why Button documents `className`, `style`, and `render` without listing the complete native button surface.

## What to adopt

- Extract through the public package entry point so undocumented or unexported components fail validation.
- Use the TypeScript type checker rather than textual interface parsing.
- Keep public descriptions as JSDoc beside package declarations.
- Resolve local inherited props and filter external DOM props.
- Use conventions for additional API surfaces only when needed, such as `ButtonDataAttributes`.
- Generate a committed, reviewable artifact.
- Validate artifact freshness.
- Keep API rendering separate from extraction.

## What not to copy

Base UI's infrastructure supports compound namespaces, functions, hooks, classes, short and detailed linked types, HAST rendering, generated Markdown, LLM text, CSS variables, data attributes, parent indexes, and multiple build systems. Reproducing that machinery in a Vite documentation app would be disproportionate.

The local renderer needs structured prop records, not generated Markdown or injected HAST. JSON is the direct representation.

## Recommended local pipeline

1. Export each documented component and its consumer-facing types from `packages/design-system/src/index.ts`.
2. Add JSDoc descriptions to public prop declarations in the package.
3. Configure extraction entries with a stable `componentId` and public export name.
4. Use `ts-morph` to create a TypeScript program and resolve the selected export's call signature.
5. Extract prop name, type, optionality, description, default, deprecation state, and source location.
6. Include package-authored inherited props and explicitly selected external inherited props.
7. Write deterministic `apps/design-system/src/generated/props.json` keyed by `componentId`.
8. Let each component page provide only prop names, ordering, grouping, and optional editorial notes.
9. Regenerate during focused validation and fail when output changes.

The generated schema should include `name`, `type`, `required`, `defaultValue`, `description`, and `source`. Alias expansion should be a generator-wide formatting policy rather than a page decision.

## Default-value policy

Base UI displays defaults from JSDoc `@default` tags. It does not infer runtime destructuring defaults. Its JSDoc can therefore drift from implementation.

The local pipeline should close that gap. Two approaches are viable:

1. Extract literal defaults from the component parameter destructuring and treat them as authoritative.
2. Require `@default` tags and validate each tag against the corresponding runtime initializer.

Literal initializer extraction is the smaller initial policy because the local components already express defaults in destructured parameters. Validation should fail when a documented optional prop has an initializer that cannot be resolved, rather than silently falling back to handwritten page data.

If component implementation patterns later make initializer extraction unreliable, introduce package-local typed defaults consumed by the component and extractor. Do not let pages supply defaults.

## Inherited-prop policy

Documenting every intrinsic DOM prop would overwhelm the table. Filtering all inherited props would hide important behavior such as `render`.

Use this policy:

- include props declared under `packages/design-system` by default;
- exclude intrinsic React and DOM declarations by default;
- include selected external props by explicit component-level allowlist;
- keep the extracted type authoritative for allowlisted props.

For Button, `render` and `disabled` are reasonable initial allowlisted props. Native attributes can be described once in page prose rather than expanded into the table.

## `componentId` role

The rename from `propsSlug` to `componentId` is present in the registry. `componentId` should be the stable join key between navigation metadata and generated API data, not a route slug or package runtime export.

The remaining prop-data API still uses slug terminology and should be aligned when the extraction pipeline is implemented. Validation should detect duplicate registry IDs, missing generated records for documented components, unknown generated IDs, and missing public exports.

## Shiki optimization

Shiki remains appropriate because component pages will regularly include source examples. The implementation already uses `shiki/core`, one language, two themes, and one shared highlighter promise.

The first optimization should replace the Oniguruma WASM engine with Shiki's JavaScript regular-expression engine and verify TSX output. This removes the large WASM asset. A precompiled TSX grammar can then reduce browser startup work further.

Defer viewport-triggered highlighting, worker execution, caching, and build-time highlighting until measured rendering behavior justifies their additional machinery.

## Sources

- [Base UI Button page](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx)
- [Base UI Button type selector](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)
- [Base UI generated Button API](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md)
- [Base UI Button package source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)
- [Base UI docs loader configuration](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)
- [`typescript-api-extractor`](https://github.com/michaldudak/typescript-api-extractor/tree/v1.0.0-beta.3)
- [Base UI reference table](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceTable.tsx)
- [Polar Orbit prop extractor](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/scripts/extract-props.mjs)
- [Shiki JavaScript regex engine](https://shiki.style/guide/regex-engines)
