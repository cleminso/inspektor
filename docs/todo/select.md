# Select implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Validation checklist](#validation-checklist)

## Implemented foundation

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

- [x] Verify compact-width triggers use the fixed compact width in the Select documentation fixture.
- [x] Verify content-width triggers in the Select documentation fixture.
- [x] Run Select component tests and type validation.
