# Anatomy of Base UI components

This document explains how Inspektor wraps Base UI parts while preserving state, behavior, accessibility, props, refs, and rendering contracts.

## Table of contents

The sections trace wrapper execution, compound anatomy, type and state contracts, rendering tools, ownership, examples, failure modes, and sources.

- [Purpose and scope](#purpose-and-scope)
- [The mental model](#the-mental-model)
  - [Component versus part](#component-versus-part)
  - [Universal pattern versus component contract](#universal-pattern-versus-component-contract)
- [Execution path: consumer JSX to accessible DOM](#execution-path-consumer-jsx-to-accessible-dom)
  - [1. Consumer JSX describes intent](#1-consumer-jsx-describes-intent)
  - [2. The public wrapper API limits expression](#2-the-public-wrapper-api-limits-expression)
  - [3. Root coordinates shared behavior](#3-root-coordinates-shared-behavior)
  - [4. Parts take focused roles](#4-parts-take-focused-roles)
  - [5. Rendering and prop merging build one element contract](#5-rendering-and-prop-merging-build-one-element-contract)
  - [6. The final DOM carries behavior and accessibility](#6-the-final-dom-carries-behavior-and-accessibility)
- [Compound component anatomy](#compound-component-anatomy)
  - [Recurring part roles](#recurring-part-roles)
  - [Required and optional parts](#required-and-optional-parts)
  - [Context relationships](#context-relationships)
- [Props and state contracts](#props-and-state-contracts)
  - [Derive props from the exact part](#derive-props-from-the-exact-part)
  - [Controlled and uncontrolled state](#controlled-and-uncontrolled-state)
  - [Change callbacks and event details](#change-callbacks-and-event-details)
  - [Part State and data attributes](#part-state-and-data-attributes)
- [TypeScript tools used by Inspektor wrappers](#typescript-tools-used-by-inspektor-wrappers)
  - [Omit](#omit)
  - [Pick](#pick)
  - [Indexed access](#indexed-access)
  - [Discriminated unions](#discriminated-unions)
  - [Generic values](#generic-values)
  - [Generic forwardRef cast](#generic-forwardref-cast)
  - [`Object.assign`](#objectassign)
- [Refs and rendering](#refs-and-rendering)
  - [ComponentRef and forwardRef](#componentref-and-forwardref)
  - [render](#render)
  - [useRender](#userender)
  - [mergeProps](#mergeprops)
  - [Prop spread precedence](#prop-spread-precedence)
  - [nativeButton](#nativebutton)
- [Base UI versus Inspektor ownership](#base-ui-versus-inspektor-ownership)
- [Mapped Inspektor examples](#mapped-inspektor-examples)
  - [Button: a single-part wrapper](#button-a-single-part-wrapper)
  - [Accordion: a compound wrapper](#accordion-a-compound-wrapper)
  - [Select: compound parts, generic values, and a popup recipe](#select-compound-parts-generic-values-and-a-popup-recipe)
  - [ActionList: behavior primitives versus rendering utilities](#actionlist-behavior-primitives-versus-rendering-utilities)
- [Questions to ask while reading a component](#questions-to-ask-while-reading-a-component)
- [Common misconceptions](#common-misconceptions)
- [Failure modes](#failure-modes)
- [Wrapper-review checklist](#wrapper-review-checklist)
- [Sources](#sources)
  - [Official Base UI documentation](#official-base-ui-documentation)
  - [Official Base UI v1.6.0 source](#official-base-ui-v160-source)
  - [Local Inspektor source map](#local-inspektor-source-map)

## Purpose and scope

This document explains how a Base UI component becomes Inspektor DOM. It targets a reader who can read React and TypeScript but has not yet built an accessible compound component.

The central idea is:

> A Base UI part is not merely an HTML tag. It is a boundary where state, behavior, accessibility, props, refs, and rendering meet.

Inspektor does not copy that machinery. Its wrappers preserve Base UI's behavioral contract while narrowing the public API and applying Inspektor's visual rules.

This document targets `@base-ui/react` v1.6.0. Recurring names such as `Root`, `Trigger`, and `Popup` are useful clues, not universal guarantees. Consult the official anatomy and API for the exact component being used. Dialog, Menu, Select, Checkbox, and Accordion do not assign identical DOM or behavior to identically named parts.

## The mental model

Base UI widgets consist of parts whose boundaries assign state, behavior, accessibility, rendering, and layout responsibilities.

### Component versus part

A **component** can mean the whole widget, such as a Select, or one React function that renders part of it. A **part** is a named unit of a compound component, such as `Select.Trigger` or `Select.Item`.

A single-part component can place its behavior on one primary element:

```/dev/null/base-ui-anatomy.txt#L1-3
Button
└─ one behavior-owning element
   └─ visual children
```

A compound component splits one widget across several parts because no single DOM element can be the trigger, floating surface, option collection, group label, and selection indicator at once:

```/dev/null/base-ui-anatomy.txt#L1-11
Select.Root                          shared state; commonly no DOM
├─ Select.Label                     names the control
├─ Select.Trigger                   opens the listbox
│  └─ Select.Value                  displays shared selection state
└─ Select.Portal                    changes DOM placement
   └─ Select.Positioner             computes geometry
      └─ Select.Popup               owns the floating surface
         └─ Select.List             owns collection semantics
            └─ Select.Item          represents one option
               └─ Select.Indicator  reflects item selection
```

The split answers four needs:

| Need          | Why parts help                                                                                     | What breaks without the boundary                                                |
| ------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Accessibility | Trigger, popup, list, item, and label receive distinct roles and ARIA relationships.               | A visually correct widget can have no coherent keyboard or screen-reader model. |
| State         | Distant elements read one Root-owned state model.                                                  | Trigger, popup, and selection can disagree.                                     |
| Layout        | Portal, Positioner, Popup, Backdrop, and Arrow each use the positioning model suited to their job. | Content semantics become coupled to clipping, stacking, or floating geometry.   |
| Composition   | Each DOM-bearing part is a focused styling and `render` boundary.                                  | Customization requires rebuilding the whole widget and its behavior.            |

### Universal pattern versus component contract

The following ideas recur broadly:

- A Root coordinates shared state and context.
- Parts consume broad Root context or narrower local context.
- DOM-bearing parts merge Base props, consumer props, refs, and derived state.
- Public state is exposed to styling through `Part.State` and documented `data-*` attributes.
- A wrapper should derive from the exact `Part.Props` it renders.

The following details are component-specific:

- Whether Root renders DOM.
- Which parts are required.
- The default tag and role of each part.
- The controlled state shape and callback details.
- Which part owns focus, positioning, form integration, or transitions.
- Which `data-*` attributes and `Part.State` fields are public.
- Whether a part supports `nativeButton`, `keepMounted`, multiple selection, or detached triggers.

Treat the recurring pattern as a reading guide, not as permission to guess. Use each component's official anatomy and API, such as [Select](https://base-ui.com/react/components/select), [Dialog](https://base-ui.com/react/components/dialog), [Menu](https://base-ui.com/react/components/menu), [Checkbox](https://base-ui.com/react/components/checkbox), or [Accordion](https://base-ui.com/react/components/accordion).

## Execution path: consumer JSX to accessible DOM

Read a wrapper from the outside boundary toward the actual element:

```/dev/null/base-ui-anatomy.txt#L1-20
consumer JSX
  ↓
Inspektor public props
  ↓
Inspektor defaults, restrictions, structure, and StyleX policy
  ↓
Base UI primitive or compound Root
  ↓
optional React context shared across compound parts
  ↓
behavior-owning part or element
  ↓
render / useRender / prop merging / ref merging
  ↓
final DOM
  ├─ semantic element or role
  ├─ ARIA relationships
  ├─ keyboard and pointer handlers
  ├─ focus and form behavior
  └─ public data attributes
```

### 1. Consumer JSX describes intent

The consumer selects supported product concepts: a button variant, an accordion value, a selected item, or popup placement. Good consumer JSX should not need to know how Base UI wires IDs, runs roving focus, or positions an arrow.

```/dev/null/base-ui-anatomy.tsx#L1-10
<Accordion value={openValues} onValueChange={setOpenValues}>
  <Accordion.Item value="permissions">
    <Accordion.Header>
      <Accordion.Trigger>Permissions</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Permission settings</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

The JSX expresses structure and state ownership. It does not manually set `aria-expanded`, connect the trigger to the panel, or implement keyboard activation.

### 2. The public wrapper API limits expression

Inspektor's exported type decides what product code may request. It can:

- inherit valid native and Base behavior props;
- remove styling escape hatches;
- fix a mode such as single selection;
- replace arbitrary values with semantic unions;
- require an accessible name for an icon-only control;
- add product concepts such as `loading`;
- choose which composition options remain public.

The need is consistency. Base UI is intentionally broad; a design-system wrapper should make unsupported visual and behavioral decisions difficult to express.

If this layer is too broad, consumers bypass design policy. If it is rebuilt from a small handwritten interface, useful ARIA, event, form, and render props can disappear.

### 3. Root coordinates shared behavior

Root is the broad behavior bus for a compound component. It commonly owns or coordinates:

- controlled or uncontrolled state;
- change callbacks and reasons;
- generated IDs and ARIA relationships;
- trigger, popup, item, and form refs;
- item registration and collection order;
- keyboard navigation and typeahead;
- dismissal, focus entry, and focus return;
- mounted versus open state.

React context carries that model to parts. A Portal may move descendants under `document.body`, but it does not sever React context. Logical ownership follows the React tree, not DOM ancestry.

Root is not guaranteed to render an element. Select Root is a state provider with no root DOM in the Inspektor mapping, while Accordion Root renders a container. Assuming every Root accepts generic DOM props or produces a `<div>` creates a false API.

### 4. Parts take focused roles

Each part consumes only the shared facts needed for its job.

A Trigger knows whether the popup is open. An Item knows whether it is selected, highlighted, or disabled. An Arrow reads positioning geometry. An Indicator reads selection from its nearest Item or control.

Narrow contexts prevent duplicated wiring. For example, a Group Label can register its generated ID with Group, and Group can apply `aria-labelledby`. The consumer does not copy an ID between two props.

If a Base part is replaced with plain DOM, the visible shape may survive while registration, IDs, roles, handlers, focus behavior, or local state are lost.

### 5. Rendering and prop merging build one element contract

A DOM-bearing part must put all of these on the same primary element:

- Base UI's behavioral props;
- consumer DOM props;
- Inspektor's resolved policy props;
- state-dependent class and style output;
- Base UI's internal ref;
- the consumer's forwarded ref;
- the element and props supplied through `render`.

Base UI's renderer and `useRender` handle this composition. `mergeProps` handles independently produced prop objects, but refs use a separate ref-merging path.

The need is coexistence. A consumer `onClick`, Base keyboard handler, StyleX class, ARIA relationship, and measurement ref must not silently replace one another.

### 6. The final DOM carries behavior and accessibility

The browser and assistive technology only receive the final DOM. TypeScript namespaces and React contexts do not appear there. The result may contain:

- a native semantic element such as `<button>`;
- an explicit role such as `combobox`, `listbox`, `option`, `menu`, or `dialog`;
- `aria-expanded`, `aria-controls`, `aria-labelledby`, or selection attributes;
- IDs generated and shared by related parts;
- event handlers for keyboard, pointer, focus, and dismissal behavior;
- hidden inputs for form submission and validation;
- `data-*` attributes for visual state;
- a portal branch elsewhere in the DOM.

Accessibility is therefore an end-to-end contract. Correct TypeScript types are not enough if props or refs land on the wrong element.

## Compound component anatomy

Compound components divide one widget into parts connected by shared and local contexts.

### Recurring part roles

Recurring names signal common responsibilities, but the exact component contract determines each part's element, state, and required context.

| Part         | What it is                                                                                 | Need it answers                                                                                 | Typical mishandling                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Root`       | The shared state and behavior coordinator. It may render a container or no element.        | Keeps distant parts consistent and coordinates state, IDs, focus, form behavior, and lifecycle. | Treating every Root as DOM; creating a second wrapper state machine.                                |
| `Trigger`    | The control that opens, closes, or exposes a popup or panel.                               | Connects activation, focus, and ARIA state to Root.                                             | Replacing it with a styled `<div>` or dropping its props/ref.                                       |
| `Portal`     | A part that renders descendants into another DOM container while preserving React context. | Escapes clipping and local stacking contexts; supports overlay placement and presence.          | Assuming it owns positioning or that portal DOM loses Root context.                                 |
| `Positioner` | The geometry wrapper between an anchor and a floating surface.                             | Computes side, alignment, offsets, collision handling, and arrow position.                      | Styling Popup as the positioning wrapper or removing required geometry props/ref.                   |
| `Popup`      | The interactive floating surface.                                                          | Supplies popup semantics, focus behavior, transition state, and event boundaries.               | Replacing it with plain DOM and losing role, focus, or dismissal behavior.                          |
| `Backdrop`   | A separate visual layer behind a popup.                                                    | Allows viewport coverage and independent animation.                                             | Treating it as the only modality mechanism; focus and interaction blocking require more than paint. |
| `Arrow`      | A decorative pointer tied to Positioner geometry.                                          | Keeps the pointer aligned after collision shifts or side changes.                               | Positioning it independently or exposing it to assistive technology.                                |
| `Item`       | One registered action or option in a collection.                                           | Supplies keyboard movement, typeahead, disabled handling, activation, and local state.          | Rendering an unregistered row that looks like an item but is skipped by keyboard behavior.          |
| `Group`      | A semantic subset of related items.                                                        | Gives a collection an accessible subgroup and a place to register its label.                    | Using a visual wrapper without the group-label relationship.                                        |
| `Label`      | Text that names a control or group through a generated relationship.                       | Keeps visual placement flexible while preserving an accessible name.                            | Styling a label-like `<div>` that is not associated with the control.                               |
| `Indicator`  | A visual reflection of checked or selected state.                                          | Reads authoritative local state without duplicating it.                                         | Passing separate selection state that can drift from Item or Root.                                  |
| `Value`      | A projection of current selection into visible trigger text.                               | Resolves labels, placeholders, custom values, or multiple values from Root state.               | Treating displayed text as the state owner.                                                         |

These are recurring roles, not promises about tags. Select Trigger uses button-like markup with combobox semantics. Checkbox Root is itself the control. Popup-family Roots commonly render no element. Verify every exact component.

### Required and optional parts

"Required" means the behavioral or accessibility contract expects that part or relationship. "Optional" means the widget remains valid without that feature.

Examples of commonly required relationships:

- Accordion Item contains the Trigger/Panel relationship documented by Accordion anatomy.
- A popup component needs its documented interactive surface, even if a convenience wrapper hides the assembly.
- A selectable collection needs registered Item parts rather than visual rows.
- Group Label requires its matching Group context to label a subset.

Examples of commonly optional features:

- Portal when inline rendering is supported by that component.
- Backdrop for a non-modal presentation.
- Arrow as decoration.
- Group when items do not need named subsets.
- Indicator when another visible treatment communicates selection.
- Value when the Trigger supplies its own suitable content.

Optional does not mean freely movable. An optional Arrow can still require Positioner context when present. An optional Indicator can still require Item context. The official anatomy defines containment; the API defines whether omission is supported.

### Context relationships

The following is a context-consumption map assembled from recurring relationships across several component families. It is not one component's JSX tree, and the consumers are not necessarily direct children:

```/dev/null/base-ui-context-map.txt#L1-11
Root context       ──consumed by──> Trigger, Label, Portal descendants, Value
Positioner context ──consumed by──> Popup, Arrow
Group context      ──consumed by──> Group Label
Item context       ──consumed by──> Indicator

Portal changes DOM ancestry, not React ownership.
Exact containment belongs to each component's official anatomy.
```

Root context is broad. Positioner, Group, and Item contexts are narrower. This mirrors responsibility: geometry belongs near positioned content, a label ID belongs near its group, and selected state belongs near its item.

`Object.assign` is unrelated to these contexts. It places related properties on one JavaScript function object for API discoverability. Base UI's Root and part implementations create the actual contexts.

## Props and state contracts

Each wrapper preserves the exact upstream part contract while narrowing unsupported product choices.

### Derive props from the exact part

`Part.Props` is the upstream contract for one exact Base UI part. It can include:

- native props for the default element;
- ARIA, event, and form props;
- Base behavior options;
- `render` and sometimes `nativeButton`;
- controlled state props and typed callbacks;
- state-aware `className` and `style` callbacks.

Inspektor derives each wrapper from the part it actually renders:

```packages/design-system/src/studio/accordion/accordion.tsx#L12-23
export interface AccordionRootProps extends Omit<
  WithoutStyles<BaseAccordion.Root.Props<AccordionValue>>,
  'orientation'
> {
  children?: ReactNode
  defaultValue?: AccordionValue[]
  value?: AccordionValue[]
  onValueChange?: BaseAccordion.Root.Props<AccordionValue>['onValueChange']
```

The exact type matters because Root, Trigger, Item, Panel, and Popup do not know the same state and do not accept the same props. Deriving Trigger from generic button props can lose component-specific callback, state, render, or ARIA typing. Deriving a non-DOM Root from `<div>` props invents capabilities it does not have.

### Controlled and uncontrolled state

A stateful Base UI component commonly offers a three-part contract:

| Role                       | Typical prop                                          | Meaning                                                    |
| -------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Controlled value           | `open`, `value`, or `checked`                         | External state is authoritative.                           |
| Initial uncontrolled value | `defaultOpen`, `defaultValue`, or `defaultChecked`    | Base UI owns state; this supplies the initial value only.  |
| Change request             | `onOpenChange`, `onValueChange`, or `onCheckedChange` | Reports the proposed value and component-specific details. |

In controlled mode, the consumer passes the current value and commits accepted changes. In uncontrolled mode, Base UI stores the current value. A `default*` prop is not a second controlled value and does not reactively replace mounted state.

The need is a clear authority. Uncontrolled state supports local use without application plumbing. Controlled state allows routing, forms, shared state, or business rules to coordinate the widget.

What breaks:

- Mirroring Base UI state in wrapper `useState` creates two authorities.
- Passing a controlled value but hiding its callback can make the component read-only.
- Treating `defaultValue` as reactive produces stale expectations.
- Switching ownership mode on a mounted component makes state behavior ambiguous.
- Forwarding controlled and default props without understanding the component contract obscures who owns state.

### Change callbacks and event details

Base UI change callbacks commonly have this shape:

```/dev/null/base-ui-anatomy.ts#L1-5
onOpenChange(nextOpen, details)
onValueChange(nextValue, details)
onCheckedChange(nextChecked, details)

// The exact values and details type belong to the exact component.
```

The `details` object is a custom component event description, not merely a React click event. Depending on the component, it can include:

- `reason`, a component-specific string union such as trigger press, outside press, or Escape key;
- `event`, the associated native event;
- `trigger`, the initiating element when relevant;
- `cancel()` and `isCanceled`, which control Base UI's proposed state transition;
- `allowPropagation()` and `isPropagationAllowed`, used by contracts such as nested popup Escape handling;
- component-specific additions.

This answers a need that `onClick` cannot: one state change may come from keyboard input, pointer input, focus movement, dismissal, an effect, or another component mechanism. The reason lets application code respond to intent rather than guessing from one DOM event.

Do not reduce a callback to `(value) => void` in a wrapper. That discards reasons, cancellation, event narrowing, and component-specific details. Use indexed access such as `BaseSelect.Root.Props<Value, false>['onValueChange']` as Inspektor does in `packages/design-system/src/studio/select/select.tsx#L20-L34`.

Three cancellation mechanisms solve different problems:

| Mechanism                      | Controls                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| `details.cancel()`             | The Base UI component state transition represented by the change callback. |
| `event.preventBaseUIHandler()` | Earlier Base UI handlers in a merged React synthetic-event chain.          |
| `event.preventDefault()`       | The browser's default action for the DOM event.                            |

They are not interchangeable. `stopPropagation()` also solves a separate DOM propagation concern.

See [Base UI customization events](https://base-ui.com/react/handbook/customization#base-ui-events) and the [v1.6.0 event-details implementation](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/createBaseUIEventDetails.ts).

### Part State and data attributes

`Part.State` is derived state that Base UI supplies to a part's render-time styling and rendering callbacks. It is not wrapper-owned React state and is not necessarily the same shape as the controlled value.

Examples in Inspektor:

- `BaseButton.State` exposes resolved `disabled` in `packages/design-system/src/studio/button/button.tsx#L91-L108`.
- `BaseAccordion.Trigger.State` exposes `open` and `disabled` in `packages/design-system/src/studio/accordion/accordion.tsx#L96-L104`.
- `BaseAccordion.Panel.State` exposes `transitionStatus` in `packages/design-system/src/studio/accordion/accordion.tsx#L121-L128`.
- `BaseSelect.Item.State` exposes `selected`, `highlighted`, and `disabled` in `packages/design-system/src/studio/select/select.tsx#L288-L306`.

Inspektor's adapter turns one StyleX selector into Base-compatible `className(state)` and `style(state)` callbacks:

```packages/design-system/src/primitives/createStateStyleProps.ts#L3-13
type StyleXProp = stylex.StyleXStyles | false | null | undefined;

export function createStateStyleProps<State>(
  selectStyles: (state: State) => readonly StyleXProp[],
) {
  const resolve = (state: State) => stylex.props(...selectStyles(state));

  return {
    className: (state: State) => resolve(state).className,
    style: (state: State) => resolve(state).style,
  };
}
```

Base UI also maps documented state to `data-*` attributes on the rendered part. These attributes answer the styling and inspection need without making Inspektor duplicate the state machine. They do not create ARIA semantics. `data-open` may support CSS, but accessible behavior still depends on the correct element, role, IDs, ARIA attributes, and handlers.

What breaks:

- Wrapper state copied only for styling can drift from Base state.
- Reading item state from Root when Item owns it couples the wrong boundary.
- Filtering public data attributes breaks documented selectors.
- Depending on undocumented internal attributes creates a fragile contract.
- Treating `data-*` as an accessibility replacement produces incorrect semantics.

See [Base UI styling with data attributes](https://base-ui.com/react/handbook/styling#data-attributes) and the [v1.6.0 state-attribute implementation](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/getStateAttributesProps.ts).

## TypeScript tools used by Inspektor wrappers

Inspektor uses standard TypeScript utilities and focused casts to preserve upstream contracts while shaping its public API.

### Omit

`Omit<Props, Keys>` starts from a broad contract and removes named capabilities. Inspektor commonly removes `className`, `style`, or `render` so consumers cannot bypass the design system or replace structure unintentionally.

Button removes Base styling plus low-level behavior and content decisions:

```packages/design-system/src/studio/button/button.tsx#L23-40
type BaseButtonProps = Omit<
  BaseButton.Props,
  'className' | 'focusableWhenDisabled' | 'nativeButton' | 'prefix' | 'style'
>

interface ButtonSharedProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  radius?: ButtonRadius
  disabled?: BaseButton.Props['disabled']
  render?: BaseButton.Props['render']
}
```

The need is API shaping. `Omit` is compile-time only: it does not remove a key from an untyped runtime object. If runtime enforcement matters, destructure, filter, or overwrite the prop explicitly.

### Pick

`Pick<Props, Keys>` exposes a small allowed subset of a broad upstream API. Select Positioner permits semantic placement choices while Inspektor owns detailed geometry:

```packages/design-system/src/studio/select/select.tsx#L64-67
export type SelectPositionerProps = Pick<
  WithoutStyles<BaseSelect.Positioner.Props>,
  'align' | 'alignItemWithTrigger' | 'children' | 'ref' | 'side'
>
```

This answers the need to allow meaningful placement without exposing arbitrary offsets or collision tuning on every product screen. A careless `Pick` can remove a required behavioral prop, so the allowed subset must be checked against the exact part's anatomy and intended wrapper policy.

`Pick` is not Inspektor's default Base UI wrapper strategy. Transparent wrappers start from the exact part props and use justified omissions. A selective `Pick` is appropriate when the surface is intentionally closed, such as Positioners where consumers choose semantic `side` and `align` while Inspektor owns offsets, collision behavior, anchor tracking, and positioning strategy. This allowlist fails closed: an additional upstream geometry prop does not become public without an Inspektor decision.

### Indexed access

`SomeType['property']` extracts one exact property type. Inspektor uses it to document a prop locally without copying Base UI's signature:

```packages/design-system/src/studio/select/select.tsx#L20-34
export type SelectRootProps<Value> = Omit<
  BaseSelect.Root.Props<Value, false>,
  'className' | 'style' | 'multiple'
> & {
  items?: BaseSelect.Root.Props<Value, false>['items']
  value?: Value | null
  defaultValue?: Value | null
  onValueChange?: BaseSelect.Root.Props<Value, false>['onValueChange']
  disabled?: boolean
}
```

The need is exactness. Callback details, nullability, and compatible upstream changes remain tied to Base UI. A handwritten replacement such as `(value: Value) => void` can silently lose the event-details argument.

### Discriminated unions

A **discriminated union** is a union whose members are selected by a literal property. It makes invalid combinations fail type checking.

Button uses `iconOnly` as the discriminator. `iconOnly: true` requires an `aria-label` and rejects layout props that make sense only for a labeled button (`packages/design-system/src/studio/button/button.tsx#L43-L69`). This answers an accessibility need at the public boundary: an icon-only action must have a name.

If these states are represented by independent optional booleans, consumers can create contradictory or unnamed controls and the implementation must guess which rule wins.

### Generic values

A **generic value** lets the consumer choose the type represented by a component. Select should preserve an application's value type rather than reduce every option to `string` or `any`.

Inspektor fixes Select Root to single selection with `BaseSelect.Root.Props<Value, false>` and preserves Root's inferred `Value` through its current/default values, items, and callback. Select Item is a separate generic call that preserves the type inferred for that Item (`packages/design-system/src/studio/select/select.tsx#L20-L34`, `L83-L97`).

The current compound API does not create one shared TypeScript generic scope across Root and every nested Item. React context connects their values at runtime, but TypeScript checks each public surface independently. It cannot prove that a nested Item's inferred type equals Root's inferred type.

The second generic argument, `false`, is a component-specific Base Select contract for non-multiple selection. It is not a universal Root pattern.

Generic typing answers four needs:

- Root callbacks receive the same value model as Root items and values;
- each Item retains the type of the value supplied to that Item;
- consumers do not cast selected values;
- invalid value shapes fail at the API boundary.

What breaks:

- Replacing `Value` with `any` hides mismatches.
- Fixing values to `string` prevents object or numeric domain values.
- Assuming TypeScript enforces equality between Root and nested Item types hides a limitation of the compound API.

### Generic forwardRef cast

React's ordinary `forwardRef` return type does not retain a free call-site generic from the render function. Select Item uses three linked pieces:

```/dev/null/select-generic-forward-ref.tsx#L1-12
function SelectItemInner<Value>(
  props: SelectItemProps<Value>,
  ref: React.ForwardedRef<React.ComponentRef<typeof BaseSelect.Item>>,
) {
  // The implementation forwards Value and ref to BaseSelect.Item.
}

const SelectItem = React.forwardRef(SelectItemInner) as <Value>(
  props: Omit<SelectItemProps<Value>, 'ref'> &
    React.RefAttributes<React.ComponentRef<typeof BaseSelect.Item>>,
) => React.ReactElement | null
```

The real local implementation occupies `packages/design-system/src/studio/select/select.tsx#L288-L330`; the shortened body above highlights the type pattern.

The cast restores type information only. It adds no runtime check and no ref behavior. Its correctness depends on the inner generic props, forwarded ref target, and asserted callable signature staying aligned. A broad or distant cast can claim safety the implementation does not provide.

Select Root does not need this pattern because it renders no element and remains a plain generic function at `packages/design-system/src/studio/select/select.tsx#L112-L114`.

### `Object.assign`

Inspektor uses `Object.assign` to package a callable root and related members under one exported symbol:

```packages/design-system/src/studio/accordion/accordion.tsx#L132-138
export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Header: AccordionHeader,
  Item: AccordionItem,
  Panel: AccordionPanel,
  Trigger: AccordionTrigger,
})
```

This answers an API discoverability need: consumers can use `<Accordion>` or `<Accordion.Root>` and find the related parts under `Accordion`.

`Object.assign` does **not**:

- create React context;
- enforce that parts are nested correctly;
- render additional DOM;
- bind Root's generic type to every Item call;
- turn an Inspektor convenience recipe into a Base UI primitive.

Those behaviors come from the actual Root and part implementations, not namespace packaging.

## Refs and rendering

Refs and render utilities keep behavior, consumer props, styling, and element identity on one primary element.

### ComponentRef and forwardRef

A **ref** is React's route to a rendered element or imperative object. Base UI needs refs for behavior such as focus, measurement, element identity, validation, and popup positioning. Consumers may need the same primary element.

`React.ComponentRef<typeof Part>` asks React for the ref target declared by the exact imported part. It avoids guessing whether the target is `HTMLButtonElement`, `HTMLElement`, or another type.

`forwardRef<RefTarget, PublicProps>` carries the consumer ref across the Inspektor wrapper. The implementation must still attach it to the behavior-owning Base part:

```/dev/null/select-trigger-ref.tsx#L1-17
const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger(
  { nativeButton = true, render, ...props },
  ref,
) {
  return (
    <BaseSelect.Trigger
      {...props}
      ref={ref}
      nativeButton={nativeButton}
      render={render}
    />
  )
})
```

The actual implementation includes Inspektor sizing, adornments, and state styles in `packages/design-system/src/studio/select/select.tsx#L141-L196`.

What breaks:

- Attaching the ref to an extra wrapper changes the public target and can break Base measurement or focus.
- Omitting `forwardRef` blocks consumer and form-library access.
- Guessing a narrower element type can conflict with supported `render` composition.
- Confusing `ref`, `inputRef`, and `actionsRef` exposes the wrong target.

`ComponentRef` follows the component's declared ref contract. It cannot prove that every custom `render` target is compatible; that composition still needs review.

### render

Base UI's `render` prop composes a part's behavior onto another compatible element or component without adding a wrapper element.

It has two common forms:

| Form                                               | Contract                                                                                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render={<Custom />}`                              | Base UI clones the element and merges Base props, element props, and refs. `Custom` must accept the merged props and forward the ref to the same underlying element. |
| `render={(props, state) => <Custom {...props} />}` | The callback controls output. It must spread `props` onto the behavioral element and explicitly merge any additional prop object.                                    |

Pass an element or render callback, not a component function as `render={Custom}`. Base UI invokes the function form as a render function, which is different from React rendering `<Custom />` and can violate the Rules of Hooks.

`render` answers a composition need, not unlimited polymorphism. A different tag can invalidate native props or semantics. Preserve the default semantic element unless the alternate target has a deliberate, compatible contract.

What breaks:

- A custom component that drops received props loses handlers, ARIA, and state attributes.
- A custom component that drops the ref can break focus or measurement.
- A function render that uses ordinary spreads for two handler sources can overwrite one.
- Rendering button behavior on a navigation link creates conflicting interaction semantics.

See the [Base UI composition handbook](https://base-ui.com/react/handbook/composition) and [v1.6.0 renderer source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/useRenderElement.ts).

### useRender

`useRender` gives an Inspektor-owned component Base UI's rendering infrastructure without giving it a Base widget state machine. Important inputs are:

| Input                    | Purpose                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `defaultTagName`         | Selects the semantic default when no custom render target is supplied.           |
| `render`                 | Accepts the element or callback override.                                        |
| `props`                  | Supplies one merged prop contract for the element.                               |
| `ref`                    | Supplies one ref or a list of refs for the renderer's separate ref-merging path. |
| `state`                  | Supplies render callback state and public data-attribute input.                  |
| `stateAttributesMapping` | Maps state fields to documented attribute names.                                 |
| `enabled`                | Omits rendering when false.                                                      |

Use `useRender.ComponentProps<'li'>` for public native props plus the render contract. Use `useRender.ElementProps<'li'>` for private element props without automatically advertising the same component API.

`useRender` answers the need to compose behavior and refs onto one chosen element without extra DOM. It does **not** provide selection, roving focus, popup state, list registration, or Escape policy. The component using it still owns those behaviors or delegates them to actual Base primitives.

See [Base UI `useRender`](https://base-ui.com/react/utils/use-render), its [v1.6.0 source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/use-render/useRender.ts), and installed declarations at `packages/design-system/node_modules/@base-ui/react/use-render/useRender.d.ts#L10-L70`.

### mergeProps

`mergeProps` combines independently produced prop objects using Base UI's semantic rules:

| Prop kind      | Merge behavior                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event handlers | Composed right-to-left, so the rightmost handler runs first. A React synthetic event can call `preventBaseUIHandler()` to suppress handlers to its left. |
| `className`    | Concatenated right-to-left.                                                                                                                              |
| `style`        | Merged; rightmost values win for duplicate style keys.                                                                                                   |
| Other props    | Rightmost value wins.                                                                                                                                    |
| `ref`          | **Not merged.** Only the rightmost ref would remain, so refs must use a separate ref-merging route.                                                      |

The explicit non-feature is important: **`mergeProps` does not merge refs.** Base UI's renderer and `useRender` accept refs separately because element refs need their own composition mechanism. The installed declaration states this at `packages/design-system/node_modules/@base-ui/react/merge-props/mergeProps.d.ts#L6-L38`.

The utility answers the need for Base behavior, consumer handlers, and wrapper styling to coexist. Plain object spread cannot compose duplicate handlers.

Function inputs are a special case: the function receives the props merged so far, but its return value replaces that accumulated object. It must retain needed props and chain handlers itself.

See [Base UI `mergeProps`](https://base-ui.com/react/utils/merge-props) and the [v1.6.0 implementation](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/merge-props/mergeProps.ts).

### Prop spread precedence

JSX spread uses ordinary last-write-wins assignment:

```/dev/null/base-ui-anatomy.tsx#L1-8
<BasePart
  {...consumerProps}
  ref={forwardedRef}
  constrainedProp={resolvedValue}
  {...stateStyleProps}
  data-slot="part"
/>
```

This order means Inspektor's resolved value replaces a conflicting pass-through value, private state styles replace untyped runtime styling props, and the trailing slot is fixed. It does not merge duplicate handlers, class strings, style objects, or refs.

Destructuring is part of the policy. Removing `size`, `disabled`, or `render` from the rest object lets the wrapper forward one resolved value in one chosen position.

Base UI performs another internal merge inside the primitive. Wrapper JSX precedence and Base UI's renderer merge are separate layers. If several independent owners must keep handlers/classes/styles, use `mergeProps` or deliberate manual control flow rather than hoping spread order composes them.

Inspektor Button demonstrates pass-through props followed by resolved policy and state styles at `packages/design-system/src/studio/button/button.tsx#L110-L129`.

### nativeButton

`nativeButton` tells Base UI whether the **final rendered element is actually a native `<button>`**. It does not select the element.

| Value   | Meaning                                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`  | The render target is a real `<button>`. Base UI relies on native button semantics and applies relevant defaults such as `type="button"`.                                   |
| `false` | The render target is not a native button. Base UI supplies appropriate button-like role, keyboard activation, and disabled handling for components that support this mode. |

The `render` prop or default tag selects the element. `nativeButton` describes that result so Base UI can choose the correct behavior. Defaults are component-specific: Base Button defaults to native button behavior, while a control with a non-button default may not.

This answers a hydration and polymorphism need: Base UI cannot infer the final custom tag early enough to choose every native versus emulated behavior safely.

What breaks:

- `nativeButton={true}` with a rendered `<div>` loses expected non-native keyboard and role support.
- `nativeButton={false}` with a real `<button>` can add redundant or conflicting emulation.
- Hiding `nativeButton` while exposing unrestricted `render` permits an unrepresentable flag/tag mismatch.
- Treating an anchor with `href` as a button changes navigation semantics.
- Assuming `nativeButton` selects `<button>` hides the real responsibility of `render`.

See [Base UI Button](https://base-ui.com/react/components/button), [`useRender` polymorphism](https://base-ui.com/react/utils/use-render#render-prop-and-polymorphism), [v1.6.0 Button source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx), and [v1.6.0 button behavior](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/use-button/useButton.ts).

## Base UI versus Inspektor ownership

Base UI owns widget mechanics and accessible behavior. Inspektor owns supported product modes, visual policy, and feature composition.

| Concern             | Base UI owns                                                                                     | Inspektor owns                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| State mechanics     | Controlled/uncontrolled storage, update details, context, registration.                          | Supported modes, product defaults, and translations such as loading to disabled behavior.     |
| Accessibility       | Roles, ARIA relationships, keyboard/pointer behavior, focus, form mechanics.                     | Required names in public types, owned labels, safe composition, visible focus styling.        |
| Derived state       | Fields such as open, selected, highlighted, disabled, valid, placeholder, and transition status. | The visual meaning assigned to public part state.                                             |
| Primary element     | Default tag, internal handlers, internal refs, state attributes, `render` composition.           | Whether `render` and `nativeButton` are public and which visual children are inserted.        |
| Popup behavior      | Portal presence, positioning, collision handling, focus, dismissal, transition state.            | Supported placement subset, shared offsets, dimensions, surface styling, convenience recipes. |
| Styling             | State callback and data-attribute extension points; unstyled primitives.                         | Tokens, StyleX rules, variants, sizes, slots, and standard visual markup.                     |
| Compound structure  | Runtime context and required relationships.                                                      | Export namespace, documented composition, aliases, and convenience parts.                     |
| Product composition | Reusable behavior primitives and rendering utilities.                                            | Feature-specific structure and policy when no Base widget exists.                             |

A practical ownership test:

- If the concern requires widget interaction state, ARIA wiring, focus, collection registration, or popup geometry, use the relevant Base part or its public contract.
- If the concern requires Inspektor tokens, semantic variants, supported modes, standard child markup, or feature composition, it belongs in the wrapper.

Inspektor should not query the DOM to reconstruct state Base UI already exposes. It should also not push product-specific visual policy into Base UI.

## Mapped Inspektor examples

These examples map the general model to Button, Accordion, Select, and ActionList implementations.

### Button: a single-part wrapper

Button is the smallest complete model because one Base part owns the primary interactive element.

```/dev/null/button-map.txt#L1-7
consumer <Button>
  → Inspektor ButtonProps
  → Inspektor defaults and loading policy
  → BaseButton behavior and BaseButton.State
  → Base renderer merges render target, props, and refs
  → final button-compatible element
     └─ Inspektor ButtonContent presentation
```

**Public API.** Inspektor starts from `BaseButton.Props`, removes direct styling and low-level knobs, adds semantic variants, and uses a discriminated union for icon-only accessibility (`packages/design-system/src/studio/button/button.tsx#L23-L69`).

**State and policy.** `loading` is an Inspektor concept. The wrapper resolves `disabled || loading`, keeps a loading control focusable, applies `aria-busy`, and styles from Base's resolved `state.disabled` (`packages/design-system/src/studio/button/button.tsx#L71-L108`). Base UI still enforces interaction behavior.

**Element boundary.** Inspektor spreads pass-through props onto `BaseButton`, applies its resolved values and state styles, and places presentation inside the Base element (`packages/design-system/src/studio/button/button.tsx#L110-L140`). The ref reaches `BaseButton`, not `ButtonContent`.

**Need answered.** Product code gets one consistent Button API while Base UI remains responsible for button semantics, keyboard behavior, disabled behavior, and render composition.

**Breakage to watch.** Moving `ref`, `onClick`, `aria-*`, or `render` onto `ButtonContent` would split behavior across two nodes. Replacing `BaseButton` with a styled `<div>` would require rebuilding native and non-native button semantics.

### Accordion: a compound wrapper

Accordion shows why each part needs its own exact contract.

```/dev/null/accordion-map.txt#L1-9
BaseAccordion.Root
└─ BaseAccordion.Item
   ├─ BaseAccordion.Header
   │  └─ BaseAccordion.Trigger
   │     ├─ Inspektor label
   │     ├─ Inspektor chevron
   │     └─ optional suffix
   └─ BaseAccordion.Panel
      └─ consumer content
```

**Per-part props.** Root uses `BaseAccordion.Root.Props<AccordionValue>`, Item uses `Item.Props`, Header uses `Header.Props`, Trigger uses `Trigger.Props`, and Panel uses `Panel.Props` (`packages/design-system/src/studio/accordion/accordion.tsx#L8-L61`). This preserves each part's distinct behavior and state typing.

**Root and context.** Root owns expanded values and broad Accordion context. Item registers its value. Trigger and Panel participate in that Item relationship. Inspektor does not copy expanded state into another hook (`packages/design-system/src/studio/accordion/accordion.tsx#L63-L85`).

**Part state.** Trigger styles `open` and `disabled`; Panel styles `transitionStatus`. Those facts come from the parts that own them (`packages/design-system/src/studio/accordion/accordion.tsx#L96-L128`).

**Presentation.** Inspektor inserts label, chevron, and suffix inside Base Trigger. It does not create a competing button or heading (`packages/design-system/src/studio/accordion/accordion.tsx#L96-L119`). Base Header and Trigger retain their semantic relationship.

**API packaging.** `Object.assign` exposes `Accordion.Root`, `.Item`, `.Header`, `.Trigger`, and `.Panel` (`packages/design-system/src/studio/accordion/accordion.tsx#L132-L138`). It does not create or enforce the Root/Item context.

**Need answered.** Consumers control composition and content, Inspektor controls visuals, and Base UI keeps trigger/panel IDs, expansion behavior, and keyboard semantics coherent.

**Breakage to watch.** A plain button in place of Base Trigger may toggle local state visually but lose Base's association and state details. A Panel outside the matching Item may lack the context it requires. Styling Panel transition from Root state assigns a local lifecycle fact to the wrong boundary.

### Select: compound parts, generic values, and a popup recipe

Select adds generic data, portal layout, and item-local state:

```/dev/null/select-map.txt#L1-18
BaseSelect.Root<Value, false>             no root DOM
├─ BaseSelect.Label
├─ BaseSelect.Trigger
│  ├─ prefix
│  ├─ BaseSelect.Value
│  ├─ suffix
│  └─ BaseSelect.Icon
└─ Select.Content                        Inspektor recipe
   └─ BaseSelect.Portal
      └─ BaseSelect.Positioner
         └─ BaseSelect.Popup
            └─ BaseSelect.List
               ├─ BaseSelect.Item<Value>
               │  ├─ BaseSelect.ItemText
               │  └─ BaseSelect.ItemIndicator
               └─ BaseSelect.Group
                  ├─ BaseSelect.GroupLabel
                  └─ BaseSelect.Item<Value>
```

**Generic Root.** Inspektor fixes multiple selection to `false` while preserving caller-selected `Value` through value, default value, items, and callback (`packages/design-system/src/studio/select/select.tsx#L20-L34`, `L112-L114`).

**Trigger.** Inspektor exposes constrained size and width, forwards `nativeButton` and `render` independently, styles Base's open/valid/disabled state, and inserts a standard icon only when one is absent (`packages/design-system/src/studio/select/select.tsx#L38-L58`, `L141-L196`). The consumer must ensure that `nativeButton` describes the final render target.

**Popup layers.** Portal, Positioner, Popup, and List remain separate direct wrappers. Positioner exposes a picked placement subset while Inspektor fixes the shared offset (`packages/design-system/src/studio/select/select.tsx#L223-L263`). `Select.Content` is an Inspektor convenience recipe that assembles those parts (`packages/design-system/src/studio/select/select.tsx#L265-L280`). It is not a Base primitive and adds no new context.

**Items.** Item preserves generic `Value`, styles selected/highlighted/disabled state, and inserts ItemText and ItemIndicator when consumers have not supplied them (`packages/design-system/src/studio/select/select.tsx#L282-L366`). The generic inner function plus `forwardRef` cast preserves call-site typing.

**Need answered.** Base UI coordinates selection, label resolution, item registration, keyboard behavior, popup state, and positioning. Inspektor supplies a smaller product vocabulary and a standard visual composition.

**Breakage to watch.** Treating `Select.Content` as the state owner misunderstands the recipe. Rendering visual rows instead of Base Items breaks registration and keyboard selection. Manually passing `selected` to Indicator duplicates Item context. Assuming Select Root renders a wrapper produces the wrong DOM model.

### ActionList: behavior primitives versus rendering utilities

ActionList is useful because there is no Base UI ActionList primitive. [[packages/design-system/src/studio/actionList/actionList.tsx#ActionList]] owns the list-level behavior and structure:

```/dev/null/action-list-map.txt#L1-9
ul                              Inspektor structure and Escape policy
└─ li / composed item           Inspektor + useRender
   ├─ selection control
   │  └─ Inspektor Checkbox     Base-backed leaf behavior
   ├─ Base Button               primary trigger
   └─ Base Button               optional trailing action
```

`ActionList.Item` derives from `useRender.ComponentProps<'li'>`, combines independent prop owners with `mergeProps`, and supplies the forwarded ref separately to `useRender` (`packages/design-system/src/studio/actionList/actionList.tsx#L26-L35`, `L114-L142`).

`useRender` supplies composition infrastructure only. It does not turn the Item into a Base collection primitive. Inspektor owns Root's Escape delegation and focus-return policy (`packages/design-system/src/studio/actionList/actionList.tsx#L76-L112`). Base Button and Inspektor Checkbox own the interactive leaves (`packages/design-system/src/studio/actionList/actionList.tsx#L144-L223`).

The checkbox, primary trigger, and trailing action are siblings, avoiding nested interactive controls. This example separates **Base behavior primitives** such as Button from **Base rendering utilities** such as `useRender` and `mergeProps`.

## Questions to ask while reading a component

Use these questions to trace ownership from the public API to the final DOM before changing a wrapper.

1. What does the consumer write, and which product intent does each prop express?
2. Is this symbol the whole widget, a direct Base part wrapper, an Inspektor-owned DOM part, or a convenience recipe?
3. Which exact `Part.Props` or intrinsic element type defines the public starting point?
4. Does Root render an element, only provide context, or create a portal branch?
5. Which state is controlled, which is uncontrolled, and who is authoritative?
6. What is the exact change callback type, including value nullability, reason, event, and cancellation details?
7. Which parts are required by the official anatomy, and which optional parts still require a specific parent context?
8. Which part owns each state fact used for styling?
9. Where does the consumer ref enter, and which physical element receives it?
10. Does `render` preserve the same semantic and ref contract?
11. If `nativeButton` exists, does it describe the final rendered tag accurately?
12. Which props are omitted, picked, reintroduced, or replaced, and what need does each restriction answer?
13. What wins when consumer props, wrapper policy, state styles, and Base behavior overlap?
14. Are handlers being overwritten by spread, deliberately sequenced, or composed with `mergeProps`?
15. Are refs kept out of `mergeProps` and supplied through a ref-merging path?
16. What DOM, roles, ARIA relationships, hidden inputs, and portal nodes result?
17. Which behavior belongs to Base UI, and which policy belongs to Inspektor?
18. What does the official anatomy and API say for this exact component?

## Common misconceptions

These corrections distinguish recurring Base UI patterns from component-specific contracts and Inspektor conventions.

| Misconception                                              | Correct model                                                                                                                          |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| "Root is the outer DOM element."                           | Root is the broad coordinator. Some Roots render DOM; others render no element.                                                        |
| "All components with Trigger and Popup work the same way." | Names recur, but roles, tags, required structure, state, and callbacks are component-specific.                                         |
| "Portal disconnects Popup from Root."                      | Portal changes DOM ancestry. React context still connects the logical tree.                                                            |
| "Object.assign creates the compound behavior."             | It only packages properties on one export. Root and parts create behavior and context.                                                 |
| "Object.assign enforces nesting."                          | TypeScript and runtime namespace packaging do not enforce the documented React tree.                                                   |
| "Part.State is local React state I should synchronize."    | It is Base-derived render state. Read it directly for styling.                                                                         |
| "Data attributes provide accessibility."                   | They are styling and inspection hooks. Roles, ARIA, semantics, and behavior provide accessibility.                                     |
| "render selects any tag safely."                           | It composes onto a target; the target must preserve compatible semantics, props, and ref behavior.                                     |
| "nativeButton selects the rendered element."               | The default tag or `render` selects the element. `nativeButton` describes whether that result is a real button.                        |
| "mergeProps merges everything."                            | It composes handlers/classes/styles and applies precedence, but it does not merge refs.                                                |
| "Omit removes runtime props."                              | `Omit` changes TypeScript only. Runtime enforcement needs destructuring, filtering, or overriding.                                     |
| "A generic Root binds every child generic."                | Root and Item are separate generic calls. Context connects runtime values; the export namespace does not create one shared type scope. |
| "useRender provides a complete behavior primitive."        | It provides rendering and composition infrastructure. Widget behavior must come from other primitives or Inspektor code.               |
| "A convenience Content part is always a Base primitive."   | Inspektor Content may only assemble Portal, Positioner, Popup, and List. Read the implementation.                                      |

## Failure modes

These failures break typing, state ownership, composition, element identity, or accessible behavior.

| Failure                                                | Result                                                                      | Safer approach                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Deriving Trigger props from Root or generic HTML props | Part-specific behavior, state, event, or render typing disappears.          | Derive from the exact rendered `Part.Props`.                             |
| Handwriting a simplified change callback               | Reason, cancellation, event details, or nullability are lost.               | Use indexed access into exact Base props.                                |
| Duplicating open, selected, or highlighted state       | Wrapper and Base UI become competing authorities.                           | Use controlled props for ownership and `Part.State` for derived visuals. |
| Treating a `default*` prop as reactive                 | Mounted uncontrolled state does not follow changes to its initial default.  | Choose controlled mode when external updates must be authoritative.      |
| Moving Base props and ref onto different elements      | Focus, measurement, ARIA, and event behavior split.                         | Keep the complete contract on the behavior-owning element.               |
| Using plain spread for independent handler sources     | One handler silently replaces another.                                      | Use deliberate manual sequencing or `mergeProps`.                        |
| Putting refs in `mergeProps`                           | Only one ref remains.                                                       | Supply refs separately through Base UI or `useRender`.                   |
| Reversing `mergeProps` order                           | Precedence and handler suppression direction change.                        | Document owners and place the intended winner rightmost.                 |
| Function render drops supplied props                   | Base handlers, ARIA, state attributes, and ref disappear.                   | Spread or correctly merge the supplied props onto the primary element.   |
| Custom render component does not forward its ref       | Base focus, measurement, and consumer ref access can fail.                  | Forward the ref to the same underlying element receiving Base props.     |
| `nativeButton` disagrees with final tag                | Native or emulated button semantics are wrong.                              | Make the flag describe the actual render target.                         |
| Replacing a required Base part with visual DOM         | Context registration, keyboard behavior, IDs, or focus logic vanish.        | Keep the Base part and place presentation inside it.                     |
| Treating optional as context-free                      | Arrow, Indicator, or Label is present under the wrong owner.                | Follow the exact anatomy even for optional parts.                        |
| Relying on `Omit` for runtime filtering                | Untyped props can still pass through.                                       | Destructure, filter, or explicitly overwrite sensitive keys.             |
| Broad generic `forwardRef` cast                        | Public types claim a value/ref contract the body does not implement.        | Keep inner function and cast adjacent and structurally identical.        |
| Mistaking a recipe for a primitive                     | State or accessibility is assigned to a function that only assembles parts. | Expand the recipe and identify the actual Base owners.                   |
| Nesting ActionList controls                            | Interactive elements become invalidly nested and hard to operate.           | Keep checkbox, primary action, and trailing action as siblings.          |

## Wrapper-review checklist

Use this checklist to verify a wrapper's upstream contract, public API, ownership, rendering, and resulting DOM.

- [ ] Identify the exact Base UI version and read the component's official anatomy and API.
- [ ] Classify each public member as a direct Base wrapper, Inspektor DOM part, or convenience recipe.
- [ ] Confirm whether Root renders DOM, only provides context, or coordinates a portal subtree.
- [ ] Derive public props from the exact `Part.Props`, intrinsic props, or `useRender.ComponentProps<Tag>`.
- [ ] Explain every `Omit` and `Pick` as a styling, semantic, mode, structure, or geometry decision.
- [ ] Use indexed access for reintroduced Base callbacks and behavioral props.
- [ ] Keep controlled value, default value, and change callback consistent with one state owner.
- [ ] Preserve complete event details and component-specific reason unions.
- [ ] Use the `Part.State` belonging to the part that owns each visual fact.
- [ ] Preserve documented public `data-*` attributes without treating them as ARIA.
- [ ] Trace the consumer ref through `forwardRef` to the primary behavior element.
- [ ] Use `ComponentRef<typeof Part>` when the Base declaration should define the target.
- [ ] Review custom `render` targets for compatible semantics, prop forwarding, and ref forwarding.
- [ ] Confirm that `nativeButton` describes the final tag; do not use it as an element selector.
- [ ] Keep refs out of `mergeProps`; use the renderer's ref path.
- [ ] Record prop precedence across destructuring, JSX spreads, explicit props, state styles, and Base's internal merge.
- [ ] Use `mergeProps` only when its right-to-left handler order and rightmost precedence match the intended ownership.
- [ ] Preserve required part containment and narrow contexts such as Positioner/Arrow, Group/Label, and Item/Indicator.
- [ ] Keep Base behavior on Base parts and Inspektor presentation inside those boundaries.
- [ ] Verify that generic Root, values, callbacks, Item props, ref target, inner function, and cast remain aligned.
- [ ] Treat `Object.assign` as API packaging only, not context or nesting enforcement.
- [ ] Expand convenience parts into their real subtree before assigning ownership.
- [ ] Inspect final DOM semantics, roles, labels, IDs, hidden inputs, focus behavior, and portal placement.
- [ ] Test controlled and uncontrolled use, keyboard and pointer interaction, disabled state, refs, custom render, forms, and accessible names relevant to the exact component.

## Sources

The sources combine official Base UI documentation, pinned upstream code, and the local Inspektor implementations discussed above.

### Official Base UI documentation

These pages define Base UI's public component anatomy, composition, styling, forms, accessibility, and rendering utilities.

- [Base UI v1.6.0 release notes](https://base-ui.com/react/overview/releases/v1-6-0.md)
- [Base UI component documentation index](https://base-ui.com/llms.txt)
- [Composition handbook](https://base-ui.com/react/handbook/composition)
- [Customization handbook](https://base-ui.com/react/handbook/customization)
- [Styling handbook](https://base-ui.com/react/handbook/styling)
- [Forms handbook](https://base-ui.com/react/handbook/forms)
- [Accessibility overview](https://base-ui.com/react/overview/accessibility)
- [`useRender` utility](https://base-ui.com/react/utils/use-render)
- [`mergeProps` utility](https://base-ui.com/react/utils/merge-props)
- [Button anatomy and API](https://base-ui.com/react/components/button)
- [Accordion anatomy and API](https://base-ui.com/react/components/accordion)
- [Select anatomy and API](https://base-ui.com/react/components/select)
- [Dialog anatomy and API](https://base-ui.com/react/components/dialog)
- [Menu anatomy and API](https://base-ui.com/react/components/menu)
- [Checkbox anatomy and API](https://base-ui.com/react/components/checkbox)

### Official Base UI v1.6.0 source

These pinned source files support implementation details that the public API pages do not fully expose.

- [Button](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx) and [button behavior](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/use-button/useButton.ts)
- [Accordion Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/accordion/root/AccordionRoot.tsx) and [Accordion Trigger](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/accordion/trigger/AccordionTrigger.tsx)
- [Select Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/root/SelectRoot.tsx), [Trigger](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/trigger/SelectTrigger.tsx), [Item](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/item/SelectItem.tsx), [Value](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/value/SelectValue.tsx), and [Item Indicator](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/item-indicator/SelectItemIndicator.tsx)
- [Dialog Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/root/DialogRoot.tsx), [Trigger](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/trigger/DialogTrigger.tsx), [Portal](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/portal/DialogPortal.tsx), [Backdrop](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/backdrop/DialogBackdrop.tsx), and [Popup](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/popup/DialogPopup.tsx)
- [Menu Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/root/MenuRoot.tsx), [Positioner](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/positioner/MenuPositioner.tsx), [Popup](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/popup/MenuPopup.tsx), [Arrow](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/arrow/MenuArrow.tsx), [Group](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/group/MenuGroup.tsx), and [Group Label](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/group-label/MenuGroupLabel.tsx)
- [`useRender`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/use-render/useRender.ts) and [renderer](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/useRenderElement.ts)
- [`mergeProps`](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/merge-props/mergeProps.ts)
- [Component event details](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/createBaseUIEventDetails.ts)
- [State attribute mapping](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/getStateAttributesProps.ts)

### Local Inspektor source map

These repository-root-relative paths map each local claim to its implementation or installed declaration.

| Local path and lines                                                                    | Evidence                                                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/design-system/src/studio/button/button.tsx#L23-L69`                           | Exact Base Button props, omissions, indexed access, semantic props, discriminated union.    |
| `packages/design-system/src/studio/button/button.tsx#L71-L108`                          | `forwardRef`, loading translation, and `BaseButton.State`.                                  |
| `packages/design-system/src/studio/button/button.tsx#L110-L140`                         | Prop precedence, Base element boundary, and Inspektor content.                              |
| `packages/design-system/src/studio/accordion/accordion.tsx#L8-L61`                      | Exact per-part props, omissions, controlled values, and selective `render`.                 |
| `packages/design-system/src/studio/accordion/accordion.tsx#L63-L130`                    | Per-part refs, Base boundaries, Trigger state, Panel transition state, and visual children. |
| `packages/design-system/src/studio/accordion/accordion.tsx#L132-L138`                   | Compound API packaging with `Object.assign`.                                                |
| `packages/design-system/src/studio/select/select.tsx#L9-L109`                           | Generic public types, `Omit`, `Pick`, indexed access, and constrained popup contracts.      |
| `packages/design-system/src/studio/select/select.tsx#L112-L221`                         | Generic non-DOM Root, `ComponentRef`, Trigger state, Value, and Icon.                       |
| `packages/design-system/src/studio/select/select.tsx#L223-L280`                         | Portal, Positioner, Popup, List, and Inspektor Content recipe.                              |
| `packages/design-system/src/studio/select/select.tsx#L282-L366`                         | Generic Item, `Part.State`, standard children, `forwardRef` cast, and Indicator.            |
| `packages/design-system/src/studio/select/select.tsx#L368-L405`                         | Group, GroupLabel, remaining parts, and compound export.                                    |
| `packages/design-system/src/studio/actionList/actionList.tsx#L18-L74`                   | Native list props, `useRender.ComponentProps`, and Base Button leaf props.                  |
| `packages/design-system/src/studio/actionList/actionList.tsx#L76-L142`                  | Inspektor Escape policy, `useRender`, `mergeProps`, and separate ref path.                  |
| `packages/design-system/src/studio/actionList/actionList.tsx#L144-L231`                 | Checkbox/Button leaves, sibling interactive controls, and compound export.                  |
| `packages/design-system/src/primitives/createStateStyleProps.ts#L3-L13`                 | Adapter from `Part.State` to Base-compatible StyleX callbacks.                              |
| `packages/design-system/node_modules/@base-ui/react/button/Button.d.ts#L9-L26`          | Installed Button ref, Props, and State declarations.                                        |
| `packages/design-system/node_modules/@base-ui/react/use-render/useRender.d.ts#L10-L70`  | Installed `useRender` parameters, component props, state, and ref declarations.             |
| `packages/design-system/node_modules/@base-ui/react/merge-props/mergeProps.d.ts#L6-L38` | Installed merge order and explicit statement that refs are not merged.                      |
