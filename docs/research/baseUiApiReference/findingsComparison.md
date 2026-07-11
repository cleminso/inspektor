# Base UI API-reference architecture comparison

## Table of contents

- [Conclusion](#conclusion)
- [Local evidence](#local-evidence)
- [Base UI v1.6.0 architecture](#base-ui-v160-architecture)
- [Polar Orbit architecture](#polar-orbit-architecture)
- [Architecture comparison](#architecture-comparison)
- [Authority and curation](#authority-and-curation)
- [`componentId`](#componentid)
- [Artifact format](#artifact-format)
- [Recommended architecture](#recommended-architecture)
- [Risks and guardrails](#risks-and-guardrails)
- [Sources](#sources)

## Conclusion

The best fit is not a direct copy of Base UI v1.6.0 or Polar Orbit. It is a smaller hybrid:

1. Keep the public TypeScript types, defaults, and API descriptions in `packages/design-system` authoritative, following Base UI's source-first discipline.
2. Use a docs-side `ts-morph` extraction step similar in size to Polar's script.
3. Emit structured, committed JSON keyed by `componentId`.
4. Let docs pages curate which props appear and their order, but do not hand-copy types, requiredness, or defaults.
5. Keep `componentId` and extraction machinery out of the runtime exports of `@inspector/ds`.

Base UI is the strongest authority model, but its loader, Markdown synchronization, HAST precomputation, namespace handling, cross-type links, and multiple reference renderers solve a much larger documentation problem. Polar is closer to this repository's scale, but its merge policy still allows handwritten defaults and descriptions to override generated facts. The local implementation should adopt Polar's proportional extraction shape while tightening that authority boundary.

The generated artifact should be committed JSON. A generated TypeScript module adds code-generation and formatter concerns without improving the underlying source of truth. Runtime metadata exports would put docs-only data into the package API, cannot recover erased TypeScript types, and would contradict the package/app split documented in the local scaffold.

## Local evidence

### Intended boundary

`docs/notes/designSystemScaffold.md` defines a sound outer boundary:

- `packages/design-system` owns reusable components and tokens.
- `apps/design-system` owns presentation, examples, navigation, and docs metadata.
- The app consumes `@inspector/ds` like another consumer.
- Generated props are explicitly a scaffold rather than a completed extractor.

That boundary should remain. Package source should own the public API; the docs app should own extraction, selection, rendering, and generated artifacts.

### Current extraction path

The current path is incomplete:

- `apps/design-system/scripts/extract-props.mjs` always writes `{}`.
- `apps/design-system/src/generated/props.json` is empty.
- `apps/design-system/src/lib/propsData.ts` defines only `name`, `type`, `required`, and `sourcePath`.
- `getGeneratedProps` and `GeneratedPropsBySlug` still use the old slug vocabulary.
- No current page calls `getGeneratedProps`.
- `apps/design-system/src/components/docs/propsTable.tsx` renders complete `PropRow` values supplied by a page.

The generated schema is also too narrow for the table it is meant to feed. `PropRow` includes `defaultValue` and `description`, while `GeneratedPropItem` includes neither. A real extractor could fill types but could not make the current table source-authoritative without changing that contract.

### Current duplication and demonstrated drift

`packages/design-system/src/components/button/button.tsx` declares the custom API in `ButtonProps` and supplies runtime defaults in the component parameter list. `apps/design-system/src/components/content/components/button/props.tsx` independently repeats the types and defaults.

This has already drifted:

- The component defaults `radius` to `'xs'` in `button.tsx`.
- The handwritten table says the default is `"s"` in `props.tsx`.

That mismatch is direct evidence that types and defaults should not remain page-authored strings.

The package barrel exports `Button` but does not currently re-export `ButtonProps`, `ButtonVariant`, `ButtonSize`, `ButtonJustify`, or `ButtonRadius`. A source-file extractor can still inspect them, as Polar does, but extracting through the public package entry point would better validate what consumers can actually import. At minimum, generation should fail if the configured component export is not part of `@inspector/ds`.

### Renamed identifier

`apps/design-system/src/lib/registry.ts` has renamed `propsSlug` to `componentId`, but the rest of the prop-data layer still speaks in slugs. The rename is useful only if the new name represents a stable component identity rather than another route slug alias.

## Base UI v1.6.0 architecture

### End-to-end flow

Base UI v1.6.0 executes the following path:

1. Package source declares public components, prop interfaces, state types, inherited types, JSDoc descriptions, and `@default` tags. `packages/react/src/button/Button.tsx` is a compact example.
2. A docs-local `types.ts` imports the public package export and calls `createTypes(import.meta.url, Button)`. Compound components use `createMultipleTypes` against a namespace object.
3. `docs/next.config.mjs` applies `@mui/internal-docs-infra/pipeline/loadPrecomputedTypes` to every docs `types.ts` file under the app tree.
4. The loader parses the `createTypes` call, resolves the imported export, runs TypeScript extraction, applies ordering and description replacements, and synchronizes a neighboring `types.md` file.
5. `types.md` is committed, marked autogenerated, and reviewed as a readable API artifact. Base UI's contributing guide says it is regenerated by docs development, build, or validation commands.
6. In the same loader pass, rich precomputed metadata is injected into the `createTypes` factory call. The imported runtime component is removed from the transformed docs module.
7. `createTypes` converts the injected metadata into renderable values and passes it to Base UI's `ReferenceTable`.
8. `ReferenceTable` and `ReferenceAccordion` render props, requiredness, defaults, descriptions, detailed types, examples, data attributes, CSS variables, callable parameters, classes, and related types. `useTypes` also registers types and prop anchors for cross-reference links.

The committed Markdown is therefore not a package runtime export and not the direct React data model. It is a human-readable generated artifact in a larger precompute pipeline. The loader supplies the render-time structured metadata.

### Identity model

Base UI does not use a manually repeated string equivalent to the local `componentId` for basic lookup. The docs `types.ts` entry point identifies the API through the imported package export. The extractor preserves export names, namespace parts, aliases, canonical type names, and generated slugs.

For example, the Button page imports `Button`, while compound APIs expose entries such as `Checkbox.Root` through `createMultipleTypes`. Base UI's contributor guide also requires namespaced types to be top-level exports so extraction and canonical linking can resolve them.

This makes the public package export graph part of the documentation contract. It is stronger than locating a source file by convention or trusting a docs-only string.

### Scope and cost

Base UI supports far more than a prop table:

- single and compound components
- functions, hooks, and classes
- inherited and expanded types
- short and detailed type representations
- related type popovers and canonical aliases
- source dependency watching and hot updates
- data attributes and CSS variables
- configurable ordering
- Markdown output for repository browsing and other documentation consumers
- generated parent-page metadata

This architecture is internally coherent, but reproducing it locally would require custom Vite integration or adopting a substantial external docs pipeline. The local app has one documented component and a simple four-column table, so that cost is not proportional.

## Polar Orbit architecture

### End-to-end flow

Polar's Orbit app uses a smaller, explicit pipeline:

1. `clients/apps/orbit/scripts/extract-props.mjs` contains a list mapping a string slug to a package source file and exported component.
2. `ts-morph` loads the Orbit package's TypeScript project, resolves each component's call signature, takes its props parameter, and enumerates apparent properties.
3. The script removes `key`, `ref`, and internal names, then keeps declarations authored in Orbit plus explicit third-party module allowlists for thin wrappers.
4. It extracts type text, optionality, JSDoc description/default tags, and source path/line.
5. It writes `clients/apps/orbit/src/generated/props.json`, which is committed.
6. `props-data.ts` imports the JSON and exposes a `Map` keyed by prop name for a slug.
7. Each docs page still supplies a curated `PropRow[]` and a slug to `PropsTable`.
8. `PropsTable` merges generated fields into the curated rows and renders only the page-selected props.

### Authority boundary

Polar's comments say generated type, requiredness, default, and source should win when present, but the implementation is mixed:

- Generated `type` always replaces the handwritten type.
- Generated `source` is added.
- Handwritten `required` wins because the merge uses `row.required ?? gen.required`.
- Handwritten `default` wins because the merge uses `row.default ?? gen.default`.
- Handwritten `description` always wins because the generated description is not merged.

Polar therefore keeps package types authoritative only for the type string and source location. It deliberately preserves editorial control, but it can still drift on requiredness, defaults, and descriptions. Its Button page repeats all of those fields manually.

### Strengths and limits

Polar's main strengths are proportionality and transparency. The script is a normal command, JSON is easy to inspect, and the page controls which props matter to readers. Its main limits are a duplicated component manifest, direct source-file coupling, a manually curated merge layer, and no automatic proof that generated JSON is fresh unless CI runs and checks the generator.

## Architecture comparison

| Concern | Base UI v1.6.0 | Polar Orbit | Local scaffold |
| --- | --- | --- | --- |
| Authoritative API input | Public package exports, TypeScript, JSDoc | Package source files and call signatures | Intended package source, but not connected |
| Extraction trigger | Docs loader during dev/build/validation | Explicit `gen:props` script | Explicit script that writes `{}` |
| Entry declaration | Colocated docs `types.ts` importing package exports | Script-owned slug/file/export list | Registry `componentId` plus source path, not consumed by script |
| Generated artifact | Committed `types.md`, plus loader-injected structured data | Committed `props.json` | Empty `props.json` |
| Render data | Rich precomputed object injected into generated docs components | JSON merged with curated page rows | Handwritten `PropRow[]` only |
| Identity | Export and namespace names | Slug | Route slug plus renamed `componentId` |
| Defaults | Source/JSDoc extraction | Generated only when page omits its value | Handwritten and already drifting |
| Descriptions | Package JSDoc | Curated page text | Curated page text |
| Inherited props | Rich TypeScript model | Filtered by declaration origin and allowlist | No policy yet |
| Runtime package metadata | None | None | None |
| Complexity | High | Moderate | Low but incomplete |

## Authority and curation

The package should be authoritative for facts that define the usable API:

- prop names
- type text
- requiredness
- defaults
- public API descriptions
- deprecation information
- source declaration location

The docs app should be authoritative for presentation choices:

- whether to show all props or a selected subset
- prop ordering for a particular page
- grouping and section labels
- examples and usage guidance
- optional editorial notes that do not redefine the prop contract

This is stricter than Polar's current merge and smaller than Base UI's full rendering model. A curated page may store `['variant', 'size', 'loading']` or records containing only `name` and an optional docs-only note. It should not repeat the generated type, requiredness, or default.

Descriptions are the main policy choice. Keeping them only in pages is initially convenient, but it makes `packages/design-system` less authoritative and prevents other tooling from reusing the API documentation. Public prop descriptions should be JSDoc on `ButtonProps`, with page-specific guidance kept beside examples. This is the Base UI pattern and remains proportional because it requires no custom runtime system.

Defaults need a deliberate source convention. The local Button currently expresses them in destructuring rather than JSDoc. A narrow extractor could inspect that exact function shape, but such inference becomes fragile across component implementations. Prefer explicit `@default` or `@defaultValue` tags on package props and validate them during review against implementation changes. This also handles stable output formatting better than serializing arbitrary initializer AST.

Inherited props require an allowlist policy. Extracting every DOM and Base UI prop would overwhelm a curated table; filtering strictly to declarations under `packages/design-system` would omit meaningful wrapper behavior such as `disabled` and `render`. Follow Polar's approach at this boundary: include package-authored props by default, then explicitly include selected inherited modules or selected inherited prop names per component. The extractor should still resolve the public component signature, not maintain handwritten type strings.

## `componentId`

`componentId` should be the stable docs-domain join key for a component. It should not be treated as a synonym for the URL slug.

Recommended responsibilities:

1. The docs registry assigns `componentId` to component items, such as `button`.
2. The extraction manifest uses the same ID for the public export it extracts.
3. Generated JSON is keyed by that ID.
4. `propsData.ts` exposes names such as `GeneratedPropsByComponentId` and `getGeneratedProps(componentId)`.
5. A component page passes or derives the registry item's `componentId` when resolving generated API data.
6. Generation or validation fails for duplicate IDs, missing generated records for ready documented components, unknown generated IDs, and missing public exports.

The route `slug` should continue to control `href` and route lookup. This separation permits a route rename without changing generated API identity and permits one component identity to support a different documentation path.

The ID should not become a runtime export from `@inspector/ds`. It is a docs catalog identity, not component behavior. If the repository later needs the same identity in tests, visual regression fixtures, or release tooling, a build-time package manifest can be considered. That need does not exist in the current scaffold.

At the current scale, an explicit extraction entry such as `{ componentId: 'button', exportName: 'Button' }` is sufficient. Prefer resolving `Button` through the package entry point so generation verifies the public API. Add source-file overrides only when public-export resolution cannot identify the declaration. Avoid assuming `componentId` always equals a kebab-cased export name; that convention becomes ambiguous for compound components.

For type design, component navigation items should eventually require `componentId`, while foundation items should not have it. A discriminated registry type would encode that distinction if the registry grows. It is not necessary to add that abstraction solely for the first component.

## Artifact format

### Committed JSON

Committed JSON is the best current fit.

Benefits:

- It is structured for the existing React table.
- It is independent of the docs rendering framework.
- Diffs expose API changes and stale output in review.
- The docs build does not need to run TypeScript extraction merely to render a page.
- It can carry source paths and lines without adding them to package runtime code.
- It matches the scaffold and Polar's proven small-repository shape.

The JSON should include at least `name`, `type`, `required`, `defaultValue`, `description`, and `source: { path, line }`. It should be keyed by `componentId`. Optional richer fields can be added only when a renderer needs them.

The generator should produce deterministic property ordering and a trailing newline. Validation should run the generator and fail if the working tree changes, rather than trusting a cast such as `generatedProps as GeneratedPropsBySlug`.

### Generated TypeScript modules

A generated TypeScript module is not justified. It could provide an `as const satisfies` check, but the generator already controls the shape and can validate before writing. In exchange, it adds generated code syntax, import/export semantics, formatter interaction, and potentially larger diffs. It also encourages render-specific values such as React nodes to leak into generated metadata.

Use handwritten TypeScript for the schema and accessors, not for the generated records.

### Runtime package exports

Runtime exports are the weakest option for this repository.

- TypeScript types are erased and cannot be faithfully recovered at runtime.
- Handwritten runtime metadata would create another source that can drift.
- Docs-only strings and source locations would become part of the package's public API and bundle graph.
- The package would know about a specific documentation consumer, contrary to `designSystemScaffold.md`.
- Consumers that only need `Button` should not import or pay for API-reference metadata.

The package should export components and public TypeScript types. Extraction should inspect those exports outside the runtime path.

### Why not generated Markdown

Base UI's `types.md` is useful because its infrastructure also targets repository-readable API pages, page indexes, rich type links, and other text consumers. The local app already has a structured `PropsTable` and no Markdown API pipeline. Generating Markdown would force the app either to parse it back into data or add MDX processing. JSON is the smaller direct representation.

## Recommended architecture

### Data flow

1. Author the component API and public JSDoc in `packages/design-system`.
2. Export the component and consumer-facing types through the intended package entry point.
3. Register a docs component with a stable `componentId` and public export name.
4. Run a docs-side `ts-morph` extractor against the package TypeScript project and public export.
5. Extract package-owned props plus explicitly selected inherited props.
6. Write deterministic `apps/design-system/src/generated/props.json` keyed by `componentId`.
7. Resolve generated rows with `getGeneratedProps(componentId)`.
8. Let the page select and order prop names, then pass resolved rows to `PropsTable`.
9. Validate generation freshness in the focused app checks.

### Suggested artifact shape

```json
{
  "button": [
    {
      "name": "variant",
      "type": "ButtonVariant",
      "required": false,
      "defaultValue": "'primary'",
      "description": "Controls the visual treatment and emphasis of the action.",
      "source": {
        "path": "packages/design-system/src/components/button/button.tsx",
        "line": 55
      }
    }
  ]
}
```

Whether aliases such as `ButtonVariant` remain named or expand into their union should be one extractor-wide formatting policy. Polar preserves aliases defined outside the current scope; Base UI supports both short and detailed forms. The local table currently has only one type column, so a readable expanded union is preferable for small aliases, while named complex types can remain named until a detail UI exists.

### Proportional stopping point

Do not add the following until a concrete requirement appears:

- a custom Vite loader
- HAST precomputation
- generated React modules
- Markdown API generation
- namespace and canonical-type link registries
- runtime package metadata
- automatic page-index generation
- a generic compound-component renderer

The first complete implementation only needs `ts-morph`, a narrow extraction manifest, deterministic JSON, typed accessors, and a merge that prevents page-authored API facts from overriding generated facts.

## Risks and guardrails

### Stale generated data

Committing JSON helps review but does not itself guarantee freshness. The generation check must fail when regeneration changes the artifact.

### Public versus source-only APIs

Direct file extraction can document a component that is not actually exported. Resolve the configured export through `packages/design-system/src/index.ts` or separately assert that the export exists there.

### Inherited prop explosion

Do not render every apparent DOM property. Keep package declarations by default and make inherited inclusion explicit. The current handwritten Button page is useful evidence for the initial inherited allowlist: `disabled` and `render` are relevant, while the entire native button surface is not.

### Defaults

Do not preserve the Polar merge behavior where handwritten defaults win. Generated defaults should be final. A docs-only override should require an explicit exceptional mechanism and should be treated as a warning sign.

### Description drift

Move reusable prop descriptions into package JSDoc. Keep usage guidance in the docs page. Avoid two descriptions of the same contract unless the page text is clearly an editorial note rather than replacement API documentation.

### Source links

Store repository-relative paths and line numbers in generated data. Construct the repository URL in the docs app. Do not bake branch-specific full URLs into package source or generated records.

### Identifier drift

Rename the remaining slug-based prop APIs when the pipeline is implemented. `GeneratedPropsBySlug` and `getGeneratedProps(slug)` would otherwise preserve the exact ambiguity that `componentId` was introduced to remove.

## Sources

### Local evidence

- [`docs/notes/designSystemScaffold.md`](../../notes/designSystemScaffold.md)
- [`apps/design-system/scripts/extract-props.mjs`](../../../apps/design-system/scripts/extract-props.mjs)
- [`apps/design-system/src/lib/registry.ts`](../../../apps/design-system/src/lib/registry.ts)
- [`apps/design-system/src/lib/propsData.ts`](../../../apps/design-system/src/lib/propsData.ts)
- [`apps/design-system/src/components/docs/propsTable.tsx`](../../../apps/design-system/src/components/docs/propsTable.tsx)
- [`apps/design-system/src/components/content/components/button/props.tsx`](../../../apps/design-system/src/components/content/components/button/props.tsx)
- [`packages/design-system/src/components/button/button.tsx`](../../../packages/design-system/src/components/button/button.tsx)
- [`packages/design-system/src/index.ts`](../../../packages/design-system/src/index.ts)
- [`docs/research/polarOrbitExamples/findingsHistory.md`](../polarOrbitExamples/findingsHistory.md)
- [`docs/research/polarOrbitExamples/findingsOptions.md`](../polarOrbitExamples/findingsOptions.md)

### Base UI v1.6.0

- [Base UI v1.6.0 tag](https://github.com/mui/base-ui/releases/tag/v1.6.0)
- [Root scripts](https://github.com/mui/base-ui/blob/v1.6.0/package.json)
- [Docs package](https://github.com/mui/base-ui/blob/v1.6.0/docs/package.json)
- [Docs loader configuration](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)
- [Base UI contributing guide](https://github.com/mui/base-ui/blob/v1.6.0/CONTRIBUTING.md)
- [Button package source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)
- [Button package exports](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/index.ts)
- [Button data attributes](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/ButtonDataAttributes.tsx)
- [Button docs page](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx)
- [Button extraction entry](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)
- [Generated Button API Markdown](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md)
- [Compound Checkbox extraction entry](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/checkbox/types.ts)
- [`createTypes` adapter](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/createTypes.tsx)
- [Type ordering configuration](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/typeOrder.mjs)
- [Reference table](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceTable.tsx)
- [Prop reference accordion](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceAccordion.tsx)
- [Pinned docs-infra package manifest](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/package.json)
- [Pinned precompute loader](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.mjs)
- [Pinned types factory](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/abstractCreateTypes/abstractCreateTypes.mjs)
- [Pinned server type pipeline](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/pipeline/loadServerTypes/loadServerTypes.mjs)
- [Pinned Markdown synchronization](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/pipeline/syncTypes/syncTypes.mjs)
- [Pinned render-time type hook](https://unpkg.com/@mui/internal-docs-infra@0.11.1-canary.22/useTypes/useTypes.mjs)
- [API reference generator change](https://github.com/mui/base-ui/pull/2932)

### Polar Orbit

- [Polar Orbit prop extractor](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/scripts/extract-props.mjs)
- [Polar Orbit generated JSON](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/generated/props.json)
- [Polar Orbit prop-data accessor](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/lib/props-data.ts)
- [Polar Orbit props table and merge](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/PropsTable.tsx)
- [Polar Orbit Button page](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/button/page.tsx)
- [Polar Orbit package scripts and dependencies](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/package.json)
