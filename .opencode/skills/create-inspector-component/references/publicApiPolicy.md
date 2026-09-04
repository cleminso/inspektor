# Public API policy

## Table of contents

- [Default-open contract](#default-open-contract)
- [Global omissions](#global-omissions)
- [Part-specific omissions](#part-specific-omissions)
- [Type ownership](#type-ownership)
- [Inspektor-owned props](#inspektor-owned-props)
- [Prop transformations](#prop-transformations)
- [Implementation pattern](#implementation-pattern)

## Default-open contract

Inspektor wrappers preserve the complete Base UI part surface by default. This includes refs, semantic events, ARIA attributes, native DOM attributes, controlled and uncontrolled state, and form integration.

The wrapper remains visually closed. Public APIs do not accept `className`, inline `style`, arbitrary CSS values, or styling slot overrides.

Broad inheritance is intentional only when the Base UI capability retains its meaning. Selective `Pick` types and extra omissions require a recorded reason.

## Global omissions

Every rendered part omits:

- `className`
- `style`

Omit `render` from the inherited type and restore its exact type only on parts classified for composition. See [renderComposition.md](renderComposition.md).

## Part-specific omissions

Omit a Base UI prop when:

- Inspektor fixes its value internally
- Inspektor replaces it with a constrained semantic prop
- Inspektor derives it from several public props or contexts
- it collides with an Inspektor-owned name
- exposing it would bypass a design-system decision
- the part's semantic classification excludes the capability

Every omission needs an audit entry containing the Base UI capability, Inspektor decision, mapping, and proof.

## Type ownership

Derive a type from the layer that owns its meaning:

- unchanged Base UI behavior: `BaseComponent.Part.Props["prop"]`
- native element semantics: `React.ComponentPropsWithRef<"element">["prop"]`
- Inspektor design decisions: package-owned unions or discriminated unions
- transformed behavior: Inspektor-owned type with an explicit Base UI mapping

Redeclare an inherited Base UI prop only when package JSDoc, a literal default, or an intentional constraint belongs in the Inspektor contract. Redeclaration documents the prop but does not narrow other inherited props.

## Inspektor-owned props

An Inspektor prop must:

1. represent a semantic system decision rather than a CSS mechanism
2. have a concrete component or product requirement
3. use a constrained type
4. avoid impossible combinations
5. have a literal default in parameter destructuring when optional
6. map through typed lookup records when selecting styles or behavior
7. declare whether it is consumed, forwarded, derived, or translated
8. use package JSDoc for reusable API facts
9. have focused proof for its mapping and invalid states

Prefer `variant="danger"`, `size="m"`, or `width="anchor"` over arbitrary color, padding, offset, or slot styling props.

## Prop transformations

Record every value that does not cross the wrapper unchanged:

| Transformation | Meaning                                               | Audit question                         |
| -------------- | ----------------------------------------------------- | -------------------------------------- |
| Renamed        | Inspektor and Base UI use different names             | Is any type or event information lost? |
| Normalized     | Several public forms become one internal value        | Can the public states conflict?        |
| Derived        | Several inputs or contexts determine one Base UI prop | Which input wins and why?              |
| Constrained    | Inspektor fixes or limits a Base UI capability        | Is the Base prop omitted publicly?     |
| Consumed       | Inspektor uses the prop without forwarding it         | Is the ownership clear?                |
| Injected       | Inspektor configures Base UI without a public prop    | Is the fixed value documented?         |

Transform only to enforce an invariant, centralize a design decision, replace Base UI vocabulary with Inspektor semantics, or hide configuration consumers should not understand.

## Implementation pattern

```/dev/null/component.tsx#L1-24
type BasePartProps = Omit<
  BaseComponent.Part.Props,
  | "className"
  | "style"
  | "render"
  | "basePropOwnedByInspector"
>;

export interface PartProps extends BasePartProps {
  /** Composes behavior onto a compatible component. */
  render?: BaseComponent.Part.Props["render"];
  /** Selects an Inspektor design-system treatment. */
  variant?: PartVariant;
}

function Part({
  variant = "default",
  render,
  ...props
}: PartProps) {
  return (
    <BaseComponent.Part {...props} render={render} />
  );
}
```

The example restores `render` only because the part has already been classified as a valid behavioral or semantic endpoint.
