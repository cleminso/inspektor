# Menu family implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[01/08/26]

- [x] Keep Menu and Context Menu on one action-menu style family.
- [x] Keep Combobox and Context Switcher on one combobox style family through composition.
- [x] Keep Select and Multi Select recipes local to their components.
- [x] Share popup collection padding, item inline padding, and compact row height through semantic tokens instead of a cross-component style recipe.
- [x] Keep nominal popup and collection padding at `2px` and item horizontal padding at `6px` through rem-backed tokens.
- [x] Use a rem-backed semantic `22px` nominal minimum height for compact menu items without fixing item height.
- [x] Use `13px` regular menu-item text with a `1.5` line height.
- [x] Keep simple menu items free of explicit vertical padding.
- [x] Allow rich Combobox items to expand from their text content.
- [x] Keep popup and item radii at a nominal `2px` through the radius token.
- [x] Make the Combobox viewport the only scrolling collection layer.
- [x] Align Context Switcher search and footer content through nominal `2px` section padding and nested `6px` control padding.
- [x] Keep structural Combobox separators flush so section and collection padding are not doubled at boundaries.
- [x] Keep dropdown and tooltip anchor gaps centralized as internal positioning defaults.
- [x] Expose semantic popup side and alignment choices without arbitrary offset or collision geometry.

## Open product work

[01/08/26]

- [ ] Add visual regression coverage when the design-system application has an image-baseline workflow.

## Work outside the foundation scope

[01/08/26]

- Popup color, border, and shadow redesign.
- Trigger sizing changes outside popup collections.
- Changes to Base UI keyboard, focus, or selection behavior.

## Settled interaction decisions

[01/08/26]

- [x] Compact menu items use `min-height` rather than fixed `height`.
- [x] Select item size variants alter minimum height without altering the shared horizontal inset.
- [x] Rich item descriptions increase intrinsic item height.
- [x] Context Menu reuses Menu geometry while preserving context-menu trigger behavior.
- [x] Context Switcher inherits Combobox geometry through component composition.
- [x] Combobox header, viewport, and footer each own their nominal `2px` inset; separators add no spacing.
- [x] Select and Multi Select conform to the popup geometry contract without inheriting Menu or Combobox recipes.
- [x] Multi Select preserves its checkbox and contextual-action focus model.
- [x] Preserve the Combobox-only `2px` inter-row gap as intentional separation for rich items.

## Open design decisions

[01/08/26]

- None.

## Validation checklist

[01/08/26]

- [x] Design-system package tests pass.
- [x] Design-system package typecheck passes.
- [x] Design-system package lint passes for changed files.
- [x] Design-system package build passes.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [x] Browser verification confirms popup padding, item geometry, typography, radius, rich-item expansion, footer alignment, and one scrolling viewport.
- [x] Browser verification confirms menu-family geometry scales with an enlarged root font while separators and borders remain one pixel.
