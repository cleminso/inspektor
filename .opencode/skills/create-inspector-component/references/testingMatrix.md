# Testing matrix

## Table of contents

- [Testing boundary](#testing-boundary)
- [Retention flow](#retention-flow)
- [Decision matrix](#decision-matrix)
- [Composition proof](#composition-proof)
- [Contract proof](#contract-proof)
- [Test maintenance](#test-maintenance)
- [Validation commands](#validation-commands)

## Testing boundary

Test Inspektor responsibilities, not Base UI's internal suite. Prove wrapper prop projection, transformations, composition, refs, event preservation, state-to-style mapping, documentation extraction, and package-owned behavior.

Add regression coverage whenever the wrapper changes Base UI composition, rendered elements, event handling, ref handling, generated attributes, controlled state, or mount behavior.

Base UI owns its state machines, keyboard navigation, focus management, dismissal, generated ARIA relationships, disabled and read-only behavior, and controlled or uncontrolled semantics. React and the browser own native attribute forwarding, element semantics, labels, constraint validation, and basic ref forwarding. Do not duplicate those contracts unless Inspektor transforms them or wrapper assembly could disconnect them.

## Retention flow

For every proposed or existing test, apply these rules in order. After a test qualifies for retention in rules 4 or 5, still apply the deduplication and consolidation rules:

1. Identify the Inspektor-owned runtime behavior, type contract, architectural invariant, or wrapper boundary the test protects.
2. If no such Inspektor contract exists, delete the test.
3. If the test only proves Base UI, React, browser, generic TypeScript inference, StyleX output, SVG geometry, or static-record mechanics, delete it.
4. If Inspektor only assembles upstream parts, keep one minimal semantic and accessibility smoke test that can detect disconnected wiring.
5. If Inspektor changes an upstream default, transforms a prop, composes handlers or refs, derives state, owns lifecycle behavior, constrains an API, or establishes an architectural policy, test that exact difference.
6. If a stronger test reaches the same production branch and checks the same failure mode, delete the weaker test.
7. If several inputs exercise one policy, use one table-driven test or one scenario that keeps the policy readable.

Before retaining a test, identify the responsible Inspektor source lines and state the regression it protects. A test name must describe that regression rather than an upstream primitive's generic behavior.

## Decision matrix

| Change                             | Required proof                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Broad Base UI prop inheritance     | Typecheck and public API metadata                                                                        |
| Base UI prop omitted               | Type-level rejection or extracted API assertion                                                          |
| Base UI prop redeclared            | Typecheck, JSDoc extraction, and default assertion where relevant                                        |
| Inspektor prop added               | Type contract plus focused behavior or style mapping test                                                |
| Prop transformed or derived        | Behavioral test for precedence and resulting Base UI behavior                                            |
| Semantic event exposed             | Handler receives complete Base UI event details                                                          |
| Ref boundary changed               | Default and composed ref target regression test                                                          |
| `render` exposed                   | Composition, handlers, attributes, semantics, and ref test                                               |
| Default element changed            | Role, native semantics, keyboard behavior, and configuration test                                        |
| State maps to Inspektor styles     | Focused state translation test when supported; otherwise typecheck and focused lint                      |
| Focus-indicator styling changes    | Focused lint plus a real-browser check of computed style, clipping, contrast, and forced-colors behavior |
| Compound export changed            | Extractor-resolution regression test                                                                     |
| Provider or context behavior added | Behavioral test for owned state and cleanup                                                              |

Inherited behavior such as clicking a checkbox label, pressing Escape to close a popup, restoring trigger focus, selecting an uncontrolled option, or suppressing a disabled primitive does not need a wrapper test. Keep coverage only when Inspektor adds logic around that behavior.

## Composition proof

For a public `render` boundary, verify:

- default target behavior
- an approved Inspektor render target
- generated and consumer handlers both run
- generated ARIA and state attributes survive
- the consumer ref points to the composed DOM element
- Base UI focus or anchor behavior still uses that element
- element-specific settings such as `nativeButton` are correct

## Contract proof

Public API metadata must match package source. Important inherited props can be redeclared with JSDoc so extraction records Inspektor semantics without narrowing the inherited surface.

Use type tests for invalid Inspektor combinations and omitted escape hatches. Do not add runtime tests for compile-only constraints unless runtime normalization also exists.

Do not test generic TypeScript inference, exhaustive typed lookup keys, direct ref forwarding, native DOM prop spreading, generated class names, SVG path data, or non-empty StyleX output. Typecheck, lint, and source ownership already cover those implementation details.

## Test maintenance

- Prefer observable semantic behavior over private `data-*` markers or generated classes. Assert a marker only when it is an intentional package contract.
- Prefer real package composition over mocks. Mock only deferred imports, external effects, or dependency boundaries that cannot be exercised deterministically.
- Never use unconditional teardown delays. Reset managers, timers, DOM state, and module state deterministically.
- Keep bundle-boundary tests when a static import must not initialize a deferred dependency.
- Keep accessibility tests for Inspektor's custom keyboard model, focus recovery, naming policy, state composition, and one wrapper-wiring boundary where Base UI-generated semantics could be disconnected. Delete broader accessibility matrices emitted unchanged by Base UI.
- Test Inspektor-owned roving focus, manual activation, and keyboard parity in Vitest. Verify the resulting indicator in a real browser rather than asserting generated StyleX classes.
- Keep regression tests for precedence between Inspektor states even when each individual state is covered elsewhere.
- During cleanup, run the focused file after each coherent change and the full package suite after all files are updated.

## Validation commands

- `pnpm --filter @inspektor/ds typecheck`
- `pnpm --filter @inspektor/ds build`
- run the focused component test file
- run focused lint from `packages/design-system`
- verify the component playground and its displayed source
- run `pnpm test:web:design`
- run `pnpm --filter inspektor.design-system typecheck`
- run `pnpm --filter inspektor.design-system build`

Classify full-package findings as changed-file failures or existing repository failures. Do not hide changed-file failures among unrelated diagnostics.
