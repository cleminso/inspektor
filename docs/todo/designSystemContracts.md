# Design-system component contract audit

## Table of contents

- [Scope and method](#scope-and-method)
- [Implemented foundation](#implemented-foundation)
- [Component audit](#component-audit)
- [Base UI capability inventory](#base-ui-capability-inventory)
- [Intentional constraints](#intentional-constraints)
- [Open product work](#open-product-work)
- [Work outside the contract scope](#work-outside-the-contract-scope)
- [Settled decisions](#settled-decisions)
- [Validation checklist](#validation-checklist)

## Scope and method

[03/08/26]

- Audited all 40 directories under `packages/design-system/src/components`.
- Compared Base UI wrappers with installed `@base-ui/react@1.6.0`, official component documentation, installed declarations, and installed source.
- Traced public props, fixed and transformed props, refs, `render`, events, generated ARIA, controlled state, state attributes, transitions, CSS variables, StyleX ownership, exports, tests, and documentation metadata.
- Classified native and composed components as high-level Inspektor compositions when they intentionally do not mirror an underlying primitive.
- Kept popup offsets and collision geometry internal because `menuFamily.md` already records that constraint.

## Implemented foundation

[01/09/26]

- [x] Add Shell Layout as a high-level native and Resizable Panel composition with optional left and right docks.
- [x] Keep Shell Layout persistence storage consumer-owned while centralizing dock resize, collapse, restore, gutter, and surface behavior.

[05/08/26]

- [x] Share form-control size ownership between Input and Select Trigger while preserving their consumer-facing type names.
- [x] Split Select Trigger size from Select Item row size so identical literals do not imply identical geometry.
- [x] Keep Combobox trigger size policy explicit and derive Context Switcher forwarding types from Combobox's public trigger types.
- [x] Keep component-specific size types separate when identical literals describe different physical domains.

[05/08/26]

- [x] Remove Multi Select query ownership so its high-level Popover composition owns selection and two-column option keyboard behavior only.

[03/08/26]

- [x] Preserve refs through React 18-compatible `forwardRef` boundaries for rendered wrapper parts.
- [x] Restore exact Base UI `render` contracts on approved behavioral and semantic endpoints.
- [x] Hide structural `render` contracts that had no approved semantic substitution.
- [x] Keep `className`, `style`, and arbitrary positioning geometry outside public APIs.
- [x] Preserve Base UI event details and cancellation instead of reducing callbacks.
- [x] Preserve native props and refs on Action List structural parts and Side Panel parts.
- [x] Fix Button type forwarding through composed render targets.
- [x] Fix Checkbox group-derived indeterminate icon state.
- [x] Fix Input Group invalid propagation and effective Input size metadata.
- [x] Fix disabled Multi Select keyboard activation and merge its trigger ref.
- [x] Fix Tab View state after canceled user changes and automatic fallback changes.
- [x] Fix returned Toast IDs so `toasts.dismiss()` accepts them.
- [x] Fix Tooltip instant transitions and logical arrow placement in RTL.
- [x] Replace `Box.unsafeClassName` and manual scrollbar props with the automatic scroll-container recipe.
- [x] Extend prop extraction to direct and compound `forwardRef` exports.
- [x] Preserve explicit `null` and instantiated generic aliases in generated prop metadata.
- [x] Add Box component documentation and align changed component prop selections.
- [x] Align Data Grid registry navigation with its generated route.

[04/08/26]

- [x] Give every finite Base UI-generated state and data attribute a named StyleX rule in each wrapper callback, including empty rules for intentionally unstyled capabilities.
- [x] Keep empty capability rules internal so Base UI remains the source of DOM attributes and consumers do not gain styling escape hatches.
- [x] Require the same attribute-rule inventory in the `create-inspector-component` workflow.

## Component audit

[03/08/26]

| Component              | Ownership and part classification                                                            | Audit outcome                                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion              | Base Root provider; Item and Panel structural; Header semantic; Trigger behavioral           | Base props remain open by default, Header and Trigger expose approved `render`, refs reach each rendered part, and panel transitions remain Base-owned.                                               |
| ActionList             | Inspektor list composition with native Root and Item plus Base Button and Checkbox endpoints | Native list props and refs are preserved, styling is closed, and Button composition supports native buttons and non-native link targets through `nativeButton`.                                       |
| BinaryValue            | Inspektor value presentation and high-level details composition                              | Narrow data and callback contract is intentional; no primitive surface is partially exposed.                                                                                                          |
| Box                    | Inspektor polymorphic native layout primitive                                                | Native props and selected-element refs are preserved, styling is token-constrained, and the former arbitrary class escape hatch is removed.                                                           |
| Button                 | Base Button behavioral endpoint                                                              | Base behavior, event details, state, `render`, and ref are preserved; Inspektor owns content anatomy and visual variants.                                                                             |
| ButtonGroup            | Inspektor group composition                                                                  | Root composition remains explicit; Text and Separator are fixed structural parts; group and separator semantics cannot be contradicted.                                                               |
| ButtonLink             | Inspektor anchor endpoint using `useRender`                                                  | Native anchor props, handler merging, link semantics, and refs are preserved while presentation stays closed.                                                                                         |
| Checkbox               | Base Root behavioral endpoint with fixed Indicator anatomy and native Label                  | Root and input behavior remain Base-owned, group-derived indeterminate state selects the correct icon, and Root and Label refs are preserved.                                                         |
| CodeEditor             | High-level Inspektor composition over CodeMirror with textarea fallback                      | Narrow value, accessibility, and loading contract is intentional; CodeMirror remains an internal implementation boundary.                                                                             |
| Combobox               | Base compound component                                                                      | Behavioral endpoints expose approved `render`; structural parts remain fixed; semantic positioning stays public while raw offsets and collision geometry remain internal.                             |
| ContextMenu            | Base Context Menu compound component                                                         | Trigger and action endpoints preserve composition and refs; structural popup parts remain fixed; Content ref targets Popup.                                                                           |
| ContextSwitcher        | High-level Combobox composition                                                              | Query ownership, trigger anatomy, search, content, and footer constraints are intentional and delegated to the audited Combobox parts.                                                                |
| CopyButton             | High-level Button and Tooltip composition                                                    | Clipboard behavior and feedback are package-owned; Button and Tooltip behavior remains delegated.                                                                                                     |
| DataGrid               | High-level Inspektor table composition over TanStack Table                                   | Semantic target callbacks and constrained anatomy are intentional rather than a partial native wrapper surface. Keyboard-model work is recorded separately.                                           |
| Field                  | Base Field compound component                                                                | Root keeps Base validation defaults and a concrete design-system structural composition point; semantic Label, Description, and Error retain approved composition.                                    |
| Fieldset               | Base Fieldset compound component                                                             | Root and Legend preserve refs and generated labeling; Root state styling uses the typed adapter; structural Root composition is closed.                                                               |
| Icon                   | High-level decorative icon composition                                                       | Fixed `aria-hidden` behavior and constrained sizing are intentional; accessible icons require a separately named semantic component if needed.                                                        |
| Input                  | Base Input behavioral endpoint                                                               | Base value events, Field integration, render composition, and ref are preserved; Inspektor size, variant, grouped state, and invalid state are explicit transformations.                              |
| InputGroup             | High-level compound input composition                                                        | Root context owns group size, disabled, invalid, and focus-visible state; Action preserves Base Button events and composition; Checkbox remains a fixed high-level part.                              |
| JsonView               | High-level Inspektor tree widget                                                             | Data, expansion, bounded rendering, keyboard behavior, and accessibility metadata are package-owned rather than a wrapped primitive contract.                                                         |
| KeyboardInput          | High-level native `kbd` presentation                                                         | Shortcut data is intentionally constrained; arbitrary DOM and styling props remain unavailable.                                                                                                       |
| Menu                   | Base Menu compound component                                                                 | Trigger and Submenu Trigger preserve approved composition; item semantics use dedicated Item and LinkItem parts; popup geometry remains constrained.                                                  |
| MultiSelect            | High-level Popover composition                                                               | Open state remains Base-owned; selection, filtering, and option keyboard behavior are Inspektor-owned; trigger refs and disabled option behavior are preserved.                                       |
| RelationValue          | High-level value and details composition                                                     | Navigation and copy capabilities are constrained to product semantics; unresolved pending and missing presentation is recorded separately.                                                            |
| ResizablePanel         | `react-resizable-panels` wrapper                                                             | Group, Panel, and Handle preserve imperative refs and callbacks while Inspektor owns defaults and handle anatomy. Upstream focus callback behavior is recorded separately.                            |
| ShellLayout            | High-level native and Resizable Panel composition                                            | Root owns shared dock controls and structural regions; Body fixes horizontal resizing; optional docks own collapse, restore, handles, and shell surfaces; persistence storage remains consumer-owned. |
| Find Bar               | High-level Input Group composition                                                           | Query options, match status, and navigation are fixed; document search results remain consumer-owned.                                                                                                 |
| Select                 | Base Select compound component                                                               | Trigger and Item preserve approved composition and refs; structural parts remain fixed; popup geometry remains constrained to semantic placement.                                                     |
| SidePanel              | Inspektor native compound layout                                                             | Aside and div props, ARIA, events, and refs are preserved while layout styling remains package-owned.                                                                                                 |
| Spinner                | High-level SVG status presentation                                                           | Decorative and labeled status modes are explicit; no arbitrary SVG styling surface is exposed.                                                                                                        |
| StructuredValuePreview | High-level bounded value presentation                                                        | Discriminated preview models and typed marker behavior are intentional package semantics.                                                                                                             |
| Switch                 | Base Switch behavioral endpoint with fixed Thumb                                             | Root behavior, forms, controlled state, event details, `render`, input ref, and root ref remain Base-owned.                                                                                           |
| WorkspaceTabs          | High-level Base Tabs composition                                                             | Base owns tab selection, keyboard behavior, ARIA, and panel state; Inspektor owns fixed edge areas, tab anatomy, close behavior, horizontal overflow, and deferred reorder behavior.                  |
| Text                   | Inspektor polymorphic native text primitive                                                  | Native props and refs follow the selected tag; semantic variants and formatting remain constrained; heading utility selection is fixed.                                                               |
| Textarea               | Base Field Control fixed to native textarea semantics                                        | Textarea-native props and ref are public, Base value event details and Field state are preserved, and element substitution remains closed.                                                            |
| TextField              | High-level Field and Input composition                                                       | Field owns validation state; Input behavior remains delegated; inner Input `render` is intentionally hidden.                                                                                          |
| TextLink               | Inspektor anchor endpoint using `useRender`                                                  | Native anchor props, composed handlers, semantic variants, and refs are preserved; package-owned slot metadata is authoritative.                                                                      |
| TimestampValue         | High-level time presentation                                                                 | Number and Date normalization plus valid and invalid semantic elements are intentional; locale ownership is recorded separately.                                                                      |
| Toaster                | High-level Base Toast composition and manager facade                                         | Base owns focus, timing, swipe, portal, and live-region behavior; Inspektor owns statuses, copy, action shape, and manager normalization.                                                             |
| ToggleGroup            | Base Toggle Group and Toggle endpoints                                                       | Root state and Item event details are preserved; Item exposes approved composition; structural Root composition remains closed.                                                                       |
| Tooltip                | Base Tooltip with high-level Content composition                                             | Root exposes the supported single-trigger contract, Trigger preserves composition and refs, default trigger presentation is reset, and popup geometry and artwork remain fixed.                       |

## Base UI capability inventory

[03/08/26]

| Wrapper family                   | State and generated attributes                                                                                                                                                                                               | Transitions and CSS variables                                                                                                         | Classification                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Accordion                        | Root: value, disabled, orientation. Item/Header/Trigger: open, disabled, hidden, index, orientation.                                                                                                                         | Panel transition status; `--accordion-panel-height`, `--accordion-panel-width`.                                                       | Open and disabled states are styled where relevant; index, orientation, hidden, and unused width are preserved and intentionally unstyled. |
| Button and Button-backed actions | Disabled and `data-disabled`.                                                                                                                                                                                                | None.                                                                                                                                 | Disabled is styled; event and native-button behavior remain Base-owned.                                                                    |
| Checkbox                         | Checked, unchecked, indeterminate, disabled, read-only, required, valid, invalid, touched, dirty, filled, focused.                                                                                                           | Indicator transition start and end; no CSS variables.                                                                                 | Selection, invalid, disabled, and read-only are styled; remaining Field attributes are preserved and intentionally unstyled.               |
| Combobox                         | Input family: open, disabled, read-only, side, empty, placeholder, and Field states. Positioner/Popup: open, side, align, anchor hidden, empty. Clear: visible, disabled, transition. Item: selected, highlighted, disabled. | Popup, Clear, and Indicator transitions. Positioner variables: anchor width and height, available width and height, transform origin. | Visual states used by Inspektor are styled; other Base attributes and variables remain available without parallel React state.             |
| Context Menu and Menu            | Trigger: open, pressed, disabled. Positioner/Popup: open, side, align, anchor hidden, nested, instant. Items: highlighted, disabled, checked or open.                                                                        | Popup and indicator transitions. Positioner variables: anchor dimensions, available dimensions, transform origin.                     | Item states and popup transitions are styled; structural positioning state remains observable and otherwise unstyled.                      |
| Field and Fieldset               | Disabled, touched, dirty, valid, invalid, filled, focused.                                                                                                                                                                   | Field Error transition status; no CSS variables.                                                                                      | Invalid and disabled states are styled; remaining validation lifecycle attributes are preserved.                                           |
| Input and Textarea               | Disabled, touched, dirty, valid, invalid, filled, focused.                                                                                                                                                                   | None.                                                                                                                                 | Disabled and invalid are styled; other Field attributes are preserved.                                                                     |
| Multi Select internal Popover    | Trigger open and disabled. Positioner/Popup open, side, align, anchor hidden, instant, and transition status.                                                                                                                | Anchor, available-space, positioner, popup, and transform-origin variables.                                                           | Base Popover owns lifecycle and focus; Inspektor consumes only required layout and transition capabilities.                                |
| Select                           | Label Field states. Trigger open, read-only, side, value, placeholder, and Field states. Positioner/Popup open, side, align, anchor hidden, and transition. Item selected, highlighted, disabled.                            | Popup and Indicator transitions. Positioner variables: anchor dimensions, available dimensions, transform origin.                     | Inspektor styles the selected interaction states and preserves the remaining generated contract.                                           |
| Switch                           | Checked, unchecked, disabled, read-only, required, valid, invalid, touched, dirty, filled, focused on Root and Thumb.                                                                                                        | None.                                                                                                                                 | Checked, disabled, read-only, and invalid are styled; remaining Field attributes are preserved.                                            |
| Workspace Tabs internal Tabs     | Orientation and activation direction on Root/List; active and disabled on Tab; hidden, index, and transition on Panel.                                                                                                       | Panel transition status; Indicator variables are unreachable because Indicator is not exposed.                                        | Base Tabs owns selection and accessibility; Inspektor consumes active and disabled while preserving generated attributes.                  |
| Toaster internal Toast           | Viewport expanded. Root expanded, limited, type, swiping, direction, and transition. Content behind and expanded.                                                                                                            | Toast index, offset, height, swipe movement, and frontmost-height variables.                                                          | Stack, swipe, focus, and live-region state remain Base-owned; Inspektor maps status and transition presentation.                           |
| Toggle Group                     | Root disabled, multiple, orientation. Item pressed and disabled.                                                                                                                                                             | None.                                                                                                                                 | Disabled, orientation, and pressed are styled; multiple remains observable.                                                                |
| Tooltip                          | Trigger open. Positioner open, side, align, anchor hidden, instant. Popup open, side, align, instant, transition. Arrow open, side, align, uncentered, instant.                                                              | Anchor dimensions, available dimensions, transform origin.                                                                            | Instant skips transitions, logical sides map through direction, and other positioning state remains Base-owned.                            |

## Intentional constraints

[03/08/26]

- Popup Positioner parts expose semantic `side`, `align`, and selected alignment behavior, plus children and refs. Offsets, collision geometry, and tracking controls stay behind `popupPositioning`.
- High-level compositions do not reproduce every child primitive prop. Their public API describes package-owned semantic operations and delegates internal behavior to audited lower-level parts.
- Fixed visual anatomy such as Checkbox Indicator, Switch Thumb, menu indicators, Select Icon, and popup arrows is not publicly replaceable.
- Popover trigger press reason and Tooltip root-derived trigger disability are emitted outside their typed trigger state callbacks. Their empty rules remain discoverable without recreating Base UI state in parallel.
- `render` remains available on approved behavioral and semantic endpoints, plus Field Root's concrete design-system layout requirement. Native-button targets must preserve the endpoint's semantics.
- Box responsive values continue to use generated scoped CSS because StyleX does not receive arbitrary runtime breakpoint objects.

## Open product work

[03/08/26]

- [ ] Decide whether Data Grid remains an interactive native table or adopts an ARIA grid model with complete keyboard cell navigation.
- [ ] Replace Data Grid and Json View DOM discovery with semantic owner-held registries when their interaction models are revised.
- [ ] Decide distinct pending and missing presentation for Relation Details.
- [ ] Make invalid Keyboard Input modifier combinations unrepresentable and resolve non-macOS modifier glyph policy.
- [ ] Decide whether Timestamp Value formatting is browser-local or fixed to an explicit locale and time zone.
- [ ] Decide whether Box runtime responsive CSS should move to a shared stylesheet registry to avoid a sibling style node.

## Work outside the contract scope

[03/08/26]

- Product-specific Data Grid selection, sorting, and reorder design.
- CodeMirror command, IME, undo, touch, and editor toolbar behavior.
- Visual redesign of existing components and tokens.
- New popup arrows, backdrops, viewports, or manager capabilities that are not currently required by Inspektor.
- Upstream `react-resizable-panels` focus and blur callback behavior.

## Settled decisions

[03/08/26]

- [x] Support React 18 and 19 by forwarding refs instead of narrowing peer support.
- [x] Keep wrapper presentation closed while preserving behavior and native interoperability by default.
- [x] Treat popup geometry as an existing documented Inspektor constraint rather than reopening raw numeric values.
- [x] Treat Code Editor, Context Switcher, Copy Button, Data Grid, Find Bar, Input Group, Json View, Multi Select, Tab View, Text Field, and Toaster as high-level compositions.
- [x] Treat empty state rules as a discoverability inventory rather than emitted CSS or a public styling API.
- [x] Keep tests focused on Inspektor transformations and regressions instead of retesting Base UI internals.

## Validation checklist

[05/08/26]

- [x] Design-system package tests, typecheck, lint, and build pass.
- [x] Documentation generated props, tests, typecheck, lint, and build pass.
- [x] Inspektor application typecheck, lint, and build pass with the revised public types.

[03/08/26]

- [x] Design-system package tests pass.
- [x] Design-system package typecheck passes.
- [x] Design-system package build passes.
- [x] Changed design-system files pass lint.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [ ] Inspektor application TypeScript validation passes; pre-existing case-only duplicate grid filenames remain a blocker.
- [x] Inspektor application lint passes and its Vite production bundle builds; TypeScript validation remains blocked by pre-existing case-only duplicate grid filenames.
- [x] Repository diff contains no whitespace errors or generated-file drift.
