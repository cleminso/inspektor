# Checkbox

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[25/07/26]

- `Checkbox` wraps `BaseCheckbox.Root` with `size` (`s` 14px, `m` 16px), `indeterminate`, `disabled`, `readOnly`, `required`, `nativeButton`, `render`, and `inputRef`; state styling via `createStateStyleProps`.
- Naming: documented primary pattern is `Checkbox.Label` wrapping the control, so Base UI auto-wires `aria-labelledby` to the visible text and the whole label row toggles the control (same rendered contract as the invisibledetails.com reference demo).
- Cursor signaling: `pointer` on root, `not-allowed` when disabled, `default` when readOnly.
- Focus visibility: `:focus-visible` switches border to `border-focused` and adds an outline ring with `focus-ring-width` token and 2px offset.
- Keyboard semantics tested: Tab focus, Enter does not toggle, disabled checked state cannot change (`checkbox.test.tsx`).
- `indeterminate` swaps the icon path to a dash.
- Unchecked, interactive checkboxes strengthen their border to `border-focused` on direct hover. Selected, invalid, disabled, and read-only states retain their state-specific border.
- A centered pseudo-element expands the checkbox pointer target to the semantic 28px medium-control dimension without changing layout or visual size. This covers the complete 6px gap between the visual checkbox and its label text.
- `Checkbox.Label` sets an inherited interaction variable on hover, so nested unchecked checkboxes receive the same `border-focused` feedback when either the box or visible label text is hovered.
- `Checkbox.Label` owns native label activation, hover propagation, pointer cursor, non-selectable label text, and content/row layouts. Generic `Box` and `Field.Label` no longer carry checkbox-specific interaction styles.
- Standalone usage with `aria-label` only is applied where no visible text exists (table row-selection checkboxes in `buildDataGridColumns.tsx`).
- `tableListPane.tsx` composes `Checkbox.Label layout="row"` around `Checkbox` + `Text`, giving full-row toggle and label-derived naming.

## Open product work

[25/07/26]

- [x] Add `:hover` border feedback to the unchecked checkbox root using `border-focused`.
- [x] Propagate hover from `Checkbox.Label` to nested checkbox borders through `interactiveControlVars`.
- [ ] Fix the NULL checkbox in `apps/web/src/components/table-explorer/data/rowEditorFields.tsx`: it combines a wrapping `<label>` with an overriding `aria-label` (duplicated name strings that can drift, visible text "NULL" only at the end of the accessible name) and uses a raw Tailwind `className` label, which violates application composition rules.

## Work outside the foundation scope

[25/07/26]

- The Data Grid's complete-cell selection hit area remains table-specific event delegation. Checkbox target expansion is component-local CSS geometry and does not replace that behavior.

## Settled interaction decisions

[25/07/26]

- The visible text is the accessible name. Use `Checkbox.Label`; reserve `aria-label` for controls without visible text.
- Enter does not toggle the checkbox; Space toggles (native checkbox contract, preserved through `nativeButton`).
- Disabled state blocks `onCheckedChange` and keeps the visual checked state intact.

## Open design decisions

[25/07/26]

- Raw native labels outside design-system composition do not provide the inherited hover variable. Use `Checkbox.Label` for visible checkbox labels.

## Validation checklist

[25/07/26]

- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds lint`
- `pnpm --filter @inspector/ds build`
- `pnpm --filter inspector.design-system test`
- `pnpm --filter inspector.design-system check:props`
- Hover the checkbox box and the label text in the docs app: border feedback appears in both cases.
- Click the label text and gap of a `Checkbox.Label`-wrapped checkbox: the checkbox toggles.
- Screen reader announces the visible label text as the checkbox name.
