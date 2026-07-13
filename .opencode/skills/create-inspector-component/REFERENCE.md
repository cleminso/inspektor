# Inspector component reference

## Table of contents

- [Source hierarchy](#source-hierarchy)
- [Base UI source lookup](#base-ui-source-lookup)
- [Choosing a wrapper pattern](#choosing-a-wrapper-pattern)
- [Closed styling boundary](#closed-styling-boundary)
- [Public API rules](#public-api-rules)
- [StyleX state patterns](#stylex-state-patterns)
- [Testing decision table](#testing-decision-table)
- [Validation commands](#validation-commands)
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

## Base UI source lookup

Use the source link on the matching Base UI API page to locate the component directory under the exact installed tag. Inspect the directory or repository tree rather than guessing secondary filenames. Raw source normally follows `https://raw.githubusercontent.com/mui/base-ui/v{version}/packages/react/src/{component}/{file}` once the tree confirms the file name.

Treat a missing guessed source path as a lookup error, not evidence that the API is absent. The API page, confirmed component source, and any delegated primitive source are sufficient when they establish the wrapper contract.

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
- Compare every new prop with the inherited Base UI and native DOM surface. Add colliding names to `Omit`, especially when replacing a native prop such as numeric `size` with a design-system union.
- Do not expose StyleX internals as component props.
- Use package JSDoc for reusable API facts; keep usage guidance in the docs app.
- Express documented defaults as literal destructuring initializers so prop extraction reads runtime truth.

## StyleX state patterns

Represent pseudo-class conditions inside each affected property:

```/dev/null/input.styles.ts#L1-8
const styles = stylex.create({
  root: {
    borderColor: {
      default: borderColors.border,
      ':focus': borderColors['border-focused'],
    },
  },
})
```

Top-level pseudo-elements such as `::placeholder` are supported. Translate Base UI state such as `disabled` or `valid === false` into separate StyleX rules selected by the component's internal state callback. Run focused StyleX lint against each changed style file.

When Base UI exposes separate state-based `className` and `style` callbacks, use `createStateStyleProps` to keep the state mapping in one place:

```/dev/null/input.tsx#L1-10
const stateStyleProps = createStateStyleProps<BaseInput.State>((state) => [
  inputStyles.base,
  state.disabled === true && inputStyles.disabled,
  state.valid === false && inputStyles.invalid,
])

<BaseInput
  className={stateStyleProps.className}
  style={stateStyleProps.style}
/>
```

The adapter preserves complete StyleX output: static rules use `className`, while dynamic values may require `style`. It removes duplicated selection logic but intentionally does not cache `stylex.props(...)` across callbacks. Prefer typed Base UI state callbacks over data-attribute selectors; reserve attributes for inspection, tests, interoperability, or primitives without state callbacks.

## Testing decision table

| Change | Required proof |
| --- | --- |
| Wrapper adds behavior or state transitions | Failing behavioral component test |
| Wrapper only constrains props and applies styles | Type test or extractor/API contract test |
| Public export uses `Object.assign` or a namespaced shape | Failing extractor-resolution test |
| Base UI state maps to Inspector styles | Focused render test when package test infrastructure supports it; otherwise typecheck plus focused lint |

Do not retest behavior wholly owned by Base UI. Test the wrapper's behavior, public contract, and state translation.

## Validation commands

Run focused package lint from `packages/design-system`:

```/dev/null/commands.sh#L1
pnpm exec oxlint src/components/{componentName}/{componentName}.tsx src/components/{componentName}/{componentName}.styles.ts src/index.ts
```

Full-package lint can expose unrelated existing findings. Report changed-file failures separately and do not hide them among repository-wide diagnostics. Use package-scoped formatting only when its configuration matches adjacent source conventions.

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
