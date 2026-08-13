# Color token layers exemplar

## Table of contents

- [Decision](#decision)
- [Product problem](#product-problem)
- [Rejected model](#rejected-model)
- [Accepted model](#accepted-model)
- [Inspector implementation](#inspector-implementation)
- [Why focus remains orthogonal](#why-focus-remains-orthogonal)
- [Public and private boundaries](#public-and-private-boundaries)
- [How to repeat the pattern](#how-to-repeat-the-pattern)
- [Counterexamples](#counterexamples)
- [Evidence](#evidence)

## Decision

Inspector colors use three layers:

1. Palette values.
2. Interface semantic roles.
3. Linked component semantic roles.

Expose interface semantics broadly. Keep component semantics beside their owner unless independent component theming becomes a supported product contract.

## Product problem

The previous flat semantic namespace mixed unrelated dimensions:

- location, such as page and popover;
- component names, such as table and tab;
- interaction states, such as hover and selected;
- intent, such as primary and danger;
- visual treatment, such as subtle and inverse.

This made token reuse appear easier while obscuring why a value was correct. Equal values encouraged accidental coupling, and overloaded terms such as `active` represented pressed controls, open popups, selected rows, current cells, emphasized columns, and drag state.

## Rejected model

Do not maintain a single global background family containing component-specific entries and every possible state.

That model causes:

- global token growth for local component needs;
- unrelated components changing together;
- component behavior leaking into application APIs;
- unclear precedence between hover, selected, focused, and invalid states;
- token names that preserve implementation history instead of product meaning.

Do not solve the problem by creating every property and state combination. Symmetry is not evidence that a role is needed.

## Accepted model

### Layer 1: palette values

`packages/design-system/src/tokens/value.stylex.ts` owns raw color scales. Palette values are implementation inputs, not product APIs.

### Layer 2: interface semantics

`packages/design-system/src/tokens/semantics.stylex.ts` owns reusable surface, element, ghost element, accent element, danger element, text, border, focus, selection, and syntax roles.

Examples:

- An application underlay uses `surface.canvas`.
- A popover links to `surface.raised`.
- A neutral control hover uses `element.hover` or `ghostElement.hover`, depending on whether it has a resting fill.
- A modal dimming layer uses `surface.backdrop`.
- Keyboard focus uses a focus ring or focused border.

### Layer 3: linked component semantics

A component translates its behavioral state model into interface roles through private StyleX variables.

Examples:

- DataGrid owns header, row, column, current-cell, selected-cell, and focus roles.
- WorkspaceTabs owns resting, hover, selected, disabled, text, and focus roles.

The component vocabulary remains specific while its default visual language stays connected to the interface system.

## Inspector implementation

### DataGrid

`packages/design-system/src/components/dataGrid/dataGridColors.stylex.ts` links component roles to interface semantics.

The contract distinguishes:

- `headerBackground` from `emphasizedHeaderBackground`;
- `rowHoverBackground` from `selectedRowBackground`;
- `emphasizedColumnBackground` from `currentCellBackground`;
- `selectedCellBackground` from `currentCellBorder`;
- component focus from persistent selection.

Style rule names may retain library state terminology where changing behavior is out of scope, but color-role names must describe the actual visual meaning.

### WorkspaceTabs

`packages/design-system/src/components/workspaceTabs/workspaceTabsColors.stylex.ts` owns tab-specific roles while linking most values to surface, element, ghost element, text, and focus semantics.

Its custom hover treatment remains private because it is a WorkspaceTabs visual decision rather than a new interface-wide hover rule.

### Box

`Box` exposes constrained interface aliases such as surface, element, text, border, and selection roles. It does not expose DataGrid or WorkspaceTabs color tokens.

This allows applications to compose approved interface surfaces without depending on component internals.

## Why focus remains orthogonal

Hover, pressed, and selected can change an element's fill. Focus identifies the input destination and can coexist with those states.

A generic focused background would require arbitrary precedence rules:

- Does focused replace selected?
- Does hover replace focused?
- Does invalid focus use the same background?
- Does pointer focus receive the same treatment as keyboard focus?

Inspector therefore expresses focus through a ring or border and composes it with the component's background state. A component may own a focused background only when its interaction model specifically requires one.

## Public and private boundaries

### Broadly exposed

- Palette-derived interface semantics through `@inspector/ds/theme`.
- Constrained aliases through public design-system primitives.
- Consumer-facing status, hierarchy, surface, and interaction roles.

### Kept private

- Component state translations.
- One-component visual treatments.
- Combined state styling.
- Direct palette choices.
- Implementation-only transparent and inherited values.

Promote a component role only when consumers need to tune that component independently and the theming behavior becomes a deliberate contract.

## How to repeat the pattern

When a component needs a new color:

1. Name the actual component state without using `active`.
2. Check whether an interface semantic already expresses the intended treatment.
3. Add a private component role linked to that semantic.
4. Keep state combinations in the component styles.
5. Add a component token contract test.
6. Render the affected states in both color schemes.
7. Promote a role globally only when at least one independent consumer or theming requirement justifies it.

When an interface role is proposed, ask:

- Does the meaning recur across components?
- Should changing it update those components together?
- Must themes tune it independently?
- Does the name describe meaning rather than location?
- Can it coexist with other states?

## Counterexamples

- Adding a global `tableCellActiveBackground` for one DataGrid state.
- Using `surface.backdrop` as the background of modal content rather than the dimming layer behind it.
- Using `surface.canvas` for any low-emphasis region instead of the application underlay.
- Reusing `element.selected` for a transient pressed state because the values match.
- Adding `focusedBackground` only to complete a state matrix.
- Importing palette blue directly into application code.
- Exposing private component tokens through `Box`.
- Treating an existing token as correct precedent without confirming its role.

## Evidence

The migration established these observable outcomes:

- component-specific table, tab, and input names left the interface namespace;
- DataGrid and WorkspaceTabs gained private linked color contracts;
- focus moved to explicit ring and border roles;
- constrained Box aliases expose interface roles without component internals;
- token, component, application, generated metadata, documentation, and browser states migrated together;
- contract tests prevent component names from returning to interface semantics.

Use this exemplar as evidence for the ownership pattern, not as a requirement that every component receive its own color file.
