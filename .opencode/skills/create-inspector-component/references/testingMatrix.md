# Testing matrix

## Table of contents

- [Testing boundary](#testing-boundary)
- [Decision matrix](#decision-matrix)
- [Composition proof](#composition-proof)
- [Contract proof](#contract-proof)
- [Validation commands](#validation-commands)

## Testing boundary

Test Inspector responsibilities, not Base UI's internal suite. Prove wrapper prop projection, transformations, composition, refs, event preservation, state-to-style mapping, documentation extraction, and package-owned behavior.

Add regression coverage whenever the wrapper changes Base UI composition, rendered elements, event handling, ref handling, generated attributes, controlled state, or mount behavior.

## Decision matrix

| Change | Required proof |
| --- | --- |
| Broad Base UI prop inheritance | Typecheck and public API metadata |
| Base UI prop omitted | Type-level rejection or extracted API assertion |
| Base UI prop redeclared | Typecheck, JSDoc extraction, and default assertion where relevant |
| Inspector prop added | Type contract plus focused behavior or style mapping test |
| Prop transformed or derived | Behavioral test for precedence and resulting Base UI behavior |
| Semantic event exposed | Handler receives complete Base UI event details |
| Ref boundary changed | Default and composed ref target regression test |
| `render` exposed | Composition, handlers, attributes, semantics, and ref test |
| Default element changed | Role, native semantics, keyboard behavior, and configuration test |
| State maps to Inspector styles | Focused state translation test when supported; otherwise typecheck and focused lint |
| Compound export changed | Extractor-resolution regression test |
| Provider or context behavior added | Behavioral test for owned state and cleanup |

## Composition proof

For a public `render` boundary, verify:

- default target behavior
- an approved Inspector render target
- generated and consumer handlers both run
- generated ARIA and state attributes survive
- the consumer ref points to the composed DOM element
- Base UI focus or anchor behavior still uses that element
- element-specific settings such as `nativeButton` are correct

## Contract proof

Public API metadata must match package source. Important inherited props can be redeclared with JSDoc so extraction records Inspector semantics without narrowing the inherited surface.

Use type tests for invalid Inspector combinations and omitted escape hatches. Do not add runtime tests for compile-only constraints unless runtime normalization also exists.

## Validation commands

- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds build`
- run the focused component test file
- run focused lint from `packages/design-system`
- run `pnpm --filter inspector.design-system gen:props`
- run `pnpm --filter inspector.design-system check:props`
- run `pnpm --filter inspector.design-system test`
- run `pnpm --filter inspector.design-system typecheck`
- run `pnpm --filter inspector.design-system build`

Classify full-package findings as changed-file failures or existing repository failures. Do not hide changed-file failures among unrelated diagnostics.
