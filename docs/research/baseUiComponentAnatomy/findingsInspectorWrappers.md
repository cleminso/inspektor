# Inspector Base UI wrapper anatomy

## Table of contents

- [Conclusion](#conclusion)
- [The five-layer mental model](#the-five-layer-mental-model)
- [Compound-part role map](#compound-part-role-map)
- [TypeScript patterns](#typescript-patterns)
  - [`Part.Props`](#partprops)
  - [`Part.State` and state styles](#partstate-and-state-styles)
  - [`Omit`, `Pick`, indexed access, and constrained APIs](#omit-pick-indexed-access-and-constrained-apis)
  - [`ComponentRef` and `forwardRef`](#componentref-and-forwardref)
  - [Generic roots and generic `forwardRef` casts](#generic-roots-and-generic-forwardref-casts)
  - [`Object.assign`](#objectassign)
- [Render and DOM patterns](#render-and-dom-patterns)
  - [Prop spread order](#prop-spread-order)
  - [`render`, `useRender`, and `mergeProps`](#render-userender-and-mergeprops)
  - [DOM composition](#dom-composition)
- [Representative walkthroughs](#representative-walkthroughs)
  - [Button](#button)
  - [Accordion](#accordion)
  - [Select](#select)
  - [ActionList](#actionlist)
- [Contrasts from Menu and Combobox](#contrasts-from-menu-and-combobox)
- [Base UI versus Inspector responsibilities](#base-ui-versus-inspektor-responsibilities)
- [Pattern-to-need map](#pattern-to-need-map)
- [Failure modes](#failure-modes)
- [Wrapper-reading checklist](#wrapper-reading-checklist)
- [Local source map](#local-source-map)

## Conclusion

Inspector's wrappers are typed adapters, not restyled copies of Base UI components.

```/dev/null/inspektor-wrapper-layers.txt#L1-6
consumer JSX
  -> Inspector public prop contract
  -> Inspector defaults, structure, and StyleX policy
  -> Base UI part props and context
  -> Base UI behavior, accessibility, state, and render composition
  -> concrete DOM, handlers, attributes, refs, and portals
```

Each recurring pattern answers one boundary question:

- `Part.Props`: what native and behavioral contract does this exact Base UI part accept?
- `Part.State`: what state has Base UI already derived for render-time styling?
- `Omit` and `Pick`: which upstream capabilities should Inspector consumers be able to express?
- `Part.Props['key']`: how can Inspector expose one upstream capability without copying its type?
- `ComponentRef<typeof Part>`: what instance does the exact imported part expose through `ref`?
- `forwardRef`: how does that ref cross the Inspector component boundary?
- A generic inner function plus cast: how does `Value` survive React's non-generic `forwardRef` result?
- State-based `className` and `style`: how does StyleX react to Base UI state while styling stays private?
- `Object.assign`: how does one callable root become the namespace for related parts?
- Prop ordering: which layer wins where consumer input and Inspector policy overlap?
- `useRender`: how does an Inspector-owned element support Base UI's composition model?
- `mergeProps`: how do multiple prop owners preserve handlers, classes, and styles?

Base UI owns widget behavior. Inspector owns the supported product API and visual grammar. ActionList marks the boundary clearly: no Base UI ActionList primitive is involved, so Inspector owns list structure and Escape handling; Base utilities provide render composition, while Base Button and Inspector Checkbox provide leaf behavior.

## The five-layer mental model

Read a wrapper from its public boundary toward the DOM.

1. **Consumer API.** Exported Inspector types define what product code may say. They inherit useful Base and DOM contracts, remove escape hatches, narrow broad options, add semantic variants, and document defaults. Public exports are visible at `packages/design-system/src/index.ts:2-18`, `50-82`, `124-131`, `227-251`, and `291-310`.
2. **Wrapper policy.** Destructuring chooses defaults and separates Inspector-owned props from pass-through props. Button translates `loading` into disabled behavior (`button.tsx:71-108`). Select fixes Root to single selection (`select.tsx:20-34`).
3. **Presentation.** StyleX rules are selected from semantic props and Base state. Inspector may own child markup such as Button content (`buttonVisuals.tsx:98-166`), Accordion's chevron (`accordion.tsx:96-119`), and Select's standard icon/indicator (`select.tsx:141-221`, `288-366`).
4. **Base UI behavior.** The exact Base part coordinates context, controlled state, keyboard and pointer behavior, focus, ARIA, native-element behavior, portal positioning, and `render` composition.
5. **DOM.** A root may render an element, render nothing, or establish a portal branch. A convenience part may expand into several Base parts. The export namespace is not a DOM map.

## Compound-part role map

| Role                 | Base UI owns                                                                                                                      | Inspector owns                                                        | Evidence                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Root`               | Shared context and controlled/uncontrolled state. Select and Combobox Root render no element; Accordion Root renders a container. | Modes, defaults, and public root vocabulary.                          | `accordion.tsx:63-77`; `select.tsx:112-114`; `combobox.tsx:213-229`  |
| `Item`               | Context registration and derived open/selected/highlighted/disabled state.                                                        | Typed value, size/variant, state visuals, and standard internals.     | `accordion.tsx:79-85`; `select.tsx:288-325`; `combobox.tsx:599-620`  |
| `Header` / `Label`   | Semantic association and IDs.                                                                                                     | Typography and supported composition.                                 | `accordion.tsx:87-94`; `select.tsx:116-124`                          |
| `Trigger`            | Open/close behavior, button semantics, focus, and state.                                                                          | Visual treatment and adornment DOM.                                   | `accordion.tsx:96-119`; `select.tsx:141-196`; `combobox.tsx:296-367` |
| `Portal`             | Portal placement and mount coordination.                                                                                          | Supported mount options.                                              | `select.tsx:223-227`; `menu.tsx:173-178`                             |
| `Positioner`         | Measurement, collision, side/alignment, and anchor state.                                                                         | Restricted placement props and shared offset.                         | `select.tsx:64-67`, `229-245`; `menu.tsx:39-42`, `180-194`           |
| `Popup`              | Popup/focus semantics and transition state.                                                                                       | Surface, width, and transition styles.                                | `select.tsx:247-256`; `menu.tsx:196-208`                             |
| `List`               | Listbox/menu and collection semantics.                                                                                            | Scroll and spacing treatment.                                         | `select.tsx:258-263`; `combobox.tsx:574-582`                         |
| `Value` / `ItemText` | Label resolution and semantic item text.                                                                                          | Placeholder/truncation styles and standard insertion.                 | `select.tsx:198-205`, `307-335`                                      |
| `Indicator` / `Icon` | Part-context state and conditional mounting.                                                                                      | Standard SVG and de-duplication.                                      | `select.tsx:207-221`, `339-366`                                      |
| `Content`            | No separate Base part in these wrappers.                                                                                          | A recipe composed from Portal, Positioner, Popup, and sometimes List. | `select.tsx:265-280`; `menu.tsx:210-221`                             |

Role names are architectural hints, not universal DOM guarantees. `Select.Content` is an Inspector recipe; `Select.Popup` directly wraps Base UI. `Object.assign` groups both under one API without changing their ownership.

## TypeScript patterns

### `Part.Props`

Base UI combines a runtime component value with a type namespace. In type positions, `BaseButton.Props`, `BaseAccordion.Trigger.Props`, and `BaseSelect.Root.Props<Value, false>` name upstream contracts. In JSX, those same symbols are renderable values. Namespace members are erased from JavaScript.

`Part.Props` carries:

1. props for the part's default native element;
2. behavior props such as `disabled`, controlled values, callbacks, `render`, and `nativeButton`;
3. Base styling hooks, including state-capable `className` and `style`.

Inspector derives from the **exact rendered part** so native events, ARIA props, callback details, state callbacks, and render typing stay aligned:

- Button: `button.tsx:23-26`.
- Accordion's five parts: `accordion.tsx:12-61`.
- Select's generic Root and popup parts: `select.tsx:20-109`.
- ActionList Trigger/Action use Base Button, but Item uses `useRender.ComponentProps<'li'>` because there is no Base ActionList part: `actionList.tsx:26-35`, `51-74`.

### `Part.State` and state styles

`Part.State` is state Base UI supplies to `className`, `style`, and functional `render` callbacks. It is not wrapper `useState`, an imperative API, or necessarily the public controlled value.

Examples:

- Button reads Base's resolved `disabled`: `button.tsx:94-108`.
- Accordion Trigger reads `open` and `disabled`; Panel reads `transitionStatus`: `accordion.tsx:100-127`.
- Select Trigger reads `open`, `valid`, and `disabled`; Item reads `selected`, `highlighted`, and `disabled`: `select.tsx:158-165`, `300-306`.
- Combobox List reads `empty`: `combobox.tsx:574-580`.

`createStateStyleProps<State>` turns one StyleX selector into Base-compatible state callbacks for both `className` and `style` (`createStateStyleProps.ts:3-13`). This lets Base own state transitions while Inspector owns their visual meaning. Static parts can use `stylex.props` directly, as Select List does (`select.tsx:258-263`).

The part type documents which node knows which fact. Popup transitions belong on Popup; item highlight belongs on Item. Duplicating those facts in ancestor React state would reproduce Base's state machine.

The selector should be pure and inexpensive because class and style are separate callbacks. Local selectors meet that condition: they read wrapper props and Base state, then return StyleX objects.

### `Omit`, `Pick`, indexed access, and constrained APIs

#### `Omit`

Local `WithoutStyles<Props>` aliases remove `className`, `style`, and often `render` (`accordion.tsx:8`; `select.tsx:9`; `menu.tsx:12`; `combobox.tsx:19`). Removing `render` in the helper allows intentional reintroduction only, as Accordion Header and Trigger do (`accordion.tsx:37-52`).

Button removes `focusableWhenDisabled`, `nativeButton`, and Base's `prefix` in addition to styling props (`button.tsx:23-26`): Inspector owns loading focus behavior, constrains custom rendering to native-button composition, and owns prefix DOM.

Select Root pins `Multiple` to `false` and omits `multiple` (`select.tsx:20-34`). Select Item replaces Base's broad value with `value: Value` (`select.tsx:83-97`).

`Omit` is compile-time API shaping, not runtime sanitization. Runtime guarantees require destructuring, explicit trailing props, or filtering:

- Button explicitly supplies disabled/loading policy and state styles after `...props`: `button.tsx:110-129`.
- ActionList filters `className` and `style`: `actionList.tsx:97-100`, `130-132`.
- Accordion omits `orientation` from the type, but an untyped runtime `orientation` would remain in `...props`: `accordion.tsx:12-15`, `63-75`.

#### `Pick`

Select Positioner exposes only `align`, `alignItemWithTrigger`, `children`, `ref`, and `side` (`select.tsx:64-67`). Menu and Combobox follow the same approach (`menu.tsx:39-42`; `combobox.tsx:125-128`). Inspector supplies the side offset (`select.tsx:229-242`; `popupPositioning.ts:1-4`). Consumers can choose semantic placement without inventing geometry.

#### Indexed access

`disabled?: BaseButton.Props['disabled']` and `render?: BaseButton.Props['render']` preserve exact upstream types while allowing Inspector JSDoc (`button.tsx:37-40`). Select uses the same technique for callbacks and placement (`select.tsx:24-31`, `72-81`). This preserves event-detail arguments and nullability without copying signatures.

#### Constrained unions

Button maps `variant`, `size`, `justify`, and `radius` through `satisfies Record<Union, ...>` (`buttonVisuals.tsx:9-51`). Select does so for size and width (`select.tsx:11-18`, `126-129`, `282-286`). The union rejects arbitrary values; the exhaustive record rejects missing implementations.

Button's discriminated union makes accessibility and layout constraints explicit: `iconOnly: true` requires `aria-label` and rejects prefix, suffix, full width, and justify (`button.tsx:43-69`; `button.test.tsx:25-33`).

### `ComponentRef` and `forwardRef`

A wrapper blocks refs unless it explicitly forwards them. `forwardRef<RefTarget, PublicProps>` makes the external ref legal and supplies it to the render function; the implementation must still put it on the behavior-owning Base part.

- Button: `button.tsx:71-90`, `110-119`.
- Every Accordion DOM part: `accordion.tsx:63-130`.
- Select trigger and popup parts: `select.tsx:116-263`, `288-366`.

Two local typing strategies appear:

- Explicit targets such as `HTMLDivElement`, `HTMLSpanElement`, and Base Button's broad `HTMLElement` when the wrapper has a fixed/known contract.
- `ComponentRef<typeof BasePart>` when the imported declaration should be authoritative. Select Trigger uses it at `select.tsx:141`; Select Item at `select.tsx:298`, `327-330`; Combobox uses it throughout `combobox.tsx:231-233`, `279`, `296-298`, `385-436`.

`ComponentRef` tracks the component's declared ref, not every possible element a `render` target might produce. Polymorphic composition still requires compatibility review.

Menu Trigger illustrates a narrow bridge: its external target uses `ComponentRef<typeof BaseMenu.Trigger>`, while JSX asserts the ref to `BaseMenu.Trigger.Props['ref']` (`menu.tsx:149-165`). Such assertions should remain adjacent to the mismatch.

Refs are separate from prop merging. Base `mergeProps` does not merge refs. `useRender` receives `ref` separately and can combine it with a render element's ref; ActionList does this at `actionList.tsx:134-141`.

### Generic roots and generic `forwardRef` casts

Select and Combobox need caller-selected `Value` types.

A root that renders no element can remain a plain generic function. `SelectRoot<Value>` preserves inference from `items`, values, and callbacks (`select.tsx:20-34`, `112-114`). The type test verifies `Value | null | undefined`, not an array (`select.test.tsx:23-30`). Combobox follows the same pattern (`combobox.tsx:21-65`, `213-229`).

A generic Item must also forward a ref. React's ordinary `forwardRef` result cannot preserve the render function's free call-site generic. Select therefore:

1. defines `SelectItemInner<Value>` with typed props and ref (`select.tsx:288-299`);
2. passes it to `forwardRef` for runtime ref behavior;
3. asserts a generic callable signature with `RefAttributes` (`select.tsx:327-330`).

The cast restores type information; it adds no runtime behavior. Its validity depends on the inner function, prop type, and ref target remaining aligned. Combobox uses the same pattern (`combobox.tsx:599-620`).

`Object.assign` does not bind `Select.Root`'s generic to every `Select.Item` child. Root and Item infer separate generic calls; Base context links their values at runtime. The wrappers replace upstream `any` on each public surface, but compound JSX is not one shared type-level generic scope.

### `Object.assign`

Accordion packages one root callable and related parts (`accordion.tsx:132-138`):

```packages/design-system/src/components/accordion/accordion.tsx#L132-138
export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Header: AccordionHeader,
  Item: AccordionItem,
  Panel: AccordionPanel,
  Trigger: AccordionTrigger,
})
```

Consumers can use `<Accordion>` or `<Accordion.Root>` and discover related parts under one symbol. Select, Menu, Combobox, and ActionList do the same (`select.tsx:388-405`; `menu.tsx:397-419`; `combobox.tsx:663-688`; `actionList.tsx:225-231`).

`Object.assign` does not create context, enforce nesting, render DOM, bind generics, or turn an Inspector recipe into a Base primitive. It is API packaging.

## Render and DOM patterns

### Prop spread order

JSX spread is ordinary last-write-wins assignment; it does not combine duplicate handlers, classes, or style objects.

```/dev/null/wrapper-prop-order.tsx#L1-8
<BasePart
  {...props}
  ref={forwardedRef}
  constrainedProp={resolvedValue}
  {...stateStyleProps}
  data-slot="..."
/>
```

This common order means:

1. pass through unowned native and Base props;
2. let Inspector's resolved values replace conflicts;
3. let private state styles replace untyped runtime `className`/`style`;
4. establish trailing Inspector metadata.

Examples: Button `button.tsx:110-129`; Accordion Root `accordion.tsx:69-75`; Select Trigger `select.tsx:169-180`; Select Positioner `select.tsx:234-242`.

Destructuring is part of precedence: once `size`, `disabled`, or `render` leaves the rest object, the wrapper forwards one resolved value.

Variations are deliberate:

- Combobox InputTrigger puts its default `aria-label` before `...props`, so accepted ARIA input can replace it, but its trailing `render` is fixed (`combobox.tsx:296-317`).
- Combobox InputGroup replaces capture handlers after `...props`, manually invokes consumer handlers, and observes prevention flags (`combobox.tsx:247-275`).
- ActionList Root replaces `onKeyDown` and invokes the consumer handler inside its own ordered control flow (`actionList.tsx:76-112`).

Base UI performs another merge inside the primitive between wrapper-supplied element props and Base behavior props. Wrapper spread order and Base's inner behavior merge are separate stages.

### `render`, `useRender`, and `mergeProps`

#### Base part `render`

A direct wrapper preserves `render` when consumers need to compose behavior onto another compatible component. Button types and forwards it (`button.tsx:39-40`, `110-119`); its test proves Inspector's `type` reaches the custom target (`button.test.tsx:71-80`). Base supplies required props, state, state attributes, and merged refs.

`nativeButton` tells Base whether the replacement remains a native button; it does not choose the element. Inspector hides it on Button, exposes it where button/link composition is supported, and forces it where necessary (`button.tsx:23-40`; `select.tsx:38-58`, `83-97`; `actionList.tsx:51-74`, `175-223`).

#### `useRender`

ActionList Item is Inspector-owned but must accept ContextMenu behavior composed onto it. `useRender.ComponentProps<'li'>` gives native list-item props, ref typing, and `render` (`actionList.tsx:26-35`). The implementation supplies default tag, render target, forwarded ref, and merged props (`actionList.tsx:114-142`).

`useRender` is rendering infrastructure, not a complete widget. It does not provide list selection, roving focus, or Escape handling. Inspector owns those.

Combobox PopupHeader, PopupFooter, and Viewport also use `useRender`, but their public props omit `render` and the hook receives no custom target (`combobox.tsx:148-166`, `457-507`). An internal rendering tool does not require exposing polymorphism.

#### `mergeProps`

Object spread loses duplicate handlers, classes, and styles. `mergeProps` uses semantic rules:

- ordinary props: rightmost wins;
- handlers: composed, rightmost first, with Base's prevention mechanism;
- `className`: concatenated;
- `style`: merged, rightmost values win;
- `ref`: not merged.

ActionList Item combines defaults, filtered consumer DOM props, and a final slot prop (`actionList.tsx:118-141`). The final object protects `data-slot` against `domProps`; other ordinary defaults can be replaced. Ref is supplied separately to `useRender`.

When `render` is a React element, Base's renderer performs another merge with that element's own props. Its ordinary props can win; handlers/classes/styles/refs follow the utility rules. Removing direct `className` and `style` does not mean a custom render component has no presentation.

Menu Shortcut is a compact example using `useRender` and `mergeProps` with an exposed `render` target (`menu.tsx:86-89`, `271-284`).

### DOM composition

Keep the behavior-owning Base element and required compound boundaries intact; place Inspector presentation inside those boundaries.

#### Button

```/dev/null/button-dom-map.txt#L1-7
BaseButton interactive node
└─ ButtonContent (Inspector)
   ├─ icon-only span, or
   └─ content span
      ├─ optional prefix / leading group
      ├─ consumer label
      └─ optional suffix
```

Evidence: `button.tsx:110-140`; `buttonVisuals.tsx:98-166`.

#### Accordion

```/dev/null/accordion-dom-map.txt#L1-9
BaseAccordion.Root
└─ BaseAccordion.Item
   ├─ BaseAccordion.Header
   │  └─ BaseAccordion.Trigger
   │     ├─ Inspector label + chevron
   │     └─ optional suffix
   └─ BaseAccordion.Panel
      └─ consumer content
```

Base preserves registration and Trigger/Panel association; Inspector adds no competing button or heading (`accordion.tsx:63-130`).

#### Select

```/dev/null/select-dom-map.txt#L1-17
BaseSelect.Root                         no root DOM
├─ BaseSelect.Label
├─ BaseSelect.Trigger
│  ├─ optional Inspector prefix
│  ├─ BaseSelect.Value / consumer content
│  ├─ optional Inspector suffix
│  └─ BaseSelect.Icon + owned SVG unless supplied
└─ BaseSelect.Portal
   └─ BaseSelect.Positioner
      └─ BaseSelect.Popup
         └─ BaseSelect.List
            ├─ BaseSelect.Item
            │  ├─ BaseSelect.ItemText unless supplied
            │  └─ BaseSelect.ItemIndicator unless supplied
            ├─ BaseSelect.Group / GroupLabel
            └─ Base separator
```

`Select.Content` builds the portal branch (`select.tsx:265-280`). Fragment-aware `hasChild` avoids duplicate icon/text/indicator parts (`select.tsx:131-139`, `167-193`, `307-323`).

#### ActionList

```/dev/null/action-list-dom-map.txt#L1-7
ul (Inspector)
└─ li or composed target (Inspector useRender)
   ├─ optional presentation span
   │  └─ Inspector Checkbox
   ├─ Base Button primary trigger
   └─ optional Base Button trailing action
```

Checkbox and buttons are siblings, avoiding nested interactive elements (`actionList.tsx:144-223`; `actionList.test.tsx:45-72`).

## Representative walkthroughs

### Button

Button is the single-part model.

- **Public contract:** inherit Base Button, remove styling and low-level behavior knobs, add semantic variants/loading, and enforce icon-only accessibility (`button.tsx:23-69`).
- **Ref:** `forwardRef<HTMLElement, ButtonProps>` reaches the Base Button (`button.tsx:71-90`, `110-119`).
- **Behavior translation:** `disabled || loading` becomes Base's disabled state; loading also controls focusability and `aria-busy` (`button.tsx:91-128`). Base blocks interaction; Inspector decides what loading means. The test verifies that boundary (`button.test.tsx:35-53`).
- **State styling:** Base's disabled state combines with semantic props and ButtonGroup context (`button.tsx:91-108`). Exhaustive lookup records implement the constrained API (`buttonVisuals.tsx:9-96`).
- **DOM:** Inspector always supplies ButtonContent, but Base remains the interactive/custom-render node (`button.tsx:129-140`; `buttonVisuals.tsx:98-166`).

### Accordion

Accordion shows why each compound part needs its own contract.

- Root specializes values to `string | number`, removes orientation, and exposes value arrays (`accordion.tsx:10-28`).
- Item requires one value. Header and Trigger selectively restore `render`. Trigger replaces broad children with required visible content plus suffix. Panel exposes mount behavior (`accordion.tsx:30-61`).
- Every DOM part forwards a ref to its matching Base part (`accordion.tsx:63-130`).
- Trigger styles open/disabled; Panel styles transition phases. Each callback uses the state type of the part that owns the fact (`accordion.tsx:100-127`).
- Inspector owns chevron and suffix DOM while preserving Base Header -> Trigger and Item -> Panel structure (`accordion.tsx:96-130`). Base emits the interaction and `aria-expanded`; the test verifies toggling (`accordion.test.tsx:9-27`).
- `Object.assign` provides discoverable syntax without extra DOM (`accordion.tsx:132-138`).

### Select

Select combines generic data and popup composition.

- **Generic Root:** `BaseSelect.Root.Props<Value, false>` fixes single selection; a plain generic function preserves inference and needs no element ref because Base Root renders no DOM (`select.tsx:20-34`, `112-114`).
- **Trigger:** Inspector replaces broad sizing/prefix choices with constrained size, width, prefix, suffix, and a compatibility full-width prop (`select.tsx:38-58`). Base state drives open/valid/disabled styles (`select.tsx:141-165`). Inspector inserts the standard icon only when absent (`select.tsx:166-193`).
- **Popup:** Portal, Positioner, Popup, and List stay separately available. Positioner props are picked and side offset stays internal. Content assembles the standard path (`select.tsx:223-280`).
- **Generic Item:** replace Base's untyped value, add constrained size, style Base selected/highlighted/disabled state, and use an inner generic plus cast to preserve value/ref typing (`select.tsx:83-97`, `288-330`).
- **Owned subparts:** plain children are wrapped with Base ItemText and receive Base ItemIndicator. Fragment-aware detection prevents duplicates (`select.tsx:307-366`; `select.test.tsx:172-241`).

### ActionList

ActionList separates a rendering utility from a behavior primitive.

- **Root:** derives from native `ul`, removes styles, adds Escape delegation, renders a raw list, and owns focus restoration (`actionList.tsx:18-24`, `76-112`). Tests cover delegation, prevention, and focus return (`actionList.test.tsx:113-164`).
- **Item:** derives from `useRender.ComponentProps<'li'>`, builds default styles/data/children, filters styling props at runtime, combines owners with `mergeProps`, and passes render/ref separately (`actionList.tsx:26-35`, `114-142`). ContextMenu composition preserves item semantics (`actionList.test.tsx:74-91`).
- **Interactive leaves:** SelectionControl uses Checkbox; Trigger and Action use Base Button. Primary selection/action controls remain separate siblings (`actionList.tsx:144-223`).
- **Merge choice:** Item needs general semantic merging, so it uses `mergeProps`; Root needs ordered product control flow, so its handler manually calls the consumer callback.

## Contrasts from Menu and Combobox

Menu mixes ownership kinds in one namespace:

- direct Base wrappers: Trigger, Positioner, Popup, Item, CheckboxItem, RadioItem;
- Inspector Content recipe: `menu.tsx:210-221`;
- Inspector presentation parts: Shortcut, Prefix, Suffix at `menu.tsx:271-284`, `379-395`;
- Base-state styling for open, highlighted, checked, disabled, and transitions: `menu.tsx:149-208`, `223-377`.

The member name does not reveal ownership; the implementation body does. Menu also chooses product defaults: action Item closes by default, while CheckboxItem and RadioItem do not (`menu.tsx:223-244`, `286-335`). Base executes close behavior; Inspector selects defaults.

Combobox exposes two presentations over the same Base Trigger (`combobox.tsx:83-108`, `296-367`):

- InputTrigger is an icon action in an input group with an owned accessible label and chevron render callback.
- Trigger is a standalone ghost-button presentation using shared Button visuals.

Behavior is not duplicated; both delegate open/close semantics to Base Trigger.

Combobox InputGroup combines Base validity/disabled state with local descendant focus-visible state (`combobox.tsx:231-275`). Its capture handlers call consumer handlers and respect standard/Base prevention before changing local presentation state. Base owns combobox behavior; Inspector owns the group-focus visual concept.

Combobox PopupHeader, PopupFooter, and Viewport use `useRender` and `mergeProps` internally while omitting public `render` (`combobox.tsx:148-166`, `457-507`). Implementation machinery and public capability are separate decisions.

## Base UI versus Inspektor responsibilities

| Concern             | Base UI                                                                                                   | Inspector                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| State mechanics     | Controlled/uncontrolled state, update details, context, item registration.                                | Public modes, defaults, and translation of product concepts such as loading.             |
| Accessibility       | Roles, ARIA relationships, form controls, disabled/read-only semantics, focus, keyboard/pointer behavior. | Required labels in public types, default names for owned icon actions, safe composition. |
| Derived state       | `open`, `selected`, `highlighted`, `disabled`, `valid`, `placeholder`, transition status.                 | Visual meaning of those fields and presentation-only local state.                        |
| Behavior node       | Default element, internal handlers, refs, state attributes, custom `render`.                              | Whether `render`/`nativeButton` are public and what owned children appear.               |
| Popup               | Portal, measurement, collision, placement, focus, mount, transition state.                                | Allowed placement, shared offsets, widths, surfaces, and standard composition.           |
| Styling             | State callback extension points; primitives are unstyled.                                                 | Tokens, StyleX, variants, sizes, state visuals, data slots.                              |
| Compound API        | Runtime contexts and required Base relationships.                                                         | Export namespace, aliases, recipes, presentation parts, documentation.                   |
| Product composition | Leaf primitives/utilities that Inspector invokes.                                                         | ActionList structure, Escape delegation, and focus-return policy.                        |

A practical test: if a concern requires widget interaction state or ARIA mechanics, prefer the Base part or exposed state/props. If it requires Inspector tokens, supported variants, standard child markup, or product composition, it belongs in the wrapper.

## Pattern-to-need map

| Pattern                         | Need answered                                                   | Example                                                  |
| ------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| `BasePart.Props`                | Reuse exact native, event, ARIA, and behavior typing.           | `button.tsx:23-26`; `accordion.tsx:12-61`                |
| `BasePart.State`                | Style from authoritative derived behavior state.                | `accordion.tsx:100-127`; `select.tsx:158-165`, `300-306` |
| `Props['key']`                  | Expose one upstream capability exactly.                         | `button.tsx:37-40`; `select.tsx:24-31`                   |
| `Omit`                          | Remove style escapes, unsafe modes, or owned content decisions. | `button.tsx:23-26`; `select.tsx:20-23`, `38-41`, `83-86` |
| `Pick`                          | Publish a safe subset of a broad low-level API.                 | `select.tsx:64-67`; `menu.tsx:39-42`                     |
| Discriminated union             | Reject invalid accessibility/layout combinations.               | `button.tsx:43-69`                                       |
| Union + `satisfies Record`      | Couple public semantic values to exhaustive styles.             | `buttonVisuals.tsx:9-51`; `select.tsx:11-18`             |
| `ComponentRef<typeof Part>`     | Derive the exact component ref target.                          | `select.tsx:141`, `298`, `327-330`                       |
| `forwardRef`                    | Carry a consumer ref to the behavior element.                   | `button.tsx:71-90`, `110-119`                            |
| Generic plain Root              | Preserve `Value` inference without an element ref.              | `select.tsx:112-114`                                     |
| Generic inner + cast            | Restore a call-site generic erased by `forwardRef`.             | `select.tsx:288-330`                                     |
| `createStateStyleProps<State>`  | Adapt StyleX selection to Base class/style callbacks.           | `createStateStyleProps.ts:3-13`                          |
| `Object.assign`                 | Package callable root and compound members.                     | `accordion.tsx:132-138`                                  |
| `...props` first, policy after  | Make wrapper defaults/invariants win.                           | `button.tsx:110-129`                                     |
| Base `render`                   | Compose behavior onto a compatible target.                      | `button.tsx:39-40`, `110-119`                            |
| `useRender.ComponentProps<Tag>` | Type native props plus composition for Inspector DOM.           | `actionList.tsx:26-35`                                   |
| `useRender`                     | Render default/composed Inspector element with merged refs.     | `actionList.tsx:114-142`                                 |
| `mergeProps<Tag>`               | Preserve handlers, classes, and styles from many owners.        | `actionList.tsx:118-141`                                 |
| Inspector `Content`             | Encode a safe common popup subtree.                             | `select.tsx:265-280`                                     |

## Failure modes

1. **Wrong prop source.** A Trigger wrapper derived from Root or generic button props loses part-specific state and render typing. Derive from the exact rendered part.
2. **Copied callbacks.** A handwritten `(value) => void` loses Base event details or nullability. Prefer indexed access.
3. **Duplicated Base state.** Local `open`/`selected` state used only for styling reproduces the primitive. Prefer `Part.State`.
4. **Type-only omission.** `Omit` cannot stop untyped runtime keys. Destructure, filter, or explicitly override when runtime enforcement matters.
5. **Guessed refs.** An explicit element may disagree with Base's declaration. Consider `ComponentRef`; review polymorphic `render` compatibility.
6. **Broad generic cast.** A cast that differs from the inner function can drop value or ref safety. Keep it adjacent and exact; add type tests.
7. **Lossy JSX spread.** Duplicate handlers/classes/styles are overwritten. Use manual ordered control flow or `mergeProps` according to the need.
8. **Refs inside `mergeProps`.** The utility does not merge refs. Supply refs through Base or `useRender`.
9. **Unclear `nativeButton`.** Rendering a non-button while Base assumes a native button breaks semantics. Fix or expose the contract deliberately.
10. **Plain DOM replacing a Base part.** Replacing Trigger, Item, Popup, or List can lose context, ARIA, focus, or keyboard behavior. Put presentation inside the Base boundary.
11. **Recipe mistaken for primitive.** `Select.Content` only expands other parts. Read the body rather than inferring behavior from its name.
12. **Namespace mistaken for enforcement.** `Object.assign` does not enforce nesting or share Root's generic with Item.
13. **Nested interactive controls.** Keep ActionList's checkbox, primary trigger, and trailing action as siblings.
14. **DOM discovery for Base state.** Use part state instead of querying attributes. DOM lookup is reserved for Inspector behavior with no shared state API, such as ActionList focus return.

## Wrapper-reading checklist

1. Locate the value and public types in `packages/design-system/src/index.ts`.
2. Classify every member as a direct Base wrapper, Inspector DOM part, or convenience recipe.
3. Determine whether its Base root/part renders DOM, no element, or a portal.
4. Find the exact `Part.Props`, intrinsic props, or `useRender.ComponentProps<Tag>` source.
5. Explain every `Omit` and `Pick`: styling, semantics, fixed mode, owned children, or geometry.
6. Check reintroduced props and prefer indexed access for Base callbacks/behavior.
7. Follow `Value` through Root values, callbacks, Item, inner function, and cast.
8. Follow the external ref through `forwardRef` to Base or `useRender`; inspect assertions.
9. List each `Part.State` field read and verify that part owns it.
10. Record `...props`, explicit props, state styles, data attributes, and render-target precedence.
11. Distinguish JSX replacement, manual handler calls, `mergeProps`, and Base's inner merge.
12. Expand JSX into real DOM, including portals, SVG/spans, and sibling controls.
13. Assign state, ARIA, focus, positioning, styling, and standard markup to Base or Inspector.
14. Read tests for type constraints, controlled state, disabled semantics, render composition, associations, and de-duplication.
15. Decide whether a type restriction also needs runtime enforcement.

## Local source map

Paths are relative to `/Users/clem/projects/inspektor`.

### Inspector sources

| File and lines                                                                       | Evidence                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `packages/design-system/src/components/button/button.tsx:23-69`                      | Base prop derivation, omissions, semantic props, discriminated union. |
| `packages/design-system/src/components/button/button.tsx:71-108`                     | `forwardRef`, defaults, loading translation, state styling.           |
| `packages/design-system/src/components/button/button.tsx:110-140`                    | Prop order, Base boundary, metadata, content DOM.                     |
| `packages/design-system/src/components/button/buttonVisuals.tsx:9-96`                | Unions, exhaustive style records, visual-state selection.             |
| `packages/design-system/src/components/button/buttonVisuals.tsx:98-166`              | Inspector label/icon/spinner DOM.                                     |
| `packages/design-system/src/components/accordion/accordion.tsx:8-61`                 | Per-part props and selective `render`.                                |
| `packages/design-system/src/components/accordion/accordion.tsx:63-94`                | Root/Item/Header refs and state style plumbing.                       |
| `packages/design-system/src/components/accordion/accordion.tsx:96-130`               | Trigger/Panel state and trigger internals.                            |
| `packages/design-system/src/components/accordion/accordion.tsx:132-138`              | Compound export.                                                      |
| `packages/design-system/src/components/select/select.tsx:9-109`                      | Generic public types, omissions, picks, popup contracts.              |
| `packages/design-system/src/components/select/select.tsx:112-139`                    | Generic Root, Label state, exhaustive map, child detection.           |
| `packages/design-system/src/components/select/select.tsx:141-221`                    | `ComponentRef`, Trigger state/order, Value, Icon.                     |
| `packages/design-system/src/components/select/select.tsx:223-280`                    | Portal, Positioner, Popup, List, Content recipe.                      |
| `packages/design-system/src/components/select/select.tsx:282-330`                    | Generic Item, state, standard children, cast.                         |
| `packages/design-system/src/components/select/select.tsx:332-405`                    | Remaining parts and compound export.                                  |
| `packages/design-system/src/components/actionList/actionList.tsx:16-74`              | Native, `useRender`, Button, Checkbox public types.                   |
| `packages/design-system/src/components/actionList/actionList.tsx:76-112`             | List root, filtering, Escape/focus policy.                            |
| `packages/design-system/src/components/actionList/actionList.tsx:114-142`            | `useRender`, `mergeProps`, render target, ref.                        |
| `packages/design-system/src/components/actionList/actionList.tsx:144-231`            | Interactive leaves and compound export.                               |
| `packages/design-system/src/components/menu/menu.tsx:12-143`                         | Compound prop shaping and presentation props.                         |
| `packages/design-system/src/components/menu/menu.tsx:145-221`                        | Root through Popup and Content recipe.                                |
| `packages/design-system/src/components/menu/menu.tsx:223-350`                        | Action/choice state and defaults.                                     |
| `packages/design-system/src/components/menu/menu.tsx:356-419`                        | Submenu, presentation parts, export.                                  |
| `packages/design-system/src/components/combobox/combobox.tsx:19-211`                 | Generic and popup/presentation public types.                          |
| `packages/design-system/src/components/combobox/combobox.tsx:213-318`                | Generic Root, refs, focus state, manual event composition.            |
| `packages/design-system/src/components/combobox/combobox.tsx:320-455`                | Alternate Trigger and popup recipe.                                   |
| `packages/design-system/src/components/combobox/combobox.tsx:457-507`                | Plain parts using `useRender`/`mergeProps`.                           |
| `packages/design-system/src/components/combobox/combobox.tsx:599-620`                | Generic Item cast.                                                    |
| `packages/design-system/src/components/combobox/combobox.tsx:663-688`                | Compound export.                                                      |
| `packages/design-system/src/primitives/createStateStyleProps.ts:3-13`                | StyleX/Base state adapter.                                            |
| `packages/design-system/src/primitives/popupPositioning.ts:1-4`                      | Shared offset policy.                                                 |
| `packages/design-system/src/index.ts:2-18`, `50-82`, `124-131`, `227-251`, `291-310` | Public values and types.                                              |

### Contract tests

| File and lines                                                                    | Evidence                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------- |
| `packages/design-system/src/components/button/button.test.tsx:9-33`               | Icon-only accessibility/type constraints.   |
| `packages/design-system/src/components/button/button.test.tsx:35-53`              | Loading translated to disabled semantics.   |
| `packages/design-system/src/components/button/button.test.tsx:71-80`              | Custom render propagation.                  |
| `packages/design-system/src/components/accordion/accordion.test.tsx:9-27`         | Trigger/Panel behavior.                     |
| `packages/design-system/src/components/select/select.test.tsx:23-30`              | Generic single-value preservation.          |
| `packages/design-system/src/components/select/select.test.tsx:32-139`             | State, disabled behavior, associations.     |
| `packages/design-system/src/components/select/select.test.tsx:172-241`            | Owned-part de-duplication.                  |
| `packages/design-system/src/components/actionList/actionList.test.tsx:31-111`     | Separate controls and render composition.   |
| `packages/design-system/src/components/actionList/actionList.test.tsx:113-164`    | Escape/focus contract.                      |
| `packages/design-system/src/components/combobox/combobox.test.tsx:9-26`, `55-112` | Roles, live regions, groups, focus visuals. |

### Installed Base UI evidence

These are installed dependency files, not Inspector-authored source.

| File and lines                                                                                      | Evidence                                                                 |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/design-system/node_modules/@base-ui/react/internals/types.d.ts:18-57`                     | `BaseUIComponentProps`, state styles, `render`, native-button contracts. |
| `packages/design-system/node_modules/@base-ui/react/button/Button.d.ts:9-26`                        | Button ref and Props/State namespace.                                    |
| `packages/design-system/node_modules/@base-ui/react/select/root/SelectRoot.d.ts:11-14`, `129-155`   | Generic Root values and namespace aliases.                               |
| `packages/design-system/node_modules/@base-ui/react/select/item/SelectItem.d.ts:9-46`               | Item ref/state and broad upstream value.                                 |
| `packages/design-system/node_modules/@base-ui/react/combobox/root/ComboboxRoot.d.ts:9-17`, `50-101` | Generic Combobox Root contract.                                          |
| `packages/design-system/node_modules/@base-ui/react/accordion/root/AccordionRoot.d.ts:11-103`       | Generic Root state and props.                                            |
| `packages/design-system/node_modules/@base-ui/react/accordion/trigger/AccordionTrigger.d.ts:10-16`  | Trigger ref and state.                                                   |
| `packages/design-system/node_modules/@base-ui/react/use-render/useRender.d.ts:10-70`                | Render parameters, component props, state, and ref types.                |
| `packages/design-system/node_modules/@base-ui/react/merge-props/mergeProps.d.ts:5-38`               | Merge order and non-merging of refs.                                     |
| `packages/design-system/node_modules/@base-ui/react/internals/useRenderElement.js:28-95`, `104-176` | State/ref/render-element merging and default tag rendering.              |
| `packages/design-system/node_modules/@base-ui/react/button/Button.js:18-43`                         | Base Button state, behavior hook, refs, internal props.                  |
