# Shell Layout implementation checklist

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist records the reusable application-shell geometry, dock controls, and universal Inspector layout preference.

## Implemented foundation

[01/09/26]

- [x] Align application shell chrome under sibling `header/` and `footer/` owners.

[01/09/26]

- [x] Move shell layout ownership out of Tables and remove cross-feature layout imports.
- [x] Compose header, resizable workspace body, and footer through `ShellLayout`.
- [x] Support optional resizable left and right docks around one flexible view.
- [x] Keep dock collapse and restore mechanics inside the design-system component.
- [x] Keep universal preference storage, failure handling, and migration inside Inspector.
- [x] Migrate the table-specific left-dock layout and expanded size to semantic shell storage keys.
- [x] Preserve the existing 200px initial dock size and 160px to 360px resize range without fixing the Paper example width.
- [x] Document the public compound API with an executable two-dock example.

## Open product work

[01/09/26]

- [ ] Add right-dock product content and controls only with an accepted Inspector use case.

## Work outside the foundation scope

[01/09/26]

- Connection-specific or workspace-specific shell geometry.
- Right-dock routing, hotkeys, product labels, and empty states.

## Settled interaction decisions

[01/09/26]

- Dock geometry is one universal Inspector preference.
- An absent dock renders neither a panel nor a resize handle.
- The view remains the flexible panel between optional physical left and right docks.
- Product landmarks remain consumer-owned; structural shell parts do not force `header`, `main`, `aside`, or `footer` semantics.

## Open design decisions

[01/09/26]

- None.

## Validation checklist

[01/09/26]

- [x] Shell Layout focused tests pass.
- [x] Inspector shell storage, layout, dock, and Tables tests pass.
- [x] Design-system and Inspector lint and typecheck pass.
- [x] Shell Layout documentation metadata, extractor coverage, typecheck, lint, and build pass.
- [x] Inspector browser verification confirms dock resizing, collapsing, route switching, and preference restoration.

The package-wide documentation test retains an unrelated Tooltip provider default metadata mismatch.
