# Ref forwarding

## Table of contents

- [Why refs exist](#why-refs-exist)
- [Ref owners](#ref-owners)
- [Execution flow](#execution-flow)
- [Render targets](#render-targets)
- [useRender and mergeProps](#userender-and-mergeprops)
- [Public ref policy](#public-ref-policy)
- [Failure modes](#failure-modes)
- [Required proof](#required-proof)

## Why refs exist

Refs connect component behavior to a concrete DOM element. Base UI uses them for focus management, measurement, popup anchoring, keyboard navigation, and focus restoration. Inspektor and product code may also need focus, measurement, scrolling, or browser API integration.

A ref is not a styling API, although imperative DOM mutation remains technically possible. The closed styling contract prevents declarative consumer styling through component props.

## Ref owners

Three owners can require the same DOM element:

1. Base UI internal behavior.
2. Inspektor internal behavior.
3. The consuming application.

The implementation must preserve all applicable owners instead of selecting one accidentally.

## Execution flow

```/dev/null/refFlow.txt#L1-6
Consumer ref
  -> Inspektor wrapper
  -> Base UI part or useRender
  -> render target component
  -> underlying DOM element
```

Document the final ref target. Changing that target is a public contract change.

## Render targets

A component used as a Base UI `render` target must:

- accept the received ref
- accept Base UI-generated props
- apply both to the same underlying DOM element
- preserve generated event handlers, ARIA, IDs, and state attributes

In React 19, `ref` is available through props. `useRender.ComponentProps<Element>` includes it through `React.ComponentPropsWithRef<Element>`.

Public application ref access and render-target ref forwarding are separate decisions. A render target must forward the behavioral ref even if application ref usage is not emphasized.

## useRender and mergeProps

`mergeProps` safely combines event handlers, `className`, `style`, and ordinary props according to Base UI precedence rules. It does not merge refs; only its rightmost ref survives.

Use the `ref` option of `useRender` to combine an Inspektor internal ref with the external `props.ref` managed by `useRender`:

```/dev/null/measuredPart.tsx#L1-15
function MeasuredPart({ render, ...props }: MeasuredPartProps) {
  const internalRef = React.useRef<HTMLElement | null>(null);

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      defaultProps,
      props,
    ),
    ref: internalRef,
  });
}
```

Do not pass multiple refs through `mergeProps` and assume they are merged.

## Public ref policy

| Part category                   | Policy                                              |
| ------------------------------- | --------------------------------------------------- |
| Rendered Base UI primitive part | Preserve inherited ref                              |
| Interactive leaf or trigger     | Preserve and document target                        |
| Render target component         | Forward received ref to its DOM element             |
| Non-DOM root or provider        | No applicable ref                                   |
| High-level composition          | Expose only for an identified imperative capability |

Do not replace the primitive ref type with a broader element type merely to make composition compile.

## Failure modes

- destructuring `ref` and failing to apply it
- spreading props onto a wrapper while placing the ref on a different element
- overwriting Base UI's ref with an internal ref
- passing refs through `mergeProps` instead of `useRender` ref merging
- changing the ref target through undocumented markup changes
- using DOM discovery because the rendered owner failed to attach the ref

## Required proof

Add a regression test when a wrapper changes ref handling or render composition:

- create a consumer ref
- render the component in its default form
- assert that the ref points to the documented element
- compose through `render` when supported
- assert that Base UI and consumer behavior target the same element
- cover an Inspektor internal ref if the component owns one
