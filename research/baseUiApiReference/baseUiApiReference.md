# Base UI API reference — recommendation for Inspektor

## Table of contents

- [Decision](#decision)
- [How Base UI works](#how-base-ui-works)
- [Polar Orbit and local scaffold](#polar-orbit-and-local-scaffold)
- [What to adopt](#what-to-adopt)
- [What not to copy](#what-not-to-copy)
- [Recommended local pipeline](#recommended-local-pipeline)
- [componentId](#componentid)
- [Artifact format](#artifact-format)
- [Default-value policy](#default-value-policy)
- [Inherited-prop policy](#inherited-prop-policy)
- [Shiki optimization](#shiki-optimization)
- [Sources](#sources)

## Decision

Use a Polar-sized extraction script with Base UI's source-authority model.

- `packages/design-system` owns public TypeScript declarations, runtime defaults, JSDoc descriptions, and metadata conventions.
- A docs-side `ts-morph` extractor reads public package exports and emits deterministic JSON keyed by `componentId`.
- Component pages select and order prop names but cannot override generated type, requiredness, default, or public description.
- Validation regenerates the artifact and fails when it is stale.

## How Base UI props tab works

Base UI v1.6.0 documents the Button API with a generated component:

1. `page.mdx` imports `TypesButton` from a colocated `types.ts`.
2. `types.ts` imports the public `Button` package export and calls `createTypes(import.meta.url, Button)`.
3. A Next.js loader intercepts the call, resolves the public export, and runs `typescript-api-extractor` through `@mui/internal-docs-infra`.
4. The extractor creates a TypeScript program and uses the type checker to resolve props, inheritance, optionality, JSDoc, related types, data attributes, and CSS variables.
5. The loader commits a readable `types.md` derivative and injects richer precomputed metadata into the transformed `types.ts` module.
6. `ReferenceTable` renders the injected metadata as props, data attributes, CSS variables, and related types.

The package source and public export graph are authoritative. The page does not maintain Button prop rows.

## Polar Orbit and local scaffold

Polar Orbit is closer to the local scale. It uses a `ts-morph` script that maps a slug to a package source file and export, writes committed `props.json`, and merges generated fields into curated page rows. Its merge is loose: handwritten `required`, `default`, and `description` win over generated values, which has already drifted in the local Button page (`radius` defaults to `"xs"` in `button.tsx` but `"s"` in the handwritten table).

The local scaffold is currently incomplete: `extract-props.mjs` writes `{}`, `props.json` is empty, and the table is fully handwritten. The `componentId` rename from `propsSlug` is useful only if it becomes a stable generated API identity.

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

Base UI's infrastructure supports compound namespaces, functions, hooks, classes, short and detailed linked types, HAST rendering, generated Markdown, LLM text, CSS variables, data attributes, parent indexes, and multiple build systems. Reproducing that in a Vite documentation app is disproportionate.

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

Generated JSON should include `name`, `type`, `required`, `defaultValue`, `description`, and `source`.

## componentId

`componentId` is the stable docs-domain join key between navigation metadata and generated API data. It is not the URL slug and not a runtime package export.

Responsibilities:

- Registry assigns `componentId` to component items, e.g. `button`.
- Extraction manifest uses the same ID for the public export it extracts.
- Generated JSON is keyed by that ID.
- Accessor names should become `GeneratedPropsByComponentId` and `getGeneratedProps(componentId)`.
- Validation fails for duplicate IDs, missing records for documented components, unknown generated IDs, and missing public exports.

The route `slug` should continue to control `href` and route lookup.

## Artifact format

Committed JSON is the best fit.

- It is structured for the existing React table.
- It is independent of the docs rendering framework.
- Diffs expose API changes and stale output in review.
- It can carry source paths and lines without adding them to package runtime code.
- It matches the scaffold and Polar's proven small-repository shape.

Generated TypeScript modules are not justified: they add syntax, imports, and formatter interaction without improving the source of truth. Runtime package exports are worse: TypeScript types are erased, handwritten runtime metadata drifts, and docs-only strings become part of the package bundle.

## Default-value policy

Base UI displays defaults from JSDoc `@default` tags. It does not infer runtime destructuring defaults, so its JSDoc can drift from implementation.

The local pipeline should close that gap by extracting literal defaults from the component parameter destructuring and treating them as authoritative. Validation should fail when a documented optional prop has an initializer that cannot be resolved.

If initializer extraction later becomes unreliable, introduce package-local typed defaults consumed by both the component and the extractor. Do not let pages supply defaults.

## Inherited-prop policy

Documenting every intrinsic DOM prop would overwhelm the table. Filtering all inherited props would hide important behavior such as `render`.

Policy:

- Include props declared under `packages/design-system` by default.
- Exclude intrinsic React and DOM declarations by default.
- Include selected external props by explicit component-level allowlist.
- Keep the extracted type authoritative for allowlisted props.

For Button, `render` and `disabled` are reasonable initial allowlisted props. Native attributes can be described once in page prose rather than expanded into the table.

## Shiki optimization

Shiki is already used for source examples. Replace the Oniguruma WASM engine with Shiki's JavaScript regular-expression engine and verify TSX output. This removes the large WASM asset. A precompiled TSX grammar can reduce startup work further.

Defer viewport-triggered highlighting, workers, caching, and build-time highlighting until measured rendering justifies the machinery.

## Sources

- [Base UI Button page](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx)
- [Base UI Button types selector](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)
- [Base UI Button generated API](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md)
- [Base UI Button package source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)
- [Base UI docs loader config](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)
- [typescript-api-extractor](https://github.com/michaldudak/typescript-api-extractor/tree/v1.0.0-beta.3)
- [Base UI reference table](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/studio/ReferenceTable/ReferenceTable.tsx)
- [Polar Orbit prop extractor](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/scripts/extract-props.mjs)
- [Shiki JS regex engine](https://shiki.style/guide/regex-engines)
