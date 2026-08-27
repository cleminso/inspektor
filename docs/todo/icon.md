# Icon

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[27/08/26]

- [x] Replace the regex application icon tripwire with an Oxlint AST rule covering named, aliased, and namespace Lucide JSX.
- [x] Keep Lucide artwork values valid when they pass through constrained design-system component props.

[11/08/26]

- [x] Accept namespace-imported Lucide artwork when it passes through the constrained Icon boundary.
- [x] Express ref-bearing SVG artwork props with React's standard intrinsic helper.

[11/08/26]

- [x] Restrict public artwork to React 18-compatible ref-forwarding SVG components and document the remaining runtime artwork protocol.
- [x] Normalize 24-unit CopyButton outline artwork to the general 2-unit stroke category.
- [x] Treat direct Lucide JSX detection as a named-import regression tripwire with alias coverage.
- [x] Preserve compact 12px dock glyphs after rendered comparison.

[11/08/26]

- [x] Limit the application semantic glyph map to durable product nouns and keep local navigation affordances beside their consumers.
- [x] Test private artwork variants through their contract rather than locking literal SVG path data.

[11/08/26]

- [x] Replace unrestricted rendered artwork with an imported SVG component contract.
- [x] Forward Icon refs to the rendered SVG and keep decorative semantics package-owned.
- [x] Cover default sizing, every semantic size mapping, refs, invalid targets, and rejected presentation props.
- [x] Add package-private check, close, and chevron artwork primitives while keeping owner state and presentation local.
- [x] Remove CopyButton's duplicate icon-size mapping.
- [x] Add an application-owned semantic glyph map for recurring table, view, schema, relation, and navigation concepts.
- [x] Add static checks for raw application SVGs and directly rendered Lucide components.

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

[11/08/26]

- A universal SVG viewBox, stroke width, or fill treatment remains outside the Icon contract.
- Meaningful standalone images remain separate from decorative Icon artwork.

[31/07/26]

- Other icon dimensions, stroke geometry, and artwork normalization remain outside this migration.

## Settled interaction decisions

[11/08/26]

- `ForwardRefExoticComponent` enforces the React 18-compatible ref boundary; forwarding every SVG prop to one SVG root remains a trusted artwork protocol.
- General outlines use 2-unit strokes in a 24-unit viewBox, compact disclosures use 1.5 in 16, selection indicators use 2 in 16, and micro-navigation uses approximately 1.25 in 12.
- Icon does not force one raw stroke width because artwork viewBox scale and fill category determine optical weight.
- Dock Buttons retain the compact 12px glyph treatment inside their 20px control frames.
- The application policy check detects direct named, aliased, and namespace Lucide JSX rendering while allowing artwork passed to constrained components.

[11/08/26]

- Table, derived-view, schema, and relation artwork use product semantic names; pagination, row navigation, and menu disclosure artwork remain local.

[11/08/26]

- Icon accepts imported SVG components, not configured elements, render callbacks, or non-SVG targets.
- Artwork forwards SVG props and refs, preserves its viewBox, and uses `currentColor`.
- Artwork owns documented geometry and stroke or fill category; Icon owns size, inherited color, layout normalization, and decorative accessibility.
- Recurring product concepts use the application semantic glyph map; one-off artwork remains local.

[31/07/26]

- Button controls the interactive frame; Icon controls glyph presentation.
- Consumers select semantic icon sizes instead of numeric SVG dimensions.

## Open design decisions

[11/08/26]

- [x] Define optical stroke-weight categories across 12-, 16-, and 24-unit artwork instead of standardizing one raw SVG `strokeWidth` value.
- [x] Keep the compact 12px Button glyph treatment in the dock.

[31/07/26]

- None.

## Validation checklist

[11/08/26]

- [x] Type checking rejects plain function artwork and accepts ref-forwarding SVG artwork used by the package and Lucide.
- [x] Focused Icon, CopyButton, dock glyph, and direct Lucide rendering tests pass apart from the unrelated dock height assertion.
- [x] Package, documentation, and application typechecks and production builds pass.
- [x] Icon documentation renders the trusted artwork protocol and optical stroke categories.

[11/08/26]

- [x] Run focused Icon, glyph artwork, Button, package-owner, and application policy tests.
- [x] Run changed-file lint and package lint.
- [x] Regenerate and verify component prop metadata.
- [x] Run design-system package, documentation, and application typechecks and builds.
- [x] Verify Icon and Button documentation in the browser.

[31/07/26]

- [x] Run focused Icon and application dock tests.
- [x] Run package and application type checking.
- [x] Generate and verify component prop metadata.
- [x] Run design-system documentation validation.
- [x] Verify active UI workspaces contain no literal 14px or 16px icon size props.
