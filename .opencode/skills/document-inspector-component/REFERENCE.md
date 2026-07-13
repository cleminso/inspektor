# Inspector component documentation reference

## Table of contents

- [Ownership boundary](#ownership-boundary)
- [Idempotent updates](#idempotent-updates)
- [Required files](#required-files)
- [Generated props](#generated-props)
- [Examples](#examples)
- [Compound APIs](#compound-apis)
- [Failure handling](#failure-handling)
- [Completion checklist](#completion-checklist)

## Ownership boundary

`packages/design-system` owns public names, types, requiredness, runtime defaults, descriptions, and deprecations. `apps/design-system` owns navigation, page composition, example selection, prop ordering, grouping, and usage guidance.

Do not fix generated metadata in `props.json` or duplicate API facts in a page. Correct package source or extraction logic and regenerate.

Examples must demonstrate the closed styling contract. Do not teach consumers to pass `className`, inline `style`, raw CSS values, or arbitrary styling callbacks to design-system components.

## Idempotent updates

Inspect all documentation surfaces for the component: public package export, extraction entry, extractor tests, generated metadata, registry item, content page, examples, prop selection, and static route. Compare them with the current package API.

Create only absent surfaces and update only stale facts or examples. If every surface already matches, make no source edits and run the validation commands. This keeps repeated documentation requests safe and avoids duplicate navigation, extraction entries, or routes.

## Required files

A component page normally includes:

- `src/components/content/components/{componentName}/page.tsx`
- one or more focused `{topic}Example.tsx` modules
- `props.ts` containing ordered prop names only
- `src/routes/components/{componentName}.tsx`
- one registry item with `componentId`
- one extraction entry and generated JSON record

Navigation contains documented components only. Do not add planned components or readiness badges to reserve future routes.

Static route files are authored source. `routeTree.gen.ts` is generated output and must not be hand-edited. Router tooling may regenerate it when a static route is added; review and retain the generated result produced by the repository commands.

## Generated props

The extractor resolves the public export from `packages/design-system/src/index.ts`, filters external DOM props, reads package JSDoc, and reads literal defaults from parameter destructuring.

Use `inheritedProps` only for meaningful external props that cannot be redeclared in the package. Prefer package redeclarations with JSDoc when the inherited behavior is part of the design-system contract.

Generated output is committed and deterministic. Run generation after package source formatting because source line numbers are included. `check:props` must fail when the artifact is stale.

## Examples

Each example module must compile as ordinary consumer code. The page imports the module twice: the normal import renders the preview, while the `?raw` import supplies the exact source string to Shiki and clipboard actions.

Do not put page wrappers, fixed widths, or documentation-only labels inside the example unless consumers need them. Do not maintain a second handwritten source string.

Cover the component's meaningful dimensions without creating a matrix for every prop combination:

- semantic variants
- supported sizes
- interaction and disabled/loading states
- render composition
- one representative compound composition

## Compound APIs

Treat each public part as its own API surface. Add extraction support for namespaced or `Object.assign` exports before generating tables. Present root, trigger, popup, item, or equivalent part props in separate sections, sharing examples where that improves comprehension.

The registry `componentId` identifies the whole documented component. Generated metadata may use part-qualified keys beneath that identity, but route slugs must not become API identity.

## Failure handling

- Missing public export: fix `packages/design-system/src/index.ts` or the extraction entry.
- Missing generated prop: verify the page selection and package call signature.
- Unwanted DOM props: tighten declaration-origin filtering.
- Missing inherited behavior: redeclare it with package JSDoc or add a narrow allowlist entry.
- Wrong default: fix the runtime destructuring initializer; never patch generated JSON.
- Unsupported compound export: add a failing extractor test, then extend declaration resolution.
- Shiki regression: verify the shared JavaScript engine and precompiled TSX grammar rather than adding a page-local highlighter.

## Completion checklist

- Package public export and Base UI source verified
- Registry item and stable `componentId` added
- Extraction entry and tests added
- Generated metadata refreshed
- Focused executable examples added with `?raw`
- Prop names selected without duplicated API facts
- Static route and page metadata added
- No placeholder navigation or readiness marker added
- App and package validation pass
