# Select implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[28/08/26]

- [x] Let `Select.Trigger` join `InputGroup` as the editable member while preserving Base UI trigger semantics.
- [x] Project the input group's size, disabled, invalid, focus, and grouped-control presentation onto the trigger.

[07/08/26]

- [x] Map trigger sizes to the shared control-height scale.
- [x] Remove the unused fixed compact-width mode and component-owned global width tokens.
- [x] Let Base UI's anchor-width variable establish the popup minimum width.

[07/08/26]

- [x] Place the selected check indicator after the option label as a trailing indicator.
- [x] Replace the trigger triangle glyph with a chevron-down icon.
- [x] Keep compact triggers stable while placing the chevron directly after short selected values.
- [x] Document content, compact, and full trigger-width behavior.

[07/08/26]

- [x] Keep Base UI state styling while reducing the public Select anatomy to Root, Label, Trigger, Content, and Item.
- [x] Make Trigger own selected-value and chevron rendering.
- [x] Make Content own portal, positioning, popup, list, and scrollbar composition.
- [x] Make Item own selected indicator, text presentation, and standard row sizing.
- [x] Remove unused adornment, low-level composition, item-size, and deprecated width APIs.

[06/08/26]

- [x] Use the `xs` gap between the selected value and trigger indicator.
- [x] Reserve a leading option slot for the selected check indicator so every option label stays aligned.

[06/08/26]

- [x] Add a fixed `width="compact"` trigger option for short value sets that must not resize when the selected label changes.

[06/08/26]

- [x] Make `width="content"` triggers use their intrinsic content width instead of retaining the global Select minimum width.
- [x] Keep `width="full"` as the explicit container-filling option.

## Open product work

- None.

## Validation checklist

- [x] Verify Select input-group composition with focused component tests, lint, typecheck, and build.
- [x] Verify compact-width triggers use the fixed compact width in the Select documentation fixture.
- [x] Verify content-width triggers in the Select documentation fixture.
- [x] Run Select component tests and type validation.
