# Color tokens

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [11/08/26] Layered semantic architecture

- [x] Separate primitive palette values from interface semantic colors.
- [x] Group interface colors into surface, element, ghost element, accent element, danger element, text, border, focus, and selection roles.
- [x] Remove component names for tables, tabs, and inputs from the global semantic namespace.
- [x] Add private linked color tokens for DataGrid and WorkspaceTabs.
- [x] Replace the overloaded `active` color vocabulary with selected, emphasized, current, dragged, hover, pressed, or focused component roles.
- [x] Migrate Box to constrained family-prefixed background roles and direct text and border roles.
- [x] Document primitive scales, interface semantics, and component-token ownership in the color foundation.

## Open product work

### [11/08/26] Theme editing

- [ ] Decide whether Inspector should expose component tokens for product-level theme customization.
- [ ] Add linked-token controls if the color foundation becomes an interactive theme editor.
- [ ] Add automated contrast reporting for text and on-color foreground pairs.

## Work outside the foundation scope

### [11/08/26] Syntax and external themes

- User-created themes and persisted theme overrides are not part of the color-token foundation.
- Syntax colors remain an independent semantic family because editor grammars own their roles.
- Component tokens remain private unless consumers need independent tuning.

## Settled interaction decisions

### [11/08/26] State ownership

- Hover, pressed, selected, and disabled treatments belong to element families when they are reusable across components.
- Focus is an orthogonal ring or border affordance, not a generic focused background.
- State combinations remain in component styles instead of producing combined semantic tokens.
- Component roles link to interface semantics by default and use private values only when their visual contract differs.

## Open design decisions

### [11/08/26] Text hierarchy

- [ ] Confirm whether `text.secondary` and `text.muted` remain perceptually and semantically distinct across product content.
- [ ] Decide whether icon colors need a distinct interface family or should continue to inherit text roles.

## Validation checklist

### [11/08/26] Foundation validation

- [x] Token contract tests cover interface families and exclude component-specific keys.
- [x] DataGrid and WorkspaceTabs tests cover their private component color contracts.
- [x] Changed-file StyleX and TypeScript lint pass.
- [x] Design-system tests and typecheck pass.
- [x] Product and documentation typechecks and builds pass.
- [x] Color foundation and representative product controls are verified in both color schemes.
