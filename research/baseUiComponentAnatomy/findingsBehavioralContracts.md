# Base UI v1.6.0 behavioral and React contracts

## Table of contents

- [Scope and mental model](#scope-and-mental-model)
- [Props and state ownership](#props-and-state-ownership)
- [Change events and reasons](#change-events-and-reasons)
- [DOM event-handler merging](#dom-event-handler-merging)
- [State and data attributes](#state-and-data-attributes)
- [Refs](#refs)
- [`render` and `useRender`](#render-and-userender)
- [`nativeButton`](#nativebutton)
- [Accessibility semantics](#accessibility-semantics)
- [Wrapper checklist](#wrapper-checklist)
- [Sources](#sources)

## Scope and mental model

These findings target `@base-ui/react@1.6.0`. Claims that depend on implementation details were checked against the v1.6.0 tagged source or the installed v1.6.0 package. The official handbook explains the intended public contract.

A Base UI part is not just markup. Its contract is the combination of:

1. consumer props and state ownership;
2. Base UI state, event, keyboard, focus, form, and ARIA behavior;
3. merged DOM props and refs;
4. the final element selected by the default tag or `render`;
5. state exposed to styling through `data-*`, `className(state)`, and `style(state)`.

A wrapper is correct only if it preserves this whole path. Matching the default HTML shape is not enough.

## Props and state ownership

### Element props

Parts that render an element generally accept the native props for their default element plus Base UI props such as `render`, state callbacks, and behavioral options. Some roots, such as `Dialog.Root`, render no HTML and therefore have a different contract. Types should be derived from the exact part being wrapped, not from a guessed HTML element.

**Need answered:** consumers can use ordinary DOM capabilities while Base UI adds behavior and accessibility.

**Wrapper failures:**

- Rebuilding a small prop interface drops `aria-*`, input, pointer, keyboard, or form props that Base UI supports.
- Forwarding DOM props to a non-DOM root creates meaningless APIs.
- Passing wrapper-only props through to the DOM causes invalid attributes.
- Reimplementing defaults can drift from the primitive's documented defaults.

### Controlled and uncontrolled state

Stateful components normally offer a pair such as `open`/`defaultOpen`, `value`/`defaultValue`, or `checked`/`defaultChecked`.

- **Uncontrolled:** omit the controlled prop. Base UI owns current state; the `default*` prop supplies only the initial value.
- **Controlled:** pass the current value and the matching change callback. The external owner must commit the next value for the UI to change.

For example, v1.6.0 `Switch.Root` resolves `checked` with `useControlled`, calls `onCheckedChange(nextChecked, details)`, checks `details.isCanceled`, and then requests the state update. In controlled mode that update remains governed by `checked`; in uncontrolled mode Base UI stores it.

**Need answered:** uncontrolled mode provides a low-ceremony component, while controlled mode lets application state coordinate the component or change it externally.

**Wrapper failures:**

- Mirroring Base UI state in a second `useState` creates two authorities and stale UI.
- Forwarding both a controlled value and a `default*` value obscures ownership.
- Treating `default*` as reactive does not update an already mounted uncontrolled component.
- Accepting a controlled prop but hiding or altering its change callback makes the component read-only accidentally.
- Switching between controlled and uncontrolled modes after mount violates the state ownership contract.

Sources: [Customization: controlling components](https://base-ui.com/react/handbook/customization#controlling-components-with-state), [Switch v1.6.0 source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/switch/root/SwitchRoot.tsx), [Dialog v1.6.0 props](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/root/DialogRoot.tsx).

## Change events and reasons

Base UI change callbacks use the shape `(nextValue, eventDetails)`, for example `onOpenChange(open, details)`. They are custom component events, not aliases for one React DOM event: a change can originate from different DOM events, an effect, or rendering logic.

`eventDetails` supplies:

- `reason`: a component-specific string union such as `trigger-press`, `outside-press`, or `escape-key`;
- `event`: the associated native DOM `Event`, with its type narrowed from the reason where available;
- `trigger`: the initiating element when applicable;
- `cancel()`: prevents Base UI from applying that component state change;
- `isCanceled`: reports whether cancellation was requested;
- `allowPropagation()`: opts back into propagation where Base UI would stop the native event, notably Escape handling in nested popups;
- `isPropagationAllowed`: reports that propagation choice.

Individual components may add details. For example, `Dialog.Root` adds `preventUnmountOnClose()` and declares its own reason union.

**Need answered:** consumers can react differently to user intent, veto an uncontrolled transition without taking ownership of all state, and coordinate nested interactions.

**Wrapper failures:**

- Adapting a callback to `(value) => void` discards cancellation, reasons, the originating event, and component-specific details.
- Replacing the typed reason with `string` removes useful exhaustiveness and event narrowing.
- Calling `preventDefault()` instead of `details.cancel()` targets browser behavior, not Base UI's state transition.
- Calling `stopPropagation()` instead of using `allowPropagation()` misunderstands the direction of the override.
- Assuming every change came from a click fails for keyboard, focus, outside press, imperative, and effect-driven changes.
- Calling side effects for every reason can produce incorrect routing, analytics, or focus behavior.

`event.preventBaseUIHandler()` is a separate mechanism on merged **React synthetic events**. It suppresses an earlier Base UI React handler but does not call `preventDefault()` or `stopPropagation()`, and it cannot suppress logic driven by native events. It is an escape hatch, not a substitute for a component's change API.

Sources: [Customization: Base UI events](https://base-ui.com/react/handbook/customization#base-ui-events), [v1.6.0 event-details types](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/createBaseUIEventDetails.ts), [Dialog v1.6.0 props](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/root/DialogRoot.tsx).

## DOM event-handler merging

Use Base UI's `mergeProps` when independently produced prop sets must share one element. It behaves like rightmost-wins assignment except for these contracts:

| Prop kind | v1.6.0 behavior |
| --- | --- |
| Event handlers | Composed and called right-to-left, so the rightmost handler runs first. On React synthetic events it may call `preventBaseUIHandler()` to skip handlers to its left. |
| `className` | Concatenated right-to-left. |
| `style` | Merged, with rightmost style keys winning. |
| Other props | Rightmost value wins. |
| `ref` | **Not merged**; only the rightmost ref remains. Use ref merging separately. |

A function argument receives props merged so far, but its return value replaces that accumulated object. It must manually retain props and chain any handlers it still needs. `mergeProps` accepts up to five inputs; `mergePropsN` handles more.

**Need answered:** Base UI behavior, consumer handlers, and wrapper props can coexist without one spread silently replacing another.

**Wrapper failures:**

- `{...baseProps} {...consumerProps}` overwrites Base UI handlers.
- Reversing `mergeProps` order changes precedence and which handler can suppress Base UI.
- Expecting `preventDefault()` to stop Base UI's merged handler does not use the Base UI cancellation channel.
- Expecting `mergeProps` to merge refs loses either internal or consumer element access.
- Returning only a new handler from a props-getter function discards all accumulated props.

Sources: [`mergeProps` utility docs](https://base-ui.com/react/utils/merge-props), [`mergeProps` v1.6.0 source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/merge-props/mergeProps.ts).

## State and data attributes

Rendered parts expose documented state through `data-*` attributes for styling. In the v1.6.0 renderer, a boolean `true` becomes an empty attribute, another truthy value becomes a string, and falsey values are omitted unless a component supplies a custom mapping. Components use mappings for public names such as paired states.

The same state object is available to `className(state)`, `style(state)`, and the function form of `render(props, state)`.

**Need answered:** styling can respond to behavior without duplicating component state in the wrapper.

**Wrapper failures:**

- Copying state into wrapper state solely for styling introduces synchronization bugs.
- Filtering, renaming, or moving `data-*` attributes breaks documented selectors and consumer expectations.
- Treating a data attribute as ARIA semantics is incorrect; data attributes are styling and inspection hooks.
- Hard-coding observed internal attributes creates an unsupported dependency. Preserve and document only public attributes.

Sources: [Styling: data attributes](https://base-ui.com/react/handbook/styling#data-attributes), [`useRender` utility docs](https://base-ui.com/react/utils/use-render), [v1.6.0 state-attribute source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/getStateAttributesProps.ts).

## Refs

The normal `ref` targets the part's primary rendered element, including the element supplied through `render`. Some components expose additional refs with different ownership:

- `inputRef` targets a hidden or actual form input;
- `actionsRef` targets an imperative action object rather than a DOM node;
- internal refs support behavior, focus, measurement, validation, and element checks.

In v1.6.0, the renderer combines the computed prop ref, the ref already present on the `render` element, and internal/forwarded refs. This is separate from `mergeProps`, which deliberately does not merge refs. Custom components used with `render={<Custom />}` must forward the ref and spread received props onto the same underlying element.

React 19 can receive `ref` as a prop in a custom primitive. React 17 and 18 wrappers require `React.forwardRef`. Base UI v1.6.0 supports all three React generations.

**Need answered:** the consumer and Base UI can address the same physical element while specialized refs still identify hidden controls or imperative APIs.

**Wrapper failures:**

- Attaching the forwarded ref to a wrapper `<div>` changes the element contract and breaks focus or measurement.
- A custom render component that does not forward its ref breaks Base UI behavior as well as consumer access.
- Using `mergeProps` for refs silently keeps one ref.
- Conflating `ref` and `inputRef` exposes the wrong node to form libraries.
- Omitting ref forwarding can prevent invalid-field focus and popup positioning.

Sources: [Composition](https://base-ui.com/react/handbook/composition), [`useRender`: merging refs](https://base-ui.com/react/utils/use-render#merging-refs), [Forms: React Hook Form](https://base-ui.com/react/handbook/forms#react-hook-form), [v1.6.0 renderer source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/useRenderElement.ts).

## `render` and `useRender`

### `render` on Base UI parts

`render` composes Base UI behavior onto another element or component.

- **Element form:** `render={<Custom />}`. Base UI clones the element, automatically merges its props with Base UI props, and preserves the merged ref path.
- **Function form:** `render={(props, state) => ...}`. The callback has complete control. It must spread `props` onto the behavioral element; if adding another prop object, it must call `mergeProps` explicitly. Returning `<Custom {...props} />` still requires `Custom` to forward those props and the ref.

Pass an element or callback, not a component function as `render={Custom}`. Base UI invokes function-form `render` as a plain function; passing a component this way can violate the Rules of Hooks.

`render` is primarily composition, not unrestricted polymorphism. Changing the tag can invalidate tag-specific props or native semantics. Prefer the default semantic element unless the alternate element is deliberate.

### `useRender` for custom primitives

`useRender` gives a custom component the same rendering contract. Its important inputs are:

- `defaultTagName`: the semantic default;
- `render`: the element or callback override;
- `props`: one prop object or an array merged with Base UI rules;
- `ref`: one ref or refs to merge;
- `state`: supplied to callbacks and converted to data attributes;
- `stateAttributesMapping`: public data-attribute mapping;
- `enabled`: returns `null` and skips most work when false.

Use `useRender.ComponentProps` for a component's public props and `useRender.ElementProps` for private element props.

**Need answered:** behavioral props and refs can be attached to the consumer's chosen element without extra DOM nesting.

**Wrapper failures:**

- Not spreading callback `props` removes handlers, ARIA, data attributes, and refs.
- Adding props with ordinary spreads in the callback replaces handlers instead of composing them.
- Rendering behavior on one node and the ref on another splits the contract.
- Using `render` to change a button into an anchor while retaining button behavior creates conflicting semantics.
- Wrapping a Base UI part in an extra element and styling that parent misses state attributes and focus state on the actual control.

Sources: [Composition](https://base-ui.com/react/handbook/composition), [`useRender` utility docs](https://base-ui.com/react/utils/use-render), [`useRender` v1.6.0 source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/use-render/useRender.ts), [v1.6.0 renderer source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/useRenderElement.ts).

## `nativeButton`

`nativeButton` does not choose the rendered element. It tells Base UI whether the final element **is actually a native `<button>`**, so Base UI can apply the correct behavior.

- `nativeButton={true}` expects a `<button>` and relies on native button semantics while applying button defaults such as `type="button"`.
- `nativeButton={false}` expects a non-button and adds button semantics such as `role="button"`, keyboard activation, and disabled handling.
- Defaults depend on the component. `Button` defaults to `true`; controls whose default root is a `span`, such as `Switch.Root`, default to `false`.

The value must describe the final DOM tag passed through `render`. v1.6.0 reports a development error when the flag and actual tag disagree. A submit button must explicitly use `type="submit"`; Base UI's button default avoids accidental form submission.

Button semantics should not be forced onto navigation. An anchor with `href` already has link semantics; use a link rather than a Button rendered as a link.

**Need answered:** Base UI cannot know the final tag before rendering or hydration, yet native and non-native buttons need different attributes and keyboard behavior.

**Wrapper failures:**

- Hiding `nativeButton` while exposing arbitrary `render` lets consumers create a flag/tag mismatch.
- Setting `nativeButton={false}` on a real button adds redundant or conflicting emulation.
- Leaving it `true` on a `div` loses expected keyboard and accessibility behavior.
- Treating an anchor as a button changes the announced role and interaction model.
- Forgetting the button `type` contract can either prevent intended submission or cause accidental submission in a hand-written replacement.

Sources: [Button docs](https://base-ui.com/react/components/button), [`useRender`: polymorphism](https://base-ui.com/react/utils/use-render#render-prop-and-polymorphism), [Button v1.6.0 source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx), [v1.6.0 button behavior](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/use-button/useButton.ts).

## Accessibility semantics

Base UI supplies roles, ARIA attributes, keyboard interactions, focus management, pointer interactions, and compound-part relationships. The application and wrapper still own correct composition and visual treatment.

- Preserve the primitive's default element and required compound structure unless there is a reason to change it.
- Preserve all behavioral props on the same focusable element.
- Provide an accessible name with a visible label where possible; otherwise use `aria-label` or `aria-labelledby` on the actual control.
- Keep descriptions associated through the provided Field APIs.
- Style a visible `:focus` or `:focus-visible` indicator.
- Preserve hidden inputs used for native form submission and validation.
- For modal or focus-trapping dialogs, include `Dialog.Close` inside `Dialog.Popup` so touch screen-reader users have an escape control.
- Use `focusableWhenDisabled` for buttons that become disabled while focused, such as during loading, when retaining focus and tab-order position is required.

**Need answered:** an unstyled primitive can still provide a coherent keyboard and assistive-technology interaction model.

**Wrapper failures:**

- Replacing semantic elements without reproducing their semantics.
- Dropping `aria-*`, roles, IDs, handlers, or refs while filtering props.
- Putting the label or ARIA name on a decorative wrapper rather than the control.
- Removing a hidden input because it appears visually unnecessary, breaking forms and validation.
- Disabling a focused loading button without considering focus loss.
- Removing dialog close controls because Escape works with a hardware keyboard.
- Styling away the focus indicator.

Sources: [Accessibility overview](https://base-ui.com/react/overview/accessibility), [Forms: naming controls](https://base-ui.com/react/handbook/forms#naming-form-controls), [Button docs](https://base-ui.com/react/components/button), [Dialog v1.6.0 props](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/root/DialogRoot.tsx).

## Wrapper checklist

- Derive props and refs from the exact Base UI part.
- Keep one state owner; forward controlled value, `default*`, and change callback consistently.
- Preserve the complete `eventDetails` argument and its component-specific reason union.
- Distinguish `details.cancel()`, `details.allowPropagation()`, `event.preventBaseUIHandler()`, `preventDefault()`, and `stopPropagation()`.
- Use `mergeProps` for independent prop sources and a ref-merging mechanism for refs.
- Forward Base UI props and refs to the same underlying element.
- Preserve public data attributes on the rendered part.
- Keep `nativeButton` aligned with the final DOM tag, or constrain `render` so mismatch is impossible.
- Preserve semantic elements, labels, roles, ARIA, keyboard behavior, focus management, and hidden form inputs.
- Test mouse, keyboard, controlled, uncontrolled, disabled, ref, custom `render`, form, and accessible-name behavior.

## Sources

- [Base UI customization handbook](https://base-ui.com/react/handbook/customization)
- [Base UI composition handbook](https://base-ui.com/react/handbook/composition)
- [Base UI forms handbook](https://base-ui.com/react/handbook/forms)
- [Base UI accessibility overview](https://base-ui.com/react/overview/accessibility)
- [Base UI styling handbook](https://base-ui.com/react/handbook/styling)
- [Base UI `useRender` utility](https://base-ui.com/react/utils/use-render)
- [Base UI `mergeProps` utility](https://base-ui.com/react/utils/merge-props)
- [Base UI Button](https://base-ui.com/react/components/button)
- [Base UI v1.6.0 tagged source](https://github.com/mui/base-ui/tree/v1.6.0/packages/react/src)
