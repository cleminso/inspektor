# Button

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Composition audit](#composition-audit)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[27/08/26]

- [x] Preserve each Button variant's background, border, and foreground when disabled while reducing the whole control to 60% opacity.
- [x] Use one disabled visual rule for filled and bare variants.

[25/08/26]

- [x] Keep each Button variant's visual treatment while loading blocks interaction, including consumers that also pass `disabled`.

[24/08/26]

- [x] Center the loading spinner while visually hiding the normal content and preserving its intrinsic button width.

[15/08/26]

- [x] Keep expanded ghost Button text neutral by default so consumers opt into accent text only when the product meaning requires it.

[15/08/26]

- [x] Use accent text for expanded ghost Buttons so open triggers match Combobox and Context Switcher open-state text.

[11/08/26]

- [x] Clarify that CopyButton size controls its button frame while Button owns glyph sizing.

[11/08/26]

- [x] Keep full Menu trigger presentation on uncomposed triggers while composed controls retain their own border, surface, radius, and dimensions.
- [x] Give expanded Buttons a variant-aware persistent open treatment derived from `aria-expanded`.
- [x] Document `Button.Glyph` through generated compound metadata, a focused executable example, and a dedicated prop table.

[11/08/26]

- [x] Merge Base UI composition transport styles with Inspector-owned Button and ButtonLink presentation without exposing public styling props.
- [x] Preserve composed handlers, ARIA, state attributes, and refs on the shared DOM element.
- [x] Provide the Button glyph-size context once around each content structure.

[11/08/26]

- [x] Add `Button.Glyph` as the constrained composition for icon-only, prefix, and suffix artwork.
- [x] Make Button select the standard glyph size instead of requiring consumers to coordinate it manually.
- [x] Preserve compact dock artwork through the explicit `glyphSize="compact"` treatment.

[05/08/26]

- [x] Preserve token-constrained Button and Button Link radius selection for contexts with different corner treatments.
- [x] Replace `fullWidth` and flex-level `justify` choices with semantic `inline` and `row` layouts.
- [x] Remove the unsupported far-edge `between` content structure.

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

## Composition audit

[11/08/26]

- Base UI Menu Trigger supplies behavior, state attributes, ARIA, handlers, and refs to a composed control without transporting Menu's default visual treatment.
- Button recognizes composed `aria-expanded` state and owns its variant-aware persistent open presentation.

[11/08/26]

- Installed primitive: `@base-ui/react@1.6.0` Button.
- Sources: Base UI Button API, Composition handbook, `useRender`, `mergeProps`, and installed package source.
- `Button` remains a behavioral endpoint backed by Base UI Button and preserves its native button semantics, exact render contract, generated behavior, and composed ref target.
- `ButtonLink` remains a semantic anchor endpoint backed by `useRender`; links do not inherit Button behavior.
- `className` and `style` remain omitted from both public APIs as intentional Inspector constraints.
- Composition-injected `className` and `style` are transport props and merge internally according to Base UI precedence instead of being discarded or overwritten.
- `Button.Glyph` remains presentation composition and does not participate in the Base UI render boundary.

## Open product work

[11/08/26]

- [x] Add generated `button.glyph` metadata for the required `artwork` prop.
- [x] Add a focused executable `Button.Glyph` example and structured compound-component prop table.

[31/07/26]

- None.

## Work outside the foundation scope

[31/07/26]

- Select, tab, accordion, menu, and arbitrary-child control alignment remain separate component concerns.

## Settled interaction decisions

[27/08/26]

- Disabled Buttons retain their variant identity and use component opacity for reduced emphasis instead of replacing every variant with one neutral surface.

[25/08/26]

- Loading takes visual precedence over disabled because it represents an in-progress action, while retaining busy and blocked semantics.

[24/08/26]

- Loading keeps the normal content in layout and the accessibility tree while an overlaid spinner replaces it visually.

[11/08/26]

- A composed design-system control owns its visual treatment; Menu Trigger contributes behavior and semantic state instead of a second presentation layer.
- Expanded Button state follows the Button variant rather than inheriting Menu's default trigger surface.

[11/08/26]

- Public styling escape hatches remain unavailable while Base UI composition transport props survive internally.
- Composed handlers and refs resolve to the same underlying interactive element.

[11/08/26]

- Ordinary Button glyphs use the semantic `s` Icon size independently of Button frame size.
- Compact controls opt into the semantic `xs` glyph size on Button rather than overriding Icon children.
- Button composition remains compatible with empty Base UI render targets.

[05/08/26]

- Button and Button Link radius remains limited to the design-system radius scale.
- Labelled actions use one layout mode instead of independently combining width and justification.
- Icon-only actions use inline layout and cannot select labelled-action layout modes.

[31/07/26]

- Optical padding is automatic and is not exposed as a consumer styling prop.
- `iconOnly` makes Button and ButtonLink square and requires an accessible label.
- Icon-only actions do not accept labelled-button layout props.
- Button sizes use fixed heights so icon-only hit areas remain exact squares.

## Open design decisions

[31/07/26]

- None.

## Validation checklist

[27/08/26]

- [x] Verify every disabled Button variant in both color schemes and run focused tests, lint, typecheck, build, and package-wide tests.

[25/08/26]

- [x] Verify loading preserves the enabled variant classes when `disabled` is also present while retaining busy and activation-blocking semantics.

[24/08/26]

- [x] Verify loading content preserves the accessible label and intrinsic width while the spinner is centered independently.

[11/08/26]

- [x] Menu tests prove uncomposed triggers retain Menu presentation while composed Buttons retain Button presentation and expanded state.
- [x] Generated `button.glyph` metadata, focused documentation examples, and the Glyph prop table pass documentation tests and build.
- [x] Browser verification confirms composed Menu Buttons retain 24px Button geometry, omit Menu trigger classes, and expose variant-aware expanded presentation.
- [x] Package tests, typechecks, lint, and production builds pass with only existing warnings.

[11/08/26]

- [x] Button tests cover transported StyleX props, composed Menu behavior, handlers, ARIA state, and refs.
- [x] ButtonLink tests cover transported StyleX props and composed router-link refs.
- [x] Focused Button, ButtonLink, and private artwork tests pass.
- [x] Changed design-system files pass lint and package type checking.
- [x] The full design-system test suite and package build pass.
- [x] Application policy and affected feature tests pass except for the unrelated dock height assertion.
- [x] Application type checking and build pass.
- [x] Browser verification confirms a Button-composed Menu trigger opens with generated ARIA state and no console warnings or errors.

[11/08/26]

- [x] Button tests cover standard and compact glyph sizing and reject child size selection.
- [x] Dock and ordinary application controls preserve their accepted glyph treatments.
- [x] Button documentation and generated props describe constrained glyph composition.

[05/08/26]

- [x] Design-system Button and Button Link tests cover the semantic row layout and rejected width/alignment combinations.
- [x] Design-system package tests, typecheck, lint, and build pass.
- [x] Documentation tests, generated props check, typecheck, lint, and build pass.
- [x] Inspector application typecheck, lint, and build pass after consumer migration.
- [x] Browser verification confirms the Button playground and generated layout prop documentation render correctly.

[31/07/26]

- [x] Run the design-system package and documentation tests.
- [x] Run design-system documentation type checking and build.
- [ ] Run package and web type checking and declaration builds.
- [x] Run package, documentation, and web lint.
- [x] Regenerate and validate component prop metadata.
- [x] Verify icon-only and pressed Button states in the documentation application.
- Type checking is blocked by unrelated unused imports in `keyboardInput.styles.ts` and `keyboardInputVars.stylex.ts`.
