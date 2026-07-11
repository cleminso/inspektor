# Base UI v1.6 Wrapper References

## Table of contents

- [Scope](#scope)
- [Required references](#required-references)
- [Wrapper requirements](#wrapper-requirements)
- [Compound component requirements](#compound-component-requirements)
- [Accessibility ownership](#accessibility-ownership)
- [Source URLs](#source-urls)

## Scope

This report identifies the authoritative Base UI v1.6 documentation that should be required when creating design-system wrappers and compound components. Base UI's `llms.txt` is the canonical documentation inventory and identifies the current package as `@base-ui/react`. The React handbook and utilities indexes are useful discovery pages, but the linked topic pages contain the implementation rules.

## Required references

| Reference | Requirement | Why it is required |
| --- | --- | --- |
| [Composition](https://base-ui.com/react/handbook/composition) | Required for every wrapper that exposes or consumes `render` | Defines element and callback render props, nested composition, ref forwarding, prop spreading, and the warning that changing the default element should be case-specific. |
| [Styling](https://base-ui.com/react/handbook/styling.md) | Required for every styled wrapper | Defines `className` and `style` as either static values or state callbacks, plus state data attributes and component-specific CSS variables. |
| [useRender](https://base-ui.com/react/utils/use-render.md) | Required when a custom wrapper itself offers render-prop composition | Defines the supported implementation, public and internal prop types, state propagation, automatic state attributes, merged refs, and polymorphism constraints. |
| [mergeProps](https://base-ui.com/react/utils/merge-props.md) | Required whenever props from Base UI, a wrapper, and a consumer are combined manually | Defines precedence and special handling for events, `className`, `style`, refs, and `preventBaseUIHandler()`. This is mandatory with callback render props because callback props are not merged automatically. |
| [Accessibility](https://base-ui.com/react/overview/accessibility.md) | Required for all wrappers and compound components | Separates Base UI's behavioral accessibility from developer-owned labels, focus appearance, contrast, semantics, and testing. |
| Relevant [component API reference](https://base-ui.com/llms.txt) | Required for every wrapped primitive or compound part | It is the authoritative list of each part's props, state attributes, CSS variables, default element, roles, and accessible structure. Generic handbook guidance cannot replace it. |
| [Customization](https://base-ui.com/react/handbook/customization) | Required when a wrapper controls state, intercepts events, or changes dismissal/propagation behavior | Defines controlled and uncontrolled behavior, change-event details, cancellation, propagation, and the `preventBaseUIHandler()` escape hatch. |

The [React handbook index](https://base-ui.com/react/handbook) and [React utilities index](https://base-ui.com/react/utils) should be required as navigation inventories in research instructions, but not treated as sufficient implementation references. The utilities index confirms that `useRender` and `mergeProps` are the composition utilities relevant to wrappers; CSP and direction providers are situational rather than universal wrapper references.

## Wrapper requirements

### Render prop composition

- Preserve the Base UI `render` prop instead of replacing it with an incompatible `asChild` abstraction.
- For an element render prop, the supplied custom component must accept the forwarded ref and spread every received prop onto its underlying DOM element. Failing either requirement can break event handling, ARIA, focus, and state attributes.
- Render props may be nested to compose multiple Base UI behaviors on one element. Wrappers must not swallow props or refs at any nesting layer.
- Callback render props receive `(props, state)` and allow state-dependent content. They provide control over prop spreading, so merging is the callback author's responsibility.
- Prefer the primitive's default semantic element. Polymorphism requires auditing element-specific defaults; for example, button-only props cannot safely be applied to another tag. Honor component-specific signals such as `nativeButton` where documented.

### className and style callbacks

- Preserve both static and callback forms of `className` and `style`; narrowing either prop to only a string or object removes a documented Base UI styling interface.
- A callback receives the component state. A wrapper should merge its own styling without preventing the consumer callback from receiving that state.
- Prefer documented state attributes for CSS state styling. Read each component API because available attributes and CSS variables differ by part.

### State attributes

- Base UI parts expose documented `data-*` attributes such as `data-checked`, `data-unchecked`, and component-specific states.
- `useRender` converts supplied state properties into data attributes and supports `stateAttributesMapping` for explicit mappings.
- Do not manually duplicate, rename, or infer primitive state attributes when the primitive or `useRender` already owns them. Preserve received props so attributes reach the DOM.

### useRender

- Use `useRender` when a custom design-system primitive needs the same render-prop contract as Base UI.
- Type public props with `useRender.ComponentProps<DefaultElement, State>` and internal DOM defaults with `useRender.ElementProps<DefaultElement>`.
- Supply `defaultTagName`, `render`, merged props, optional state, and internal refs. In React 19, the external ref is already present in props; pass internal refs through `useRender` so both are retained.
- Expose meaningful state to callback render props and keep the state object stable where appropriate.

### mergeProps

- Use `mergeProps` rather than object spread when combining behavioral props. Object spread silently replaces handlers, classes, or styles.
- Most properties use rightmost-wins precedence. Event handlers run right-to-left, class names concatenate right-to-left, and style objects merge with rightmost keys winning.
- `ref` is not merged by `mergeProps`; only the rightmost ref survives. Merge refs through `useRender`'s `ref` option.
- In a callback render prop, merge the Base UI-provided props with custom props explicitly. Base UI does not perform this merge after the callback takes control.
- `event.preventBaseUIHandler()` suppresses earlier Base UI synthetic-event handlers without calling `preventDefault()` or `stopPropagation()`. Treat it as an escape hatch, not routine wrapper behavior.
- A function argument to `mergeProps` replaces the accumulated props. It must manually preserve prior handlers when needed.

## Compound component requirements

- Read the API reference for the root and every exposed part. Compound accessibility and behavior depend on parts retaining their intended hierarchy, context, roles, IDs, refs, and generated props.
- Wrap parts individually and preserve their original prop surfaces, including `render`, state callback styling, state attributes, and refs.
- Keep Root ownership of controlled or uncontrolled state and forward change-event details rather than reducing handlers to value-only callbacks when consumers may need `reason`, `cancel()`, or `allowPropagation()`.
- Preserve required structural parts such as portals, positioners, popups, triggers, labels, and controls unless the component API explicitly permits omission or replacement.
- Nested triggers must use documented render composition so multiple primitives share one DOM element without nested interactive elements.
- Do not reimplement primitive keyboard navigation, focus management, dismissal, ARIA relationships, or selection state in the wrapper. Compose the Base UI parts that own those behaviors.

## Accessibility ownership

Base UI owns the primitive behavior it documents: ARIA and role attributes, pointer interaction, keyboard navigation, focus management after interactions, and relationships generated by correctly composed parts. Wrappers own preserving those generated props, refs, event handlers, semantic defaults, and required part structure.

The design system and application still own:

- Supplying accessible names and descriptions when content does not provide them, using labels, `alt`, `aria-label`, or `aria-labelledby` as appropriate.
- Providing visible `:focus` or `:focus-visible` styling; Base UI manages focus behavior but not the wrapper's visual indication.
- Meeting color contrast requirements in the styling layer.
- Choosing a semantically valid rendered element and preventing invalid nested interactive elements.
- Retesting keyboard, pointer, focus, and screen-reader behavior after composition or polymorphic rendering.
- Verifying component-specific accessibility requirements in the relevant API page. A generic wrapper contract cannot guarantee correct labels or semantics for every use case.

## Source URLs

- Base UI documentation inventory and v1.6 release index: https://base-ui.com/llms.txt
- React handbook index: https://base-ui.com/react/handbook
- Composition handbook: https://base-ui.com/react/handbook/composition
- Customization handbook: https://base-ui.com/react/handbook/customization
- Styling handbook: https://base-ui.com/react/handbook/styling.md
- React utilities index: https://base-ui.com/react/utils
- `useRender`: https://base-ui.com/react/utils/use-render.md
- `mergeProps`: https://base-ui.com/react/utils/merge-props.md
- Accessibility overview: https://base-ui.com/react/overview/accessibility.md
