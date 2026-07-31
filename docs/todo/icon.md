# Icon

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[31/07/26]

- [x] Compose design-system presentation onto consumer-supplied SVG artwork.
- [x] Support semantic `xs`, `s`, and `m` icon sizes.
- [x] Keep decorative icon semantics inside the component.
- [x] Use the `xs` icon size in the compact application dock.
- [x] Replace literal 14px and 16px icon sizes in active UI workspaces with semantic `s` icons.

## Open product work

[31/07/26]

- None.

## Work outside the foundation scope

[31/07/26]

- Other icon dimensions, stroke geometry, and artwork normalization remain outside this migration.

## Settled interaction decisions

[31/07/26]

- Button controls the interactive frame; Icon controls glyph presentation.
- Consumers select semantic icon sizes instead of numeric SVG dimensions.

## Open design decisions

[31/07/26]

- None.

## Validation checklist

[31/07/26]

- [x] Run focused Icon and application dock tests.
- [x] Run package and application type checking.
- [x] Generate and verify component prop metadata.
- [x] Run design-system documentation validation.
- [x] Verify active UI workspaces contain no literal 14px or 16px icon size props.
