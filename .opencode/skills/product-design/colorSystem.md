# Inspektor color system

## Table of contents

- [Purpose](#purpose)
- [Canonical sources](#canonical-sources)
- [Three-layer model](#three-layer-model)
- [Interface color families](#interface-color-families)
- [Interaction state model](#interaction-state-model)
- [Ownership rules](#ownership-rules)
- [Naming rules](#naming-rules)
- [Accessibility requirements](#accessibility-requirements)
- [Implementation workflow](#implementation-workflow)
- [Validation](#validation)
- [Open questions](#open-questions)

## Purpose

Use this reference when selecting, naming, adding, reviewing, or migrating Inspektor color tokens. The goal is to encode product meaning rather than expose palette choices or component implementation details.

Shipped code is evidence, not automatic precedent. Confirm that an existing token still expresses the accepted role before reusing it.

## Canonical sources

- `packages/design-system/src/tokens/value.stylex.ts` owns palette values.
- `packages/design-system/src/tokens/semantics.stylex.ts` owns interface semantic roles.
- `packages/design-system/src/components/{componentName}/*Colors.stylex.ts` owns private component color roles.
- `apps/design-system/src/components/content/foundations/color.tsx` documents the rendered system.
- `docs/todo/colorTokens.md` tracks implementation work and unresolved decisions.

Do not duplicate source values in this reference. This file owns the decision model and vocabulary; code owns the active values.

## Three-layer model

### Palette values

Palette values answer: **which colors are available?**

- They are raw scales such as gray, neutral, blue, red, orange, yellow, and green.
- They may include opaque and alpha variants.
- Product code and ordinary component styles must not consume them directly.
- Interface and component semantic token-definition files may map roles to palette values.
- Palette values do not encode interaction, hierarchy, status, or component meaning.

### Interface semantic roles

Interface roles answer: **what shared visual responsibility does this color have?**

- They map light and dark schemes to palette values.
- They are reusable across components and product surfaces.
- They are the broad product color contract consumed through `@inspektor/ds/theme` and constrained primitives such as `Box`.
- Their names describe stable visual or interaction roles, not component locations.

`@inspektor/ds/theme` also re-exports palette values for design-system documentation and tooling. Treat that as a technical export, not permission for product code to bypass semantic roles. A separate primitive-token entry point remains a possible enforcement improvement.

### Linked component semantic roles

Component roles answer: **how does this component express its own state model?**

- Keep them beside the component that owns the meaning.
- Link them to interface roles by default.
- Use a private value only when the component has a distinct visual contract.
- Do not expose them broadly unless independent component theming becomes a supported product contract.

Place these roles in `{component}Colors.stylex.ts`. Use `{component}Vars.stylex.ts` instead for contextual channels that communicate ancestor or state values, even when the channel carries a color. See the [StyleX module boundary](../create-inspector-component/references/stylexIntegration.md#variable-module-boundaries) for the component file structure.

## Interface color families

### Surface

- `background`: default content background.
- `canvas`: application underlay behind panels and product surfaces.
- `default`: standard control, card, or panel surface.
- `raised`: floating content such as menus and popovers.
- `subtle`: low-emphasis region within a surface.
- `overlay`: translucent surface placed above content; retain only while it has a distinct consumer from `backdrop`.
- `backdrop`: translucent layer behind modal or overlay content that dims and de-emphasizes the underlying interface.
- `inverse`: surface requiring an inverse foreground pair.

`canvas` describes layer position in the application composition. It does not mean a generic gray background. `backdrop` describes the layer behind overlay content; do not use it for the overlay content itself.

### Element

Use `elementColors` for filled neutral controls and `ghostElementColors` for controls with no resting fill. Both may define `default`, `hover`, `pressed`, `selected`, and `disabled` roles.

Use `accentElementColors` and `dangerElementColors` for intent-bearing controls. Each family owns its state progression so accent and danger interactions do not borrow neutral state colors accidentally.

### Text

- `default`, `secondary`, and `muted` express hierarchy.
- `placeholder` describes provisional input content, not generic low-emphasis text.
- `disabled` communicates unavailable content or action.
- `accent` and `link` express interaction emphasis.
- `success`, `warning`, and `danger` express status.
- `onAccent` and `onInverse` are contrast pairs for colored surfaces.

Do not select text tokens only by perceived lightness. Select the role that matches the content's meaning.

### Border, focus, and selection

- Border roles express boundary strength, status, focus, selection, and disabled treatment.
- Focus roles express focus rings independently from backgrounds.
- Selection roles express accent-backed selection across component boundaries.

## Interaction state model

- **Hover** is pointer presence.
- **Pressed** is transient activation.
- **Selected** is persistent application state.
- **Focused** identifies the input destination and may coexist with hover, pressed, selected, or invalid state.
- **Disabled** removes interaction and may alter text, border, background, opacity, or a component-owned combination.

Focus is an orthogonal border or ring affordance. Do not add a generic focused background to complete a symmetric state set.

Avoid `active` in color-role names. In implementation APIs it can mean pressed, open, current, selected, dragging, or keyboard-targeted. Name the actual state: `pressed`, `selected`, `current`, `emphasized`, `editing`, `dragged`, or `focused`.

State combinations belong in component styles. Do not create combined global tokens such as selected-focused or hover-invalid.

## Ownership rules

Add an interface role only when the meaning recurs across components or themes must tune it independently.

Keep a role component-private when:

- only one component understands its meaning;
- changing it should not affect unrelated components;
- the role composes multiple interface states;
- its vocabulary is domain-specific, such as a DataGrid current cell or emphasized column.

Equal values do not imply equal semantics. Distinct roles may share a palette value when they must remain independently tunable. Conversely, different names do not justify separate roles when they have no independent meaning.

Applications consume interface roles through constrained design-system APIs. They must not import component-private colors or palette values.

## Naming rules

- Name interface tokens by visual responsibility.
- Name component tokens by component behavior.
- Prefer `canvas` for an application underlay and `backdrop` for the dimming layer behind overlay content.
- Prefer property-specific focus names such as `focused` border or `ring` over `focusedBackground`.
- Use `on{Surface}` for foregrounds whose contrast depends on a paired surface.
- Avoid component names in interface families.
- Avoid ordinal names such as background 1 or background 2.
- Avoid `primary` and `secondary` where they could mean either hierarchy or action intent; use `accent` for action intent.

## Accessibility requirements

- Verify text and icon contrast against every surface on which the role is allowed.
- Verify `onAccent` and `onInverse` as paired foreground and background decisions.
- Do not rely on color alone for error, warning, success, selection, or focus.
- Preserve a visible keyboard focus indicator when hover and selection styles are also present.
- Verify disabled content remains understandable without appearing interactive.
- Test both supported color schemes in the rendered interface.

## Implementation workflow

1. State the user-facing or component state that requires a color decision.
2. Check whether an existing interface role expresses that meaning.
3. If the meaning belongs to one component, add or update its private linked color role.
4. Add a new interface role only when the ownership rules justify it.
5. Write or update a token contract test before migrating consumers.
6. Migrate constrained public aliases, component styles, applications, documentation, and generated metadata together.
7. Record unresolved questions in `docs/todo/colorTokens.md` rather than hiding them in token names.
8. Verify the rendered states in every supported color scheme.

## Validation

- Run focused token and component contract tests.
- Run changed-file StyleX lint immediately after style edits.
- Run design-system tests, typecheck, and build.
- Run affected application and documentation typechecks and builds.
- Regenerate prop metadata when public constrained token unions change.
- Inspect representative default, hover, pressed, selected, focused, invalid, and disabled states in the browser.
- Confirm legacy or component-specific names do not remain in interface semantics.

## Open questions

- Whether `text.secondary` and `text.muted` remain perceptually and semantically distinct.
- Whether icons require a separate interface family or continue to inherit text roles.
- Whether `surface.overlay` has a distinct product role from `surface.backdrop`.
- Whether component colors become a public theming contract.
- Whether primitive palette exports move behind a documentation or tooling entry point.

Keep unresolved decisions in `docs/todo/colorTokens.md`. Update this reference only after a decision is accepted.
