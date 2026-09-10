# Inspektor component documentation reference

## Table of contents

- [Ownership boundary](#ownership-boundary)
- [Required files](#required-files)
- [Page model](#page-model)
- [Scenario model](#scenario-model)
- [Failure handling](#failure-handling)
- [Completion checklist](#completion-checklist)

## Ownership boundary

`packages/design-system` owns public component behavior and APIs. `apps/design-system` owns navigation, authored guidance, executable scenarios, and source presentation.

Documentation demonstrates the closed styling contract. It does not teach consumers to pass `className`, inline `style`, raw CSS values, or arbitrary styling callbacks.

## Required files

A documented component includes:

- `src/content/components/{componentName}/page.mdx`
- one or more focused TSX modules under `src/content/components/{componentName}/demos/`
- focused tests for stateful behavior and page-level contracts
- `src/routes/components/{componentSlug}.tsx`
- one registry item

Static route files are authored source. `src/routeTree.gen.ts` is generated and must not be hand-edited.

## Page model

The registry owns title, description, route, source path, and navigation order. The route binds that metadata to `ComponentPage` and the MDX content module.

MDX owns the narrative sequence. `Default` is the normal first section. Usage, Variants, Sizes, States, Anatomy, Accessibility, and Best practices are included only when they teach a real distinction.

MDX is not an application-logic layer. Keep hooks, mutable state, StyleX, and substantial data in TSX.

## Scenario model

One scenario file owns both the rendered example and displayed source:

```tsx
import Example from './demos/exampleDemo'
import exampleSource from './demos/exampleDemo.tsx?raw'
```

`ComponentDemo` renders the example and its visible source as one bordered surface. A scenario can compare coordinated instances when comparison itself teaches the intended usage.

Do not introduce a global demo registry, state-to-source serializer, or duplicated MDX code block without a requirement that the direct import model cannot satisfy.

## Failure handling

- Missing public export: fix `packages/design-system/src/index.ts`.
- Preview/source mismatch: import the same scenario module normally and through `?raw`.
- MDX type complexity: move the expression or behavior into a typed TSX module.
- Shiki regression: verify the shared JavaScript engine and precompiled TSX grammar.
- Missing registry match: align registry metadata, MDX content, and the static route.
- Route mismatch: fix source route files and regenerate; never repair `routeTree.gen.ts` by hand.

## Completion checklist

- Public package export verified
- Registry item added
- Authored MDX page added
- Meaningful executable scenarios added
- Preview and displayed source share one TSX file
- Stateful behavior tested
- Static route added without hand-editing generated output
- No placeholder guidance or generated prop table added
- Supported color schemes and viewport widths verified
- App validation passes
