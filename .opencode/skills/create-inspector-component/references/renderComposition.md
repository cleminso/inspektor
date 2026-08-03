# Render composition

## Table of contents

- [Purpose](#purpose)
- [Composition layers](#composition-layers)
- [Element and function forms](#element-and-function-forms)
- [Part classification](#part-classification)
- [Public policy](#public-policy)
- [Separate semantic parts](#separate-semantic-parts)
- [Native semantics](#native-semantics)
- [Failure modes](#failure-modes)
- [Required proof](#required-proof)

## Purpose

Base UI's `render` prop applies a primitive's generated behavior, props, state attributes, handlers, and ref to another element or component. It enables several behaviors to share one DOM element and avoids nested interactive elements.

Use `render`; do not introduce `asChild`.

## Composition layers

Composition can occur at three boundaries:

1. Base UI applies its behavior to a rendered target.
2. `@inspector/ds` composes Base UI parts with Inspector components internally.
3. A product application composes public Inspector parts.

Internal use does not require a public `render` prop on every wrapper. The rendered Inspector target must still accept and forward Base UI-generated props and refs.

## Element and function forms

The element form is the default composition mechanism:

```/dev/null/menuExample.tsx#L1-5
<Menu.Trigger render={<Button variant="secondary" />}>
  Actions
</Menu.Trigger>
```

The rendered component must spread received props and forward the ref to its underlying DOM element.

The function form exposes generated props and state:

```/dev/null/menuFunctionExample.tsx#L1-7
<Menu.Trigger
  render={(props) => <button {...props} />}
>
  Actions
</Menu.Trigger>
```

The function controls prop application. Use `mergeProps` when combining generated props with another prop set. Dropping generated props breaks Base UI behavior.

## Part classification

Classify each part before exposing `render`:

| Role | Default decision | Examples |
| --- | --- | --- |
| Provider or non-DOM root | Hide | Provider, state-only Root |
| Structural part | Hide | Portal, Positioner, Popup, Separator |
| Behavioral endpoint | Expose | Button, Trigger, Close |
| Semantic endpoint | Prefer a dedicated part; expose if substitution remains valid | Item, LinkItem |
| High-level composition | Hide unless composition is a product capability | Search, composed field |

## Public policy

- Omit `render` from inherited Base UI props by default.
- Restore the exact `BaseComponent.Part.Props["render"]` type on approved parts.
- Do not create a broader custom render signature.
- Preserve the part's default element unless substitution has a semantic reason.
- Document valid target semantics and any required Base UI configuration.

This policy makes composition explicit without preventing trigger and interactive-leaf use cases.

## Separate semantic parts

Prefer separate parts when the semantic alternatives are known. `Menu.Item` and `Menu.LinkItem` communicate action and navigation intent more clearly than asking consumers to choose an element through unrestricted polymorphism.

Use `render` when several behaviors need one element or a legitimate target component cannot be represented by a fixed semantic part.

## Native semantics

Each Base UI part has a default native element. A different element can require an explicit signal such as `nativeButton` because element-specific defaults cannot be inferred before rendering.

- keep links as links and buttons as buttons
- avoid nested interactive elements
- preserve required `type`, `href`, role, and keyboard semantics
- expose or inject `nativeButton` according to the wrapper's approved target semantics
- do not use visual appearance to justify incorrect native semantics

## Failure modes

- exposing `render` only because Base UI provides it
- hiding `render` on a trigger that must compose with another behavior
- rendering a custom component that drops received props or ref
- applying generated props to a wrapper and the ref to a child
- using the function form without spreading generated props
- changing the native element without matching `nativeButton`
- replacing a dedicated semantic part with arbitrary polymorphism

## Required proof

For each public `render` boundary, test:

- default element semantics
- an approved composed Inspector target
- consumer and Base UI handlers both run
- generated ARIA and state attributes survive
- the ref points to the composed DOM element
- element-specific configuration matches the rendered tag
