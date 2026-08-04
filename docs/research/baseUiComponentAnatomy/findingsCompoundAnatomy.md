# Base UI v1.6.0 compound component anatomy

## Table of contents

- [Scope](#scope)
- [Core mental model](#core-mental-model)
- [Recurring part roles](#recurring-part-roles)
- [Context relationships](#context-relationships)
- [Why these boundaries exist](#why-these-boundaries-exist)
- [How to read an unfamiliar component](#how-to-read-an-unfamiliar-component)
- [Sources](#sources)

## Scope

This note describes recurring public roles in `@base-ui/react` v1.6.0. Part names are conventions, not universal DOM contracts. For example, popup-family `Root` parts usually coordinate state without rendering HTML, while `Checkbox.Root` is the control itself. Always confirm the exact component's anatomy and API.

The clearest representative families are:

- Dialog: modal state, focus, portal, backdrop, and popup lifecycle.
- Menu: anchored layout, composite keyboard navigation, items, groups, and labels.
- Select: value state, trigger semantics, options, groups, and selection indicators.
- Checkbox: a control whose indicator has conditional presence and transition state.

## Core mental model

A compound component is one behavior split into public parts because no single DOM element can satisfy all of its responsibilities.

```/dev/null/base-ui-compound-anatomy.txt#L1-11
Root: owns the shared behavior and state
  Trigger: starts or exposes the behavior
  Portal: chooses the DOM layer and presence boundary
    Backdrop: renders the visual layer behind the surface
    Positioner: computes anchored geometry
      Popup: owns the interactive surface and its semantics
        Arrow: reflects anchor geometry
        Group -> Label: creates a named semantic subset
        Item -> Indicator: creates an option and reflects its local state
  Value: projects shared selection state into visible text
```

React context preserves this logical tree even when `Portal` moves descendants elsewhere in the DOM. Smaller nested contexts narrow the relationship further: `Positioner` supplies geometry to `Popup` and `Arrow`; `Group` accepts registration from its `Label`; `Item` supplies selection state to its `Indicator`.

## Recurring part roles

| Part | Public role | Relationship | Need answered |
| --- | --- | --- | --- |
| `Root` | Coordinates the compound component. Popup and selection roots commonly own controlled/uncontrolled state, callbacks, stores, refs, and interaction logic without rendering HTML. | Provides the broad context consumed by sibling and descendant parts. Nested roots can also establish parent-child popup relationships. | One source of truth for open/value state, keyboard navigation, dismissal, focus return, form integration, and lifecycle. |
| `Trigger` | The user-facing control that opens or toggles a popup. It is normally a button, but Select uses button markup with `role="combobox"`. | Reads and updates Root state; registers its element and identity; links itself to the popup. Dialog Trigger sets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`. | Correct activation, keyboard/button behavior, focus restoration target, and ARIA relationship between control and popup. |
| `Portal` | Moves popup content to another DOM container, normally `body`. It may remain mounted while hidden. | Reads Root's mounted state while keeping React context available to descendants. `keepMounted` separates DOM presence from visible open state. | Escape clipping and local stacking contexts; choose an overlay host; coordinate mounting with exit animation or measurement. |
| `Positioner` | Computes and applies the geometry between an anchor and a floating surface. | Reads Root's active trigger and open state, then provides side, alignment, arrow refs/styles, collision results, and nesting data to Popup and Arrow. | Anchoring, offsets, collision avoidance, flipping/shifting, viewport constraints, RTL-aware sides, and nested-menu placement. |
| `Popup` | The actual interactive surface: dialog contents, menu items, or selectable options. | Reads Root behavior and, for anchored components, Positioner geometry. It receives the popup role/IDs, focus manager, interaction props, open state, and transition state. | Accessible popup semantics, focus entry/return or trapping, dismissal coordination, event boundaries, content styling, and enter/exit animation. |
| `Backdrop` | A separately styleable overlay beneath a popup. | Reflects Root open/transition/nesting state and is usually a Portal sibling of the surface. | Independent viewport coverage and animation. It should not be treated as the sole modality mechanism: tagged Dialog and Menu source also uses internal backdrops/focus management for interaction blocking. |
| `Arrow` | A visual pointer between an anchored popup and its anchor. | Consumes Positioner geometry and Root open state; Base UI marks it `aria-hidden`. | Keep decorative geometry synchronized with side, alignment, collision shifts, and an arrow that cannot remain centered. |
| `Item` | One actionable or selectable member of a composite collection. | Registers with Root's collection, receives an index, participates in roving focus/typeahead, and exposes local disabled/highlighted/selected state. Select Item provides a narrower context to its Indicator. | Option/menu semantics, keyboard movement, typeahead, disabled handling, activation, selection, and close-on-activation policy. |
| `Group` | Wraps related items as a semantic subset. | Creates a local context for a label ID. In Menu v1.6.0 it renders `role="group"` with `aria-labelledby`. | Communicate related choices or actions as a named set without making the visual wrapper responsible for label wiring. |
| `Label` / `GroupLabel` | Supplies the accessible name for a control or group. | Registers its generated ID with the nearest labelable Root or Group; that owner applies the corresponding labeling relationship. | Keep label text freely placeable and styleable while preserving `label`, `aria-labelledby`, or equivalent association. |
| `Indicator` | Visualizes checked or selected state inside a control or item. | Consumes the nearest Root or Item context rather than accepting duplicate state. It may unmount when inactive or remain for animation/layout stability. | Prevent state drift; keep decorative state out of the accessible name; support conditional presence and exit transitions. Select Item Indicator is `aria-hidden`. |
| `Value` | Renders the current selection or placeholder, with optional custom formatting. | Reads value, item metadata, and label conversion from Select Root; it does not own selection. | Project model state into concise trigger text, including placeholders, custom value objects, and multiple selection. |

## Context relationships

### Root context is the behavior bus

`Root` centralizes the state that must agree across distant parts. In Menu v1.6.0, the root coordinates open state, active trigger, dismissal, list navigation, typeahead, popup props, item props, and nested menu identity. In Select, it additionally coordinates value, form state, item registration, selected index, and hidden form inputs.

This is why parts are not interchangeable loose elements. Most parts must appear under the matching Root. Dialog and Menu support explicit handles for detached triggers, but that is an intentional alternate connection, not an absence of context.

### Portal changes DOM ancestry, not ownership

The trigger can remain in page layout while the popup is appended under `body`. React context still connects both to the same Root. This lets DOM placement solve clipping and stacking without duplicating open state or manually locating elements.

### Positioner creates a geometry sub-context

`Positioner` is between Portal and Popup because its wrapper receives computed placement styles while its descendants consume placement facts. `Arrow` needs the positioner's arrow ref and coordinates; `Popup` needs side/alignment for state attributes, animation origin, and styling. Keeping geometry out of Popup also permits a viewport or scrolling layer inside the positioned shell.

### Group and Item create narrow local contexts

Menu Group does not ask consumers to manually copy an ID into `aria-labelledby`. Group Label registers its generated ID with the nearest Group, which applies the relationship. Similarly, Select Item Indicator reads `selected` from its nearest Item. These narrow contexts make invalid or stale duplicated state harder to create.

### State and presence are different

Base UI distinguishes `open` or `selected` from whether an element remains mounted. Portal, Popup, Backdrop, and Indicator expose lifecycle boundaries because exit animation and measurement need DOM presence after the logical state changes. Transition state attributes let styling follow that lifecycle without moving animation ownership into Root.

## Why these boundaries exist

### Accessibility

- Trigger and Popup need different roles, focus behavior, and ARIA attributes, but they must share IDs and state.
- Root can coordinate WAI-ARIA keyboard behavior and focus without dictating visual markup.
- Group/Label pairs create accessible naming relationships automatically.
- Item owns the interactive option/action semantics; Indicator and Arrow remain visual reflections rather than duplicate controls.
- Base UI handles many roles, ARIA attributes, pointer interactions, keyboard navigation, and focus transitions, while the product still owns meaningful label text and visible focus styling.

### Layout

- Portal selects the DOM layer.
- Positioner owns floating geometry and collision logic.
- Popup owns surface dimensions and content styling.
- Backdrop owns viewport coverage.
- Arrow owns anchor-point decoration.

Splitting these lets each layer use the CSS positioning model it needs without coupling content semantics to overlay geometry.

### Lifecycle

- Root owns logical state and change reasons.
- Portal decides whether the subtree exists.
- Popup and Backdrop expose transition status for surface-level animation.
- Indicator can remain mounted through an exit transition.

This separation supports `keepMounted`, measurement, deferred unmounting, and completion callbacks without pretending that closed, hidden, exiting, and unmounted are the same state.

### Composition

Each DOM-bearing part is a targeted styling and `render` boundary. Base UI's `render` prop can replace the default element or compose another component, provided that component forwards its ref and spreads received props. This preserves Base UI's event handlers, ARIA attributes, state attributes, and element registration while allowing product-specific markup.

The boundary is deliberately smaller than "replace the whole widget": consumers can customize a trigger, item, or popup without rebuilding the shared interaction model.

## How to read an unfamiliar component

1. Start with the documented anatomy. It shows required containment and which parts are optional.
2. Find the state owner. Check whether Root renders DOM or only provides behavior.
3. Follow contexts outward: Root to Trigger/Portal, Positioner to Popup/Arrow, Group to Label, and Item to Indicator.
4. Identify semantic elements and roles. A visual name such as Popup does not by itself reveal `dialog`, `menu`, `listbox`, or `combobox` behavior.
5. Separate layout from semantics. Portal answers "where in the DOM?"; Positioner answers "where on screen?"; Popup answers "what interactive surface is this?"
6. Separate logical state from presence. Look for `keepMounted`, transition state, hidden/inert behavior, and completion callbacks.
7. When using `render`, preserve the supplied ref and props. Replacing markup without them disconnects the part from its context-owned behavior.

## Sources

Official Base UI documentation:

- [Base UI v1.6.0 release notes](https://base-ui.com/react/overview/releases/v1-6-0.md)
- [Component documentation index](https://base-ui.com/llms.txt)
- [Composition handbook](https://base-ui.com/react/handbook/composition.md)
- [Accessibility overview](https://base-ui.com/react/overview/accessibility.md)
- [Dialog anatomy and API](https://base-ui.com/react/components/dialog.md)
- [Menu anatomy and API](https://base-ui.com/react/components/menu.md)
- [Select anatomy and API](https://base-ui.com/react/components/select.md)
- [Checkbox anatomy and API](https://base-ui.com/react/components/checkbox.md)
- [Field label API](https://base-ui.com/react/components/field.md)

Official v1.6.0 tagged source:

- [Dialog Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/root/DialogRoot.tsx), [Trigger](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/trigger/DialogTrigger.tsx), [Portal](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/portal/DialogPortal.tsx), and [Popup](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/dialog/popup/DialogPopup.tsx)
- [Menu Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/root/MenuRoot.tsx), [Portal](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/portal/MenuPortal.tsx), [Positioner](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/positioner/MenuPositioner.tsx), [Popup](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/popup/MenuPopup.tsx), and [Arrow](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/arrow/MenuArrow.tsx)
- [Menu Item](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/item/MenuItem.tsx), [Group](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/group/MenuGroup.tsx), and [Group Label](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/menu/group-label/MenuGroupLabel.tsx)
- [Select Root](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/root/SelectRoot.tsx), [Trigger](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/trigger/SelectTrigger.tsx), [Item](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/item/SelectItem.tsx), [Value](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/value/SelectValue.tsx), and [Item Indicator](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/select/item-indicator/SelectItemIndicator.tsx)
- [Checkbox Indicator](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/checkbox/indicator/CheckboxIndicator.tsx)
