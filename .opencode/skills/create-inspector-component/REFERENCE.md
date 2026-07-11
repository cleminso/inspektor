# Inspector component reference

## Table of contents

- [Source hierarchy](#source-hierarchy)
- [Choosing a wrapper pattern](#choosing-a-wrapper-pattern)
- [Closed styling boundary](#closed-styling-boundary)
- [Public API rules](#public-api-rules)
- [Package documentation contract](#package-documentation-contract)
- [Compound components](#compound-components)
- [Completion checklist](#completion-checklist)

## Source hierarchy

Use evidence in this order:

1. Installed Base UI version in workspace manifests and lockfile.
2. [Base UI documentation inventory](https://base-ui.com/llms.txt) and matching component API reference.
3. The [Base UI handbook](https://base-ui.com/react/handbook), especially [composition](https://base-ui.com/react/handbook/composition), [customization](https://base-ui.com/react/handbook/customization), and [styling](https://base-ui.com/react/handbook/styling.md).
4. Relevant [Base UI utilities](https://base-ui.com/react/utils), especially [`useRender`](https://base-ui.com/react/utils/use-render.md) and [`mergeProps`](https://base-ui.com/react/utils/merge-props.md).
5. Base UI's [accessibility responsibilities](https://base-ui.com/react/overview/accessibility.md).
6. Matching tagged Base UI source for the primitive, props, state, and data attributes.
7. Existing `@inspector/ds` components and semantic tokens.

Do not rely on recalled Base UI APIs. Verify import paths, part names, ref behavior, render composition, and state attributes against the installed version.

## Choosing a wrapper pattern

### Primitive wrapper

Use when Base UI already owns behavior and accessibility. Alias the imported primitive with a `Base` prefix, derive its props, preserve its ref and state contract, and add only Inspector styling or constrained variants.

### Custom polymorphic leaf

Use `useRender` and `mergeProps` when the design-system component owns a small interaction surface but must support render composition. Follow `packages/design-system/src/components/button/button.tsx` for merge order, disabled behavior, and StyleX integration.

### Inspector primitive

Use a package-owned implementation only when Base UI has no corresponding behavioral primitive. Keep DOM behavior small and avoid recreating an available Base UI interaction model.

## Closed styling boundary

The package follows Polar's [LLM-safe design-system direction](https://polar.sh/blog/orbit-llm-safe-design-system): invalid design decisions should be difficult to express and should fail validation. Public `className`, inline `style`, raw CSS values, and arbitrary styling callbacks weaken that contract and must be omitted from wrapper props.

Use shadcn CSS-in-JS for its [Base UI and StyleX structure](https://www.shadcn-cssinjs.com/docs), not for its consumer styling escape hatches. Internally, wrappers may consume Base UI state callbacks and apply generated StyleX output. Consumers receive typed variants, semantic tokens, constrained layout props, and composition.

If the system cannot express a legitimate design, treat it as a missing token or API. Add the smallest reusable decision rather than forwarding an unrestricted string. Any exceptional bypass belongs behind an explicit lint suppression that can be audited.

## Public API rules

- Name props relative to the component: `isOpen`, not `isDialogOpen`.
- Derive behavior from existing props when possible.
- Use a union prop for exclusive modes.
- Prefer children and compound parts over broad `data` objects.
- Preserve render composition rather than adding `asChild` aliases.
- Omit inherited `className` and `style` from public wrapper props.
- Do not expose StyleX internals as component props.
- Use package JSDoc for reusable API facts; keep usage guidance in the docs app.
- Express documented defaults as literal destructuring initializers so prop extraction reads runtime truth.

## Package documentation contract

Every documented prop must be reachable from the public component call signature. Export consumer-facing props and variant types from `packages/design-system/src/index.ts`. Redeclare important inherited props with package JSDoc when their semantics are part of the wrapper contract.

Do not maintain types, defaults, or public descriptions in the documentation page. The prop extractor reads those facts from package source.

## Compound components

Use Base UI's root and parts as the behavioral boundary. A compound component should provide one obvious composition path, such as `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`, and `Dialog.Close`.

Avoid exporting both compound and unrelated parallel APIs unless compatibility requires it. If `Object.assign` changes the public declaration shape, extend `apps/design-system/scripts/extract-props.mjs` with a failing extractor test before documenting the component. Generated metadata must resolve the public package export rather than a private source-only symbol.

Document each meaningful public part. Use separate prop groups when parts have independent APIs; do not flatten all part props into the root table.

## Completion checklist

- Base UI version, API reference, and source inspected
- Behavior and accessibility remain owned by Base UI
- Public API contains no impossible boolean combinations
- StyleX uses semantic tokens and typed variants
- Public JSDoc and literal runtime defaults are present
- Public component and types are exported
- Logic and extractor behavior are tested
- Component documentation is complete
- Package and documentation validation pass
