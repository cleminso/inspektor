# Base UI contract

## Table of contents

- [Evidence hierarchy](#evidence-hierarchy)
- [Wrapper boundary](#wrapper-boundary)
- [Four capability questions](#four-capability-questions)
- [Preservation requirements](#preservation-requirements)
- [Source lookup](#source-lookup)

## Evidence hierarchy

Use evidence in this order:

1. Installed `@base-ui/react` version in workspace manifests and lockfile.
2. [Base UI documentation inventory](https://base-ui.com/llms.txt) and matching component API reference.
3. Base UI handbook pages for [styling](https://base-ui.com/react/handbook/styling), [composition](https://base-ui.com/react/handbook/composition), [customization](https://base-ui.com/react/handbook/customization), and [TypeScript](https://base-ui.com/react/handbook/typescript).
4. Relevant utilities, especially [`useRender`](https://base-ui.com/react/utils/use-render) and [`mergeProps`](https://base-ui.com/react/utils/merge-props).
5. Base UI [accessibility responsibilities](https://base-ui.com/react/overview/accessibility).
6. Matching tagged source for the primitive, its parts, props, state, attributes, and variables.
7. Existing `@inspektor/ds` components and tokens.

Do not rely on recalled APIs. Verify import paths, default elements, required anatomy, ref behavior, event details, render composition, state attributes, CSS variables, and mount behavior.

## Wrapper boundary

Base UI owns:

- semantic and keyboard behavior
- pointer interaction and focus management
- controlled and uncontrolled state machinery
- generated ARIA relationships and roles
- custom event details and cancellation
- state data attributes and CSS variables
- portal, positioning, dismissal, and transition coordination

Inspector owns:

- StyleX styles and semantic tokens
- public omission of `className` and `style`
- semantic variants, sizes, and constrained layout modes
- composed anatomy beyond the primitive's required structure
- additional package-owned state and attributes
- documentation and validation of the public wrapper contract

Do not replace Base UI behavior merely to simplify styling or typing.

## Four capability questions

Evaluate every Base UI capability independently:

1. Must the wrapper preserve it internally?
2. Can consumers configure it publicly?
3. Which layer owns its type and meaning?
4. Does Inspector transform it at the Base UI boundary?

Preservation and exposure are different. Base UI may generate `aria-controls` internally while consumers configure `aria-label`. A wrapper may derive `checked` from Base UI while defining an Inspector-owned `size` union.

## Preservation requirements

- Preserve Base UI-generated props, event handlers, refs, roles, IDs, and ARIA relationships.
- Preserve custom event signatures, including event details.
- Preserve controlled and uncontrolled behavior unless Inspector intentionally fixes one mode.
- Preserve default rendered elements unless a documented semantic substitution is required.
- Preserve state attributes and CSS variables even when Inspector does not style them.
- Preserve required compound anatomy and provider relationships.
- Preserve mount and transition coordination instead of implementing parallel state.
- Add package-owned attributes only for Inspector state, variants, slots, or interoperability.

## Source lookup

Use the source link on the matching Base UI API page to find the component directory under the installed tag. Inspect the tree before selecting a secondary filename. Treat a missing guessed source path as a lookup error, not evidence that the API is absent.

Record the inspected documentation and source in the component audit. Compare each wrapped part rather than only the root.
