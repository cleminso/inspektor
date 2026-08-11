# Spatial tokens implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[11/08/26]

- [x] Define one `xs`, `s`, `m`, and `l` control-height scale shared by interoperable controls.
- [x] Separate collection-row heights from control heights.
- [x] Remove button-owned height tokens from the shared semantic namespace.
- [x] Remove Select-owned width tokens from the shared semantic namespace.
- [x] Preserve established default control geometry by mapping defaults to the matching shared size tier.

## Open product work

[11/08/26]

- [ ] Audit application layout containers that consume control or popup dimensions for unrelated geometry.
- [ ] Replace repeated panel-bar and bordered-surface recipes with composed design-system components.

## Work outside the foundation scope

[11/08/26]

- Component radius roles, typography roles, and motion tokens remain separate follow-up concerns.

## Settled interaction decisions

[11/08/26]

- Equal control size labels represent equal outer heights across interoperable controls.
- Collection density uses an independent semantic scale.
- Shared semantic tokens describe roles rather than component names.
- Component-specific dimensions remain private to their owning component.

## Open design decisions

- None.

## Validation checklist

- [x] Run token and affected component tests.
- [x] Run changed-file StyleX lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify control heights and Select width behavior in the browser.
