# Tooltip implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[20/08/26]

- [x] Provide the inverse semantic foreground to nested Keyboard Input hints through their inherited context variable.

[06/08/26]

- [x] Remove tooltip exit motion so adjacent replacements cannot overlap while the next label opens.

[06/08/26]

- [x] Use authored Tooltip composition instead of native browser titles across design-system and Inspektor React controls.

[06/08/26]

- [x] Skip entrance motion when a tooltip opens during its provider's instant-open phase.

[06/08/26]

- [x] Keep tooltip entrance scaling near its resting size so frequent pointer labels do not appear to jump.

[06/08/26]

- [x] Keep visual-label tooltips non-hoverable so pointer movement through trigger gaps closes the previous tooltip.
- [x] Declare the Base UI trigger delay defaults in the wrapper and generated API metadata.
- [x] Preserve an undefined trigger `disabled` value so Root-derived disabled state continues to apply.
- [x] Retain named StyleX rules for every Base UI Tooltip callback state and data attribute.

[05/08/26]

- [x] Present tooltip content without an arrow indicator.

[05/08/26]

- [x] Keep Tooltip-owned trigger presentation on the default trigger.
- [x] Preserve a composed trigger's state-driven presentation while the tooltip opens.
- [x] Preserve Base UI tooltip behavior and state attributes on composed triggers.

## Open product work

[05/08/26]

- None.

## Work outside the foundation scope

[05/08/26]

- Tooltip content design and positioning changes.

## Settled interaction decisions

[20/08/26]

- [x] Inverse tooltip surfaces own the semantic foreground of nested shortcut hints.

[06/08/26]

- [x] Keep subtle motion for the initial entrance only; exits and adjacent replacements are immediate.

[06/08/26]

- [x] Animate the initial pointer tooltip subtly, then replace adjacent tooltips without entrance motion.

[06/08/26]

- [x] Use a subtle anchored scale and opacity transition instead of scaling tooltips from half size.

[06/08/26]

- [x] Tooltip popups do not extend their trigger's hover area because tooltip content is supplementary and non-interactive.

[05/08/26]

- [x] Keep the tooltip as an unpointed floating label instead of visually connecting it with an arrow.

[05/08/26]

- [x] A composed trigger owns its presentation; Tooltip contributes behavior and state attributes.

## Open design decisions

[05/08/26]

- None.

## Validation checklist

[02/09/26]

- [ ] The documentation test command retains the unrelated Tooltip provider-delay metadata mismatch.

[20/08/26]

- [x] Cover inverse shortcut context composition in focused Tooltip tests.

[06/08/26]

- [x] Align the extractor assertion with Tooltip Trigger's 500ms runtime delay default.

[06/08/26]

- [x] Browser verification confirms adjacent replacement renders one popup without starting or ending transition state.

[06/08/26]

- [x] Confirm active workspace source contains no native browser tooltip attributes on Inspektor-owned controls.

[06/08/26]

- [x] Cover the non-hoverable popup default and its inert positioner contract.
- [x] Tooltip and design-system package tests pass.
- [x] Design-system package typecheck, focused lint, and build pass.
- [x] Documentation tests, generated-prop check, typecheck, lint, and build pass.

[05/08/26]

- [x] Cover the absence of tooltip arrow markup.

[05/08/26]

- [x] Tooltip, Tab View, and Field tests pass.
- [x] Browser verification confirms Tab View classes and geometry remain stable while its tooltip is open.
