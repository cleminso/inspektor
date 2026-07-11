# Base UI v1.6.0 API metadata extraction pipeline

## Table of contents

- [Conclusion](#conclusion)
- [Evidence scope](#evidence-scope)
- [Button source inputs](#button-source-inputs)
- [End-to-end extraction path](#end-to-end-extraction-path)
- [Field provenance](#field-provenance)
- [Inherited props](#inherited-props)
- [Data attributes and CSS variables](#data-attributes-and-css-variables)
- [Source locations](#source-locations)
- [Generated artifacts](#generated-artifacts)
- [Rendering consumers](#rendering-consumers)
- [Commands and validation](#commands-and-validation)
- [CI behavior](#ci-behavior)
- [Relevant upstream paths](#relevant-upstream-paths)

## Conclusion

Base UI v1.6.0 does not use `react-docgen`. It uses the external
[`typescript-api-extractor`](https://github.com/michaldudak/typescript-api-extractor/tree/v1.0.0-beta.3)
package through
[`@mui/internal-docs-infra`](https://www.npmjs.com/package/@mui/internal-docs-infra/v/0.11.1-canary.22).
`typescript-api-extractor` is custom TypeScript AST/type-model tooling built directly on the
TypeScript compiler API. It creates a `ts.Program`, obtains a `TypeChecker`, resolves exported
types and inherited properties, and reads JSDoc through TypeScript APIs. It is unrelated to
Microsoft's `@microsoft/api-extractor` despite the similar name.

There is no single metadata manifest serving as source of truth. The authoritative inputs are:

- TypeScript declarations for names, types, inheritance, and optionality.
- JSDoc on those declarations for descriptions and `@default` values.
- conventionally named enum files ending in `DataAttributes` and `CssVars` for styling metadata.
- each docs page's `types.ts` import for selecting the public entrypoint to extract.
- docs loader configuration for ordering and description rewriting.

The generated `types.md` and parent `page.mdx` outline are committed derivatives. The interactive
reference table receives a richer precomputed HAST payload injected into the compiled `types.ts`
module by a webpack/Turbopack loader. Runtime default assignments are not analyzed, so JSDoc
defaults can drift from implementation behavior.

## Evidence scope

The Base UI evidence uses tag
[`v1.6.0`](https://github.com/mui/base-ui/tree/v1.6.0), commit
[`b34551d`](https://github.com/mui/base-ui/commit/b34551d644f2e58ebf8fc1050d949f6654ceca6c).
That tag pins `@mui/internal-docs-infra` to `0.11.1-canary.22` and
`typescript-api-extractor` to `1.0.0-beta.3` in
[`pnpm-lock.yaml`](https://github.com/mui/base-ui/blob/v1.6.0/pnpm-lock.yaml).
The published docs-infra package identifies its source commit as
[`c0380f2`](https://github.com/mui/mui-public/tree/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra).

No web or DeepWiki search was required. The trace used the tagged repository, exact pinned package
artifacts, their repository metadata, and direct source fetches.

## Button source inputs

The extraction starts with these Base UI files:

1. [`packages/react/src/button/index.ts`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/index.ts)
   publicly re-exports `Button` and its types.
2. [`packages/react/src/button/Button.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)
   defines the component, `ButtonProps`, `ButtonState`, direct JSDoc, and runtime defaults.
3. [`packages/react/src/internals/types.ts`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/types.ts)
   defines the inherited `NativeButtonProps` and `BaseUIComponentProps` members.
4. [`packages/react/src/button/ButtonDataAttributes.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/ButtonDataAttributes.tsx)
   defines the `data-disabled` enum member and description. It is discovered by filename convention;
   the Button entrypoint does not export it.
5. [`docs/src/app/(docs)/react/components/button/types.ts`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)
   imports `Button` from `@base-ui/react/button` and calls
   `createTypes(import.meta.url, Button)`.

The Button implementation destructures three runtime defaults: `disabled = false`,
`focusableWhenDisabled = false`, and `nativeButton = true`. Only the latter two appear in the API
table because they have locally extracted props with `@default` JSDoc. `disabled` is inherited from
React's external intrinsic button props and is filtered out.

## End-to-end extraction path

1. The Button MDX page imports and renders `TypesButton` in
   [`page.mdx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx).
2. `TypesButton` is declared by `createTypes(import.meta.url, Button)` in the adjacent `types.ts`.
3. [`docs/next.config.mjs`](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)
   applies `@mui/internal-docs-infra/pipeline/loadPrecomputedTypes` to every docs `types.ts` file for
   both webpack and Turbopack. It also supplies ordering and description replacements.
4. The loader parses the factory call, resolves the imported component module, maps the `types.ts`
   path to `types.md`, and invokes `loadServerTypes({ sync: true, output: 'hastCompressed' })`.
   Evidence:
   [`packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts`](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts).
5. `resolveLibrarySourceFiles` resolves relative imports, tsconfig path mappings, or package imports.
   Base UI's package export maps `@base-ui/react/button` to `src/button/index.ts`, so source is
   analyzed directly. External packages can be analyzed through declarations or declaration source
   maps.
6. `loadServerTypesMeta` finds sibling and recursively re-exported `DataAttributes` and `CssVars`
   files, loads the docs tsconfig, and sends all entrypoints to a worker.
7. The worker creates an optimized TypeScript program and calls
   `parseFromProgram(entrypoint, program, parserOptions)` from `typescript-api-extractor`. The parser
   options set `includeExternalTypes: false`, cap traversal depth at 15, and cap expanded object
   shapes at 50 properties.
8. `typescript-api-extractor` uses `program.getTypeChecker()`, reads exports, recognizes React
   component-like callable exports, resolves object properties and inherited members, parses enums,
   and reads JSDoc. Evidence:
   [`src/parser.ts`](https://github.com/michaldudak/typescript-api-extractor/blob/v1.0.0-beta.3/src/parser.ts),
   [`src/parsers/componentParser.ts`](https://github.com/michaldudak/typescript-api-extractor/blob/v1.0.0-beta.3/src/parsers/componentParser.ts),
   and
   [`src/parsers/propertyParser.ts`](https://github.com/michaldudak/typescript-api-extractor/blob/v1.0.0-beta.3/src/parsers/propertyParser.ts).
9. docs-infra formats the extractor's model into component metadata, rewrites canonical type names,
   converts descriptions from markdown to HAST, and associates matching metadata enums with the
   component.
10. `syncTypes` serializes the plain-text form to committed `types.md` and updates the parent docs
    index. `loadServerTypes` also syntax-highlights types/defaults and creates compressed HAST,
    short types, detailed types, slugs, and anchor maps.
11. The loader injects that precomputed object into the transformed `createTypes` call and removes
    the runtime component import. `createTypesFactory` converts the payload to JSX and passes it to
    Base UI's `ReferenceTable`.

## Field provenance

| Documentation field | Authoritative input | Extraction and transformation | Button result |
| --- | --- | --- | --- |
| Prop name | TypeScript property symbol | `propertySymbol.getName()`; inherited object properties are flattened by the checker | `focusableWhenDisabled`, `nativeButton`, `className`, `style`, `render` |
| Type | TypeScript checker type graph | custom extractor type nodes, then docs-infra `formatType`; optional `undefined` is removed for compact display and retained in internal highlighted data | `boolean`, callback unions, `ReactElement` render union |
| Required flag | `?`/optional symbol flag, not JSDoc | property parser checks `SymbolFlags.Optional`; docs-infra emits `required: !prop.optional`; markdown adds `*` only for required names; the React table renders a star | all documented Button props are optional |
| Default | JSDoc `@default` | TypeScript JSDoc APIs populate `documentation.defaultValue`; docs-infra copies it to `defaultText` and highlighted `default` | `false` for `focusableWhenDisabled`; `true` for `nativeButton` |
| Description | declaration JSDoc | TypeScript JSDoc APIs; docs-infra applies configured replacements and parses markdown to HAST | text from `ButtonProps`, `NativeButtonProps`, and `BaseUIComponentProps` declarations |
| Component description | JSDoc on exported component | extractor export documentation, with the configured trailing `Documentation:` paragraph removed | two-line Button description |
| Inherited props | resolved callable prop object from the TypeScript checker | local inherited/intersected declarations remain; members declared only in `node_modules` are excluded | local shared props included; intrinsic DOM props excluded |
| Data attributes | enum values in `*DataAttributes.ts(x)` | recursive suffix discovery, enum parsing, name association, sorting | `data-disabled` |
| CSS variables | enum values in `*CssVars.ts(x)` | same convention and enum pipeline | none for Button |
| Attribute/variable type | enum-member `@type` JSDoc | `formatEnum` reads the `type` tag | Button's attribute has no type value |
| Source location | docs `types.ts` URL and resolved filesystem dependencies | used for resolution, output path selection, and rebuild watching; not retained as member metadata | no file/line link in Button API data |

Defaults deserve special emphasis: docs-infra does not inspect destructuring initializers or runtime
behavior. The source of a displayed default is the manually authored `@default` tag. A runtime
initializer without the tag does not produce a documented default.

## Inherited props

`ButtonProps` extends both `NativeButtonProps` and
`BaseUIComponentProps<'button', ButtonState>`. The TypeScript checker resolves the complete callable
prop object before the custom extractor serializes it.

- `focusableWhenDisabled` comes directly from `ButtonProps`.
- `nativeButton` comes from local `NativeButtonProps`.
- `className`, `render`, and `style` come from local `BaseUIComponentProps`.
- ordinary `<button>` props come through `React.ComponentPropsWithRef<'button'>`, but their
  declarations are in `node_modules`; `includeExternalTypes: false` causes the object parser to drop
  properties whose declarations are all external.
- `ref` is separately removed by docs-infra for component tables.

The committed Button artifact confirms that exact set in
[`docs/src/app/(docs)/react/components/button/types.md`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md).
This is semantic inheritance through the TypeScript type checker, not textual parsing of the
`extends` clause and not a hand-maintained inherited-props list.

## Data attributes and CSS variables

Styling metadata is not inferred from rendered JSX, state mappings, or CSS.
[`findMetaFiles`](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/findMetaFiles.ts)
recursively scans component and re-export directories for files ending in `DataAttributes.ts(x)` or
`CssVars.ts(x)`. The worker parses these otherwise unimported files as extra entrypoints.

[`formatComponent.ts`](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts)
associates enums by names such as `ButtonDataAttributes` and `ButtonCssVars`, with fallback matching
for re-exported namespaced components. Enum values become displayed keys, member JSDoc becomes the
description, and an optional `@type` tag becomes the displayed type. Base UI's
[`typeOrder.mjs`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/typeOrder.mjs)
controls final ordering.

Button has `ButtonDataAttributes` but no `ButtonCssVars`, so generated metadata contains one data
attribute and an empty CSS-variable record.

## Source locations

The pipeline has source-location machinery, but it does not produce per-prop source-location data:

- `import.meta.url` tells `createTypes` and the loader which docs `types.ts` is being transformed.
- the loader's `resourcePath` determines the adjacent generated `types.md` path.
- imported module URLs identify entrypoints; tsconfig paths, package resolution, or declaration maps
  identify actual TypeScript/declaration files.
- the worker traverses imported source files and returns them as dependencies; the loader registers
  them with webpack for rebuilds.
- extractor output models store names, type nodes, documentation, and optionality, but no declaration
  file/line range. docs-infra's formatted property and enum models also omit it.
- Button's generated markdown and `ReferenceTable` contain no source-file or line link.

Therefore source paths affect extraction and invalidation, but source locations do not become API
documentation fields in v1.6.0. The `import.meta.url` comments in `createTypes` describe docs-module
location, not a user-facing source-link feature.

## Generated artifacts

### Committed artifacts

- [`button/types.md`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md)
  is generated and committed. It contains the component description, prop table, data-attribute
  table, `Button.Props` alias note, `Button.State`, and canonical type aliases.
- [`components/page.mdx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/page.mdx#L289-L310)
  has a generated Button outline listing props, data attributes, and related types.

### Build payload

`loadPrecomputedTypes` injects a non-committed `precompute` object into the transformed `types.ts`.
It includes organized exports, additional types, compressed highlighted HAST, variant type names,
the selected component name, slugs, and an anchor map. It then rewrites the actual Button import out
of the compiled module so documentation rendering does not load the component implementation.

### Other consumer artifact

The LLM-text generator's
[`typedocProcessor.mjs`](https://github.com/mui/base-ui/blob/v1.6.0/docs/scripts/generateLlmTxt/typedocProcessor.mjs)
reads the committed `types.md` and splices its AST into generated documentation text. This consumer
uses the markdown derivative rather than the interactive precompute payload.

## Rendering consumers

Base UI's
[`createTypes.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/createTypes.tsx)
configures docs-infra's `createTypesFactory` with Base UI components for code, tables, and MDX. The
factory reads the loader-injected precompute data, converts compressed HAST to JSX, and passes
`type` plus `additionalTypes` into
[`ReferenceTable.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceTable.tsx).

`ReferenceTable` dispatches component metadata to:

- [`ReferenceAccordion.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceAccordion.tsx)
  for prop names, required stars, short/detailed types, defaults, descriptions, examples, and anchors.
- [`AttributesReferenceTable.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/AttributesReferenceTable.tsx)
  for data attributes.
- [`CssVariablesReferenceTable.tsx`](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/CssVariablesReferenceTable.tsx)
  for CSS variables.
- `AdditionalTypes` for state, prop aliases, and other related exported types.

The MDX page itself only chooses where `<TypesButton />` appears. It does not manually provide the
Button rows.

## Commands and validation

The relevant scripts in
[`package.json`](https://github.com/mui/base-ui/blob/v1.6.0/package.json) and
[`docs/package.json`](https://github.com/mui/base-ui/blob/v1.6.0/docs/package.json) are:

| Command | Behavior |
| --- | --- |
| `pnpm docs:api` | Runs docs-infra validation with `--types`, regenerating all `types.md` files and failing under CI when committed output changes. |
| `pnpm docs:validate` | Runs the docs validator for generated type files and generated page indexes. |
| `pnpm docs:dev` | Starts Next; visiting a page runs the `types.ts` loader and regenerates its `types.md`. |
| `pnpm docs:build` | Runs LLM generation, the Next build, and link checking; the Next loader regenerates type metadata during the build. |
| `pnpm --filter docs build` | Runs the docs package's Next build and link check. |

The generated file header also gives a scoped command:
`pnpm docs:validate "(docs)/react/components/button"`.

The validator scans for `types.ts`, parses each `createTypes` call, runs `syncTypes`, compares the
new markdown with the committed file, and records changed files. In CI mode it prints `git diff` and
exits with failure if regeneration changed any generated file. See
[`runValidate.ts`](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/cli/runValidate.ts)
and
[`validateWorker.ts`](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/cli/validateWorker.ts).

Base UI's contributor instructions explicitly require `pnpm docs:api` after public API or JSDoc
changes and identify `types.md` as generated:
[`AGENTS.md`](https://github.com/mui/base-ui/blob/v1.6.0/AGENTS.md) and
[`CONTRIBUTING.md`](https://github.com/mui/base-ui/blob/v1.6.0/CONTRIBUTING.md#autogenerated-files).

## CI behavior

The v1.6.0
[`ci.yml`](https://github.com/mui/base-ui/blob/v1.6.0/.github/workflows/ci.yml)
runs `pnpm release:build`. It does not directly invoke `pnpm docs:api`, `pnpm docs:validate`, or the
docs package's private `build` script. `release:build` runs LLM generation and builds non-private
packages, while the docs package is private.

Consequently, the repository contains validator machinery that fails on stale generated files when
run with `CI` set, but the tagged CI workflow has no explicit generated-API staleness check. LLM
generation consumes committed `types.md` and can detect a missing file, not a stale file whose
source declarations changed. The enforced workflow visible in the tag is contributor-command based,
not a dedicated CI job.

## Relevant upstream paths

### Base UI v1.6.0

- `packages/react/src/button/Button.tsx`
- `packages/react/src/button/ButtonDataAttributes.tsx`
- `packages/react/src/button/index.ts`
- `packages/react/src/internals/types.ts`
- `packages/react/package.json`
- `docs/src/app/(docs)/react/components/button/types.ts`
- `docs/src/app/(docs)/react/components/button/types.md`
- `docs/src/app/(docs)/react/components/button/page.mdx`
- `docs/src/app/(docs)/react/components/page.mdx`
- `docs/src/utils/createTypes.tsx`
- `docs/src/utils/typeOrder.mjs`
- `docs/src/components/ReferenceTable/ReferenceTable.tsx`
- `docs/src/components/ReferenceTable/ReferenceAccordion.tsx`
- `docs/src/components/ReferenceTable/AttributesReferenceTable.tsx`
- `docs/src/components/ReferenceTable/CssVariablesReferenceTable.tsx`
- `docs/next.config.mjs`
- `docs/package.json`
- `package.json`
- `.github/workflows/ci.yml`

### `@mui/internal-docs-infra` 0.11.1-canary.22

- `packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts`
- `packages/docs-infra/src/pipeline/loadServerTypes/loadServerTypes.ts`
- `packages/docs-infra/src/pipeline/loadServerTypes/highlightTypesMeta.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/loadServerTypesMeta.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/processTypes.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/resolveLibrarySourceFiles.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/findMetaFiles.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/format.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts`
- `packages/docs-infra/src/pipeline/syncTypes/syncTypes.ts`
- `packages/docs-infra/src/pipeline/syncTypes/generateTypesMarkdown.ts`
- `packages/docs-infra/src/abstractCreateTypes/abstractCreateTypes.tsx`
- `packages/docs-infra/src/cli/runValidate.ts`
- `packages/docs-infra/src/cli/validateWorker.ts`

### `typescript-api-extractor` 1.0.0-beta.3

- `src/parser.ts`
- `src/parsers/moduleParser.ts`
- `src/parsers/componentParser.ts`
- `src/parsers/objectParser.ts`
- `src/parsers/propertyParser.ts`
- `src/parsers/documentationParser.ts`
- `src/parsers/enumParser.ts`
- `src/models/types/object.ts`
- `src/models/documentation.ts`
