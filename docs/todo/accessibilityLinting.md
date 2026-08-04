# Accessibility linting

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/08/26]

- [x] Enable Oxlint correctness rules for React, React performance, imports, and JSX accessibility across the active workspace.
- [x] Preserve the design-system StyleX JavaScript plugin through configuration inheritance.
- [x] Teach JSX accessibility rules about constrained `as` polymorphism and fixed-semantic design-system components.
- [x] Keep opinionated native-tag substitutions disabled and raw autofocus as a review warning.
- [x] Use `ButtonLink` rather than rendering anchors through `Button` in onboarding navigation.
- [x] Make React hook dependency contracts explicit where correctness linting can verify them.
- [x] Centralize Oxlint and Oxfmt policy in repository-root configuration files.

## Open product work

[03/08/26]

- [ ] Add rendered-DOM accessibility scans to design-system validation.
- [ ] Define keyboard and assistive-technology smoke tests for composite widgets.

## Work outside the foundation scope

[03/08/26]

- Replacing Base UI behavior with intrinsic elements for static lint visibility.
- Treating lint success as proof of WCAG conformance.
- Redesigning existing composite-widget interaction models.

## Settled interaction decisions

[03/08/26]

- Fixed-semantic form controls are mapped to their native element category.
- `Box` and `Text` semantics remain expressed through the constrained `as` prop.
- Base UI composition false positives receive narrow, auditable exceptions rather than semantic rewrites.
- Fixed-semantic mappings exclude `Button` because it is also used as an empty Base UI render target whose content is supplied by an owning trigger.
- Link mappings remain excluded because router composition supplies destinations inside `render` elements that JSX lint cannot associate with the outer component.
- Runtime role, accessible-name, keyboard, focus, and state assertions remain authoritative for composed output.

## Open design decisions

[03/08/26]

- Decide whether the row-editor alert dialog should retain declarative autofocus or move focus through an owned dialog interaction primitive.
- Decide whether `Checkbox.Label` should become a structural field composition that makes label association unrepresentable as an invalid state.

## Validation checklist

[03/08/26]

- [x] Design-system lint, tests, typecheck, and build pass; existing StyleX advisory warnings remain visible.
- [x] Design-system documentation lint, tests, typecheck, props check, and build pass.
- [ ] Inspector application full tests pass; an unrelated dock icon-size assertion remains failing.
- [x] Inspector application lint, targeted affected tests, typecheck, and build pass; the alert-dialog autofocus remains an explicit warning.
- [x] Repository-root lint and formatting configurations apply across each active workspace, and the design-system StyleX JavaScript plugin remains enabled.
