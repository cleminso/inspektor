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
- Naming: documented primary pattern is `Field.Label` (`nativeLabel` default) wrapping the control, so Base UI auto-wires `aria-labelledby` to the visible text and the whole label row toggles the control (same rendered contract as the invisibledetails.com reference demo).
- Cursor signaling: `pointer` on root, `not-allowed` when disabled, `default` when readOnly.
- Focus visibility: `:focus-visible` switches border to `border-focused` and adds an outline ring with `focus-ring-width` token and 2px offset.
- Keyboard semantics tested: Tab focus, Enter does not toggle, disabled checked state cannot change (`checkbox.test.tsx`).
- `indeterminate` swaps the icon path to a dash.
- Standalone usage with `aria-label` only is applied where no visible text exists (table row-selection checkboxes in `buildDataTableColumns.tsx`).
- `tableListPane.tsx` composes `Box as="label"` around `Checkbox` + `Text`, giving full-row toggle and label-derived naming.

## Open product work

[25/07/26]

- [ ] Add `:hover` border feedback to the unchecked checkbox root. Checkbox is the only form control without hover feedback; precedent exists in `input.styles.ts` (`subtle` variant progresses border on `:hover`).
- [ ] Propagate hover from the wrapping `Field.Label` to the checkbox border (group-hover equivalent). StyleX has no descendant group-hover; use a CSS variable bridge following the `inputGroupVars` precedent in `field.styles.ts`.
- [ ] Fix the NULL checkbox in `apps/web/src/components/table-explorer/data/rowEditorFields.tsx`: it combines a wrapping `<label>` with an overriding `aria-label` (duplicated name strings that can drift, visible text "NULL" only at the end of the accessible name) and uses a raw Tailwind `className` label, which violates application composition rules.

## Work outside the foundation scope

[25/07/26]

- Invisible hit-area expansion for standalone checkboxes (pseudo-element extending the 14/16px target). Not implemented; label-wrapped rows already provide an enlarged target.

## Settled interaction decisions

[25/07/26]

- The visible text is the accessible name. Use a wrapping native label (`Field.Label` or `Box as="label"`); reserve `aria-label` for controls without visible text.
- Enter does not toggle the checkbox; Space toggles (native checkbox contract, preserved through `nativeButton`).
- Disabled state blocks `onCheckedChange` and keeps the visual checked state intact.

## Open design decisions

[25/07/26]

- Hover border token for unchecked checkbox: reuse `border-focused` (collapses hover and focus into one color) or add a dedicated semantic token between `border` and `border-focused`.
- Whether standalone checkboxes (table row selection, 14/16px) need an invisible expanded hit area to approach the 24px target-size guidance, or whether row-level click behavior is sufficient.

## Validation checklist

[25/07/26]

- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds lint`
- `pnpm --filter @inspector/ds build`
- `pnpm --filter inspector.design-system test`
- `pnpm --filter inspector.design-system check:props`
- Hover the checkbox box and the label text in the docs app: border feedback appears in both cases.
- Click the label text of a `Field.Label`-wrapped checkbox: the checkbox toggles.
- Screen reader announces the visible label text as the checkbox name.
