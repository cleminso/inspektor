# Button

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[31/07/26]

- [x] Preserve symmetric padding for text-only and two-sided buttons.
- [x] Support labelled and icon-only actions through one `Button` component.
- [x] Remove the `outline` variant from the shared button vocabulary.
- [x] Remove the large Button size and inset API.
- [x] Use `aria-pressed` to expose toggle state and apply the selected text color.
- [x] Use fixed 20px, 22px, and 24px heights for `xs`, `s`, and `m`.
- [x] Pair the 22px `s` icon-only hit area with 14px icons.
- [x] Reduce the global and Button radius vocabulary to `none`, `xs`, `s`, and `m`.
- [x] Consolidate focused Button states into the playground, including `iconOnly`.

[26/07/26]

- [x] Optically balance centered buttons with a prefix, suffix, or loading spinner on only one side.
- [x] Share optical alignment behavior between `Button` and `ButtonLink`.

## Open product work

[31/07/26]

- None.

## Work outside the foundation scope

[31/07/26]

- Select, tab, accordion, menu, and arbitrary-child control alignment remain separate component concerns.

## Settled interaction decisions

[31/07/26]

- Optical padding is automatic and is not exposed as a consumer styling prop.
- `iconOnly` makes Button and ButtonLink square and requires an accessible label.
- Icon-only actions do not accept labelled-button layout props.
- Button sizes use fixed heights so icon-only hit areas remain exact squares.

## Open design decisions

[31/07/26]

- None.

## Validation checklist

[31/07/26]

- [x] Run the design-system package and documentation tests.
- [x] Run design-system documentation type checking and build.
- [ ] Run package and web type checking and declaration builds.
- [x] Run package, documentation, and web lint.
- [x] Regenerate and validate component prop metadata.
- [x] Verify icon-only and pressed Button states in the documentation application.
- Type checking is blocked by unrelated unused imports in `keyboardInput.styles.ts` and `keyboardInputVars.stylex.ts`.
