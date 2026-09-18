# Base UI API reference — implementation evidence

## Table of contents

- [Evidence scope](#evidence-scope)
- [End-to-end extraction path](#end-to-end-extraction-path)
- [Field provenance](#field-provenance)
- [Page rendering](#page-rendering)
- [Commands and validation](#commands-and-validation)
- [Source index](#source-index)

## Evidence scope

Baseline: Base UI `v1.6.0` (`b34551d`), which pins `@mui/internal-docs-infra` `0.11.1-canary.22` and `typescript-api-extractor` `1.0.0-beta.3`. Evidence came from the tagged repository and pinned package artifacts, not from web searches.

## End-to-end extraction path

1. `packages/react/src/button/index.ts` re-exports `Button` and its types.
2. `packages/react/src/button/Button.tsx` defines `ButtonProps`, `ButtonState`, direct JSDoc, and runtime defaults.
3. `packages/react/src/internals/types.ts` defines inherited `NativeButtonProps` and `BaseUIComponentProps`.
4. `packages/react/src/button/ButtonDataAttributes.tsx` defines the `data-disabled` enum.
5. `docs/src/app/(docs)/react/components/button/types.ts` imports `Button` and calls `createTypes(import.meta.url, Button)`.
6. `docs/next.config.mjs` applies `loadPrecomputedTypes` to every `types.ts`.
7. The loader parses the factory call, resolves the import through the package export map, and invokes `loadServerTypes({ sync: true, output: 'hastCompressed' })`.
8. A worker creates a TypeScript program and calls `parseFromProgram` from `typescript-api-extractor`.
9. The extractor uses `program.getTypeChecker()` to read exports, recognize React component-like callables, resolve object properties and inherited members, parse enums, and read JSDoc.
10. `syncTypes` writes the committed `types.md`; `loadServerTypes` produces compressed HAST, short/detailed types, slugs, and an anchor map.
11. The loader injects the precomputed object into the transformed `types.ts` and removes the runtime `Button` import.

## Field provenance

| Field                 | Source                                                            |
| --------------------- | ----------------------------------------------------------------- |
| Prop name             | TypeScript property symbol                                        |
| Type                  | TypeScript checker type graph, formatted by docs-infra            |
| Required              | Optional symbol flag                                              |
| Default               | JSDoc `@default`                                                  |
| Description           | Declaration JSDoc, with configured replacements                   |
| Component description | JSDoc on exported component                                       |
| Inherited props       | Resolved callable prop object; external-only declarations dropped |
| Data attributes       | `*DataAttributes.ts(x)` enum by filename convention               |
| CSS variables         | `*CssVars.ts(x)` enum by filename convention                      |

Button's documented defaults for `focusableWhenDisabled` and `nativeButton` come from JSDoc `@default`, not from destructuring initializers. `disabled` is inherited through `React.ComponentPropsWithRef<'button'>` and is filtered out because its declarations are external.

## Page rendering

- `page.mdx` renders `<TypesButton />` under the `## API reference` heading.
- `createTypes` is configured with `ReferenceTable`, `TableCode`, `CodeBlock`, and `TypeRef` components.
- `ReferenceTable` dispatches to `ReferenceAccordion` for props, `AttributesReferenceTable` for data attributes, and `AdditionalTypes` for related types.
- `ReferenceAccordion` renders each prop as a `<details>` item with summary name, short type, default, and expand icon; expanded content shows description, detailed type, and default.
- `TypeRef` resolves highlighted type names through `useTypes` and `TypesDataProvider`.

Source and navigation links (`View as Markdown`, `View source`) are rendered by `Subtitle`, not by `ReferenceTable`.

## Commands and validation

- `pnpm docs:api` regenerates all `types.md` files and fails under CI when committed output changes.
- `pnpm docs:validate` validates generated type files and page indexes.
- `pnpm docs:dev` runs Next; visiting a page triggers loader regeneration.
- `pnpm docs:build` runs LLM generation, Next build, and link checking.

The CI workflow in `ci.yml` runs `pnpm release:build` but does not directly invoke `docs:api` or `docs:validate`. The enforced workflow is contributor-command based, not a dedicated CI job.

## Source index

### Base UI v1.6.0

- `docs/src/app/(docs)/react/components/button/page.mdx`
- `docs/src/app/(docs)/react/components/button/types.ts`
- `docs/src/app/(docs)/react/components/button/types.md`
- `docs/src/app/(docs)/layout.tsx`
- `docs/src/utils/createTypes.tsx`
- `docs/src/utils/typeOrder.mjs`
- `docs/src/mdx-components.tsx`
- `docs/src/studio/ReferenceTable/ReferenceTable.tsx`
- `docs/src/studio/ReferenceTable/ReferenceAccordion.tsx`
- `docs/src/studio/ReferenceTable/AttributesReferenceTable.tsx`
- `docs/src/studio/ReferenceTable/AdditionalTypes.tsx`
- `docs/src/studio/TypeRef/TypeRef.tsx`
- `docs/src/studio/Subtitle/Subtitle.tsx`
- `docs/next.config.mjs`
- `packages/react/src/button/index.ts`
- `packages/react/src/button/Button.tsx`
- `packages/react/src/button/ButtonDataAttributes.tsx`
- `packages/react/src/internals/types.ts`

### `@mui/internal-docs-infra` 0.11.1-canary.22

- `packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts`
- `packages/docs-infra/src/pipeline/loadServerTypes/loadServerTypes.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/loadServerTypesMeta.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts`
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/findMetaFiles.ts`
- `packages/docs-infra/src/pipeline/syncTypes/syncTypes.ts`
- `packages/docs-infra/src/abstractCreateTypes/abstractCreateTypes.tsx`
- `packages/docs-infra/src/cli/runValidate.ts`

### `typescript-api-extractor` 1.0.0-beta.3

- `src/parser.ts`
- `src/parsers/componentParser.ts`
- `src/parsers/propertyParser.ts`
- `src/parsers/documentationParser.ts`
- `src/parsers/enumParser.ts`
