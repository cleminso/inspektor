# StyleX integration

## Table of contents

- [Closed styling boundary](#closed-styling-boundary)
- [State callbacks](#state-callbacks)
- [Capability inventory](#capability-inventory)
- [Focus indicators](#focus-indicators)
- [Empty state rules](#empty-state-rules)
- [CSS variables](#css-variables)
- [Contextual descendant styles](#contextual-descendant-styles)
- [Validation](#validation)

## Closed styling boundary

Consumers do not receive `className`, `style`, arbitrary CSS values, or broad styling slots. Inspektor applies StyleX internally through Base UI's `className`, `style`, or render interfaces. A missing design decision requires a semantic token, constrained prop, variant, primitive, or composed component.

Use semantic tokens before primitive tokens. Keep theme-specific values behind tokens.

## State callbacks

Use the exact Base UI part `State` type with `createStateStyleProps`:

```/dev/null/input.tsx#L1-12
const stateStyleProps = createStateStyleProps<BaseInput.State>(
  (state) => [
    inputStyles.root,
    state.disabled === true && inputStyles.disabled,
    state.valid === false && inputStyles.invalid,
  ],
);

return <BaseInput {...props} {...stateStyleProps} />;
```

The adapter keeps class and dynamic style output aligned. Prefer typed state callbacks over manually recreating Base UI data attributes.

## Capability inventory

For every rendered Base UI part, inventory:

- state callback properties and value ranges
- generated data attributes
- transition states
- CSS variables
- pseudo-classes relevant to the native element

Classify every capability as styled, consumed by behavior, intentionally unstyled, or unreachable through the Inspektor wrapper.

Name state rules after the Base UI state or attribute where practical. Keep compound Inspektor conditions separate from single-state inventory entries.

## Focus indicators

- Inventory every element that can receive sequential, roving, or programmatic focus.
- Do not suppress a focus outline unless a visible indicator is transferred to the complete interactive owner.
- Choose inset or outer geometry from the actual clipping boundary. An inset ring is valid only when its color has sufficient contrast against every control state it overlaps.
- Use an on-fill semantic color for inset indicators on filled, danger, selected, and checked controls when the standard ring does not contrast with that fill.
- Composite widgets use one sequential entry point. Arrow navigation may move the roving tab stop without activating the item when the interaction uses manual activation.
- A highlighted composite item must remain visible in forced-colors mode. Preserve that positional indicator for disabled highlighted items instead of relying only on text color or background fill.
- If focus moves to a popup, viewport, or other structural container, show a container indicator or a visible current-item indicator for keyboard-origin focus.
- Verify computed `outlineStyle`, `outlineWidth`, `outlineColor`, geometry, and clipping in a real browser. jsdom and generated StyleX class assertions do not prove a visible indicator.

## Empty state rules

Empty StyleX rules may make intentionally unstyled capabilities discoverable:

```/dev/null/checkbox.styles.ts#L1-8
const styles = stylex.create({
  rootChecked: { backgroundColor: selectedBackground },
  rootUnchecked: {},
  rootDirty: {},
  rootTouched: {},
  rootFocused: {},
});
```

These rules document wrapper awareness; they do not create Base UI attributes or useful CSS output. Base UI remains the source of truth. Compare the inventory with the matching API and source during dependency review.

## CSS variables

Use Base UI CSS variables for dynamic geometry such as anchor dimensions, available viewport space, and transform origin. Do not duplicate calculations in React or invent static values when the primitive exposes the required variable.

Record every available variable even when unused. Explain any replacement calculation in the component audit.

## Contextual descendant styles

When an ancestor influences a descendant without prop drilling or styling escape hatches, use a component-scoped `stylex.defineVars()` contract:

- put variables in a dedicated `{component}Vars.stylex.ts` module
- export only variables from that module
- consume variables in `{component}.styles.ts`
- override specific variables from ancestor state styles

Use StyleX context-driven and descendant recipes only after checking whether composition or direct state mapping solves the requirement more clearly.

## Validation

- use typed lookup records with `satisfies Record<Variant, unknown>`
- use explicit boolean comparisons
- keep pseudo-class conditions inside affected property values
- allow top-level pseudo-elements where supported
- run focused StyleX lint for every changed style file
- test state-to-style translation owned by Inspektor rather than Base UI internals
