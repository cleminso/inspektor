# Keyboard Input

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[20/08/26]

- [x] Own shortcut typography and formatting inside Menu and Context Menu shortcut composition.

[20/08/26]

- [x] Allow inverse tooltip surfaces to provide Keyboard Input foreground through the established inherited color variable.

[20/08/26]

- [x] Compose Keyboard Input into command-item shortcut layout so shortcut presentation stays owned by Keyboard Input.

[20/08/26]

- [x] Include Backspace in documented hotkey options and cover its platform glyph formatting.

[20/08/26]

- [x] Accept canonical TanStack hotkeys as the display source instead of separate key and modifier props.
- [x] Format shortcuts automatically for macOS, Windows, and Linux with explicit platform overrides for previews.
- [x] Add default filled and outline visual variants.
- [x] Keep accessible labels textual when the visible shortcut uses platform symbols.

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

[20/08/26]

- [x] Shortcut display and registration share the same canonical TanStack hotkey string.
- [x] Automatic platform detection is the default; platform overrides are intended for controlled previews and tests.

[29/07/26]

- [x] Keyboard Input adapts to ancestor interaction state through inherited variables instead of menu-specific component props.
- [x] Highlighting a menu item highlights its keyboard shortcut glyph with the item text.

## Open design decisions

[29/07/26]

- [ ] Decide whether selected but unhighlighted menu items need a distinct keycap foreground.

## Validation checklist

[20/08/26]

- [x] Cover default Keyboard Input variants in Menu and Context Menu shortcut composition.

[20/08/26]

- [x] Cover inverse Tooltip context styling for nested Keyboard Input hints.

[20/08/26]

- [x] Cover default Keyboard Input presentation inside the application command palette.

[20/08/26]

- [x] Cover Backspace serialization and glyph formatting in focused tests.

[20/08/26]

- [x] Cover platform formatting, automatic detection, accessible labels, and visual variant selection in focused tests.
- [x] Verify default and outline variants in both color schemes in a browser.

[29/07/26]

- [x] Cover highlighted keyboard shortcuts in focused Menu tests.
- [ ] Verify normal, danger, disabled, and submenu shortcuts in a browser.
