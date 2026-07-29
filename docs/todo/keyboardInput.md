# Keyboard Input

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/07/26]

- [x] Render platform-aware modifier glyphs and constrained default and small sizes.
- [x] Read keycap foreground and background colors from inherited StyleX variables.
- [x] Override the keycap foreground from highlighted normal and danger menu-item states.
- [x] Preserve the disabled foreground when a disabled menu item contains a keycap.

## Open product work

[29/07/26]

- [ ] Add documentation examples for Keyboard Input inside highlighted Menu and Context Menu items.

## Work outside the foundation scope

[29/07/26]

- [ ] Do not add component props for menu state or arbitrary keycap colors.

## Settled interaction decisions

[29/07/26]

- [x] Keyboard Input adapts to ancestor interaction state through inherited variables instead of menu-specific component props.
- [x] Highlighting a menu item highlights its keyboard shortcut glyph with the item text.

## Open design decisions

[29/07/26]

- [ ] Decide whether selected but unhighlighted menu items need a distinct keycap foreground.

## Validation checklist

[29/07/26]

- [x] Cover highlighted keyboard shortcuts in focused Menu tests.
- [ ] Verify normal, danger, disabled, and submenu shortcuts in a browser.
