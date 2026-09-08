# Design-system semantics refinement

## Table of contents

- [Objective](#objective)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Code style](#code-style)
- [Testing strategy](#testing-strategy)
- [Boundaries](#boundaries)
- [Implementation batches](#implementation-batches)
- [Success criteria](#success-criteria)
- [Approved decisions](#approved-decisions)
- [Open decisions](#open-decisions)

## Objective

Apply the Inspektor semantic token model consistently across remaining active `@inspektor/ds` components.

The work covers field controls, selection and action controls, feedback and overlay components, layout controls, and constrained public styling APIs.

Success means components express interaction and validation through semantic tokens, handle supported Base UI states consistently, prevent consumer styling bypasses, have executable documentation, and retain behavioral test coverage.

## Commands

- `pnpm --filter @inspektor/ds test`
- `pnpm --filter @inspektor/ds typecheck`
- `pnpm --filter @inspektor/ds build`
- `pnpm --filter inspektor.design-system test`
- `pnpm --filter inspektor.design-system typecheck`
- `pnpm --filter inspektor.design-system lint`
- `pnpm --filter inspektor.design-system build`
- `pnpm --filter inspektor typecheck`
- `pnpm --filter inspektor lint`

## Project structure

- `packages/design-system/src/components/` owns reusable component behavior and StyleX styles.
- `packages/design-system/src/tokens/` owns semantic, value, and layer tokens.
- `packages/design-system/src/primitives/` owns constrained shared component helpers.
- `apps/design-system/` owns executable component playground documentation.
- `apps/web/` consumes public `@inspektor/ds` APIs and owns product composition.

## Code style

Use semantic tokens and explicit state precedence. Public component props must not expose arbitrary styling.

```packages/design-system/src/components/checkbox/checkbox.styles.ts#L1-1
selected: {
  backgroundColor: backgroundColors['bg-selected'],
  color: textColors['text-default'],
},
```

## Testing strategy

- Add a failing component test before behavior changes.
- Test Inspektor-owned behavior and accessibility outcomes, not Base UI implementation details.
- Cover field state combinations: default, hover, focus-visible, invalid, invalid-focus, read-only, and disabled.
- Cover selection state combinations: unchecked, checked, selected, pressed, checked-disabled, and selected-disabled.
- Keep component playgrounds and displayed source synchronized after public API changes.

## Boundaries

- Always: use semantic tokens, preserve Base UI behavior, omit public `className` and `style`, and keep approved escape hatches explicit and auditable.
- Ask first: add semantic tokens, change public APIs, remove public styling escape hatches, or migrate application consumers.
- Never: expose arbitrary CSS values from `@inspektor/ds` or hand-edit generated route trees.

## Implementation batches

### Batch 1: field controls

- `Input`
- `InputGroup`
- `Field`
- `TextField`
- `Search`
- `Fieldset`

Normalize focus, invalid, disabled, read-only, and compound-action semantics.

### Batch 2: actions and selection

- `Button`
- `Checkbox`
- `Switch`
- `ToggleGroup`
- `CopyButton`
- `KeyboardInput`

Normalize hover, pressed, selected, loading, checked-disabled, and selected-disabled semantics.

### Batch 3: feedback and layout interaction

- `Toaster`
- `Tooltip`
- `Spinner`
- `ResizablePanel`

Map notification variants to semantic roles and normalize overlay, handle, focus, active, disabled, and motion states.

### Batch 4: foundation hardening

- `Box`
- `Text` and `createText`
- semantic token coverage
- layer token model
- spatial token model

Replace public arbitrary styling contracts with constrained APIs and migrate active consumers.

## Success criteria

- Every refined component uses semantic colors for rest, hover, pressed, selected, focus, invalid, and disabled states where applicable.
- Disabled styles suppress hover and pressed effects.
- Field invalid focus is visually and semantically distinct from neutral focus.
- Toast intent variants use Inspektor semantic tokens rather than dependency defaults.
- Resizable handles have consistent focus-visible, active, and disabled treatment.
- No active public component exposes `className`, native `style`, or arbitrary CSS values without an explicitly approved narrow exception.
- Generated component props, docs examples, tests, package typechecks, lints, and builds pass.

## Approved decisions

1. Remove public arbitrary `className` and `style` from `Box` and `Text`, then migrate active consumers to constrained APIs. `Box.unsafeClassName` is the approved class-only integration exception; native `style` remains unavailable.
2. Add notification roles for warning, error, info, loading, foreground, and border colors. Align Toaster APIs and variants with Geist Toast patterns.
3. Keep `bg-selected` visually equal to `bg-hover` when an indicator communicates persistence.
4. Add content, navigation, popup, tooltip, overlay, modal, toast, and drag layer roles.
5. Add semantic spatial roles for control heights, icon sizes, focus-ring width, popup widths, content widths, grid tracks, example heights, viewport heights, and panel-handle size.
6. Notification backgrounds use light/dark 100/900 palette pairs, notification foregrounds use 700/300 pairs, and notification borders use 600/400 pairs. Loading uses the neutral surface, foreground, and border equivalents.
7. Layer indexes are content `1`, navigation `10`, popup `100`, tooltip `200`, overlay `300`, modal `400`, toast `500`, and drag `600`.
8. Spatial roles resolve to constrained control, icon, popup, grid, content, example, tooltip, and panel dimensions.
