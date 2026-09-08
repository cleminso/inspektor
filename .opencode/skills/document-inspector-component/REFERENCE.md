# Inspektor component documentation reference

## Table of contents

- [Ownership boundary](#ownership-boundary)
- [Idempotent updates](#idempotent-updates)
- [Required files](#required-files)
- [Playgrounds](#playgrounds)
- [Failure handling](#failure-handling)
- [Completion checklist](#completion-checklist)

## Ownership boundary

`packages/design-system` owns public component behavior and APIs. `apps/design-system` owns navigation, one representative playground, consumer-facing source, and curated interactive controls.

Examples must demonstrate the closed styling contract. Do not teach consumers to pass `className`, inline `style`, raw CSS values, or arbitrary styling callbacks.

## Idempotent updates

Inspect the public package export, registry item, content page, playground, and static route. Create only absent surfaces and update only stale behavior. Do not add duplicate navigation, previews, controls, or routes.

## Required files

A component page normally includes:

- `src/components/content/components/{componentName}/page.tsx`
- an optional `playground.tsx` for interactive state and controls
- one focused example module for a fixed preview
- `src/routes/components/{componentName}.tsx`
- one registry item

Every page uses `ComponentDocsPage`. Static route files are authored source; `routeTree.gen.ts` is generated and must not be hand-edited.

## Playgrounds

Interactive playground state drives three synchronized outputs:

- the center preview;
- the right-dock controls;
- the copyable source in the center code island.

Controls are curated product inputs, not generated from TypeScript declarations. Use selects and switches only where the state has a clear preview effect. Omit controls for fixed previews rather than inventing configuration.

Fixed examples compile as consumer code. Import the module normally for preview and with `?raw` for the exact displayed source. Do not maintain a second handwritten source string.

Compound components use one representative composition. Do not create separate API tables or a matrix of secondary examples.

## Failure handling

- Missing public export: fix `packages/design-system/src/index.ts`.
- Preview/source mismatch: make the serializer or paired raw import authoritative.
- Unsupported control: keep the preview fixed or extend the constrained playground control model.
- Shiki regression: verify the shared JavaScript engine and precompiled TSX grammar rather than adding a page-local highlighter.
- Missing registry match: align the page source reference with the registry item.

## Completion checklist

- Package public export verified
- Registry item added
- One representative playground or fixed preview added
- Preview and displayed source synchronized
- Interactive controls exposed only through the right dock
- Component title and description rendered in the center header
- Static route added without hand-editing generated route output
- No secondary examples, generated props tables, or placeholder guidance added
- App validation passes
