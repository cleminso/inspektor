# Badge

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/08/26]

- [x] Use a neutral semantic surface so the non-interactive badge does not resemble an action.

[29/08/26]

- [x] Add a text-only `Badge` with a soft blue light-theme treatment and a soft yellow dark-theme treatment.
- [x] Export and document the component through the public design-system API.

## Open product work

[29/08/26]

- None.

## Work outside the foundation scope

[29/08/26]

- Icons, links, actions, sizes, and additional visual variants remain outside the text badge contract.

## Settled interaction decisions

[29/08/26]

- The soft blue and yellow treatment supersedes the neutral treatment below.

[29/08/26]

- Badge uses the neutral semantic treatment. This supersedes the initial blue and yellow treatment above.

[29/08/26]

- Badge is non-interactive and accepts text content only.
- Add variants only when a second accepted semantic treatment exists.

## Open design decisions

[29/08/26]

- None.

## Validation checklist

[29/08/26]

- [x] Run focused StyleX lint, design-system validation, documentation validation, and browser checks in both color schemes.
