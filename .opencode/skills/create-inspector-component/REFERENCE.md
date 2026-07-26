# Inspector component reference

## Table of contents

- [Source hierarchy](#source-hierarchy)
- [Base UI source lookup](#base-ui-source-lookup)
- [Choosing a wrapper pattern](#choosing-a-wrapper-pattern)
- [Closed styling boundary](#closed-styling-boundary)
- [Public API rules](#public-api-rules)
- [StyleX state patterns](#stylex-state-patterns)
- [Referential stability contracts](#referential-stability-contracts)
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

- Expose only props that are part of the Inspector design vocabulary. Do not derive wrapper props wholesale from Base UI; pick or redeclare the small set the product needs.
- Name props relative to the component: `isOpen`, not `isDialogOpen`.
- Derive behavior from existing props when possible.
- Use a union prop for exclusive modes.
- Prefer children and compound parts over broad `data` objects.
- Preserve render composition rather than adding `asChild` aliases.
- Omit inherited `className` and `style` from public wrapper props.
- Do not expose Base UI state callbacks, internal `render` props, or arbitrary DOM attributes as public props. Forward them internally when behavior requires it.
- Compare every new prop with the inherited Base UI and native DOM surface. Add colliding names to `Omit`, especially when replacing a native prop such as numeric `size` with a design-system union.
- Do not expose StyleX internals as component props.
- Add a prop only when a real product usage needs it. Avoid speculative flexibility.
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

### Contextual descendant styles

When an ancestor must influence a descendant's rendered appearance without prop drilling or exposing styling escape hatches, use a component-scoped `stylex.defineVars()` contract:

- Define variables in a dedicated `{component}Vars.stylex.ts` module that exports **only** the variables.
- The component consumes them in its `{component}.styles.ts`.
- Ancestors override specific variables inside their own state styles.

This pattern is required because StyleX files that export `defineVars()` cannot also export `stylex.create()` or type exports. Splitting keeps the contract explicit and reusable. See `InputGroup` for the established precedent.

## Referential stability contracts

Use a referential stability contract when a reusable boundary intentionally promises that its object, array, or function identity survives unrelated renders. Typical boundaries are context provider values, hook return objects consumed as one dependency, and props passed to memoized component subtrees.

Do not introduce `Stable<T>` for local implementation values or as a default performance technique. First identify the consumer that observes reference identity. Memoization adds dependency comparisons and can conceal mutable state when used without a clear boundary.

### Type contract

Define the brand with a private `unique symbol`. The brand is compile-only evidence that ordinary structural values cannot satisfy accidentally. It guarantees identity preservation, not immutability:

```/dev/null/stable.ts#L1-11
declare const stableBrand: unique symbol

export type Stable<T> = T extends object
  ? T & { readonly [stableBrand]: true }
  : T

export function asStable<T>(value: T): Stable<T> {
  return value as unknown as Stable<T>
}
```

The `unknown` assertion deliberately erases the source type before applying the phantom brand. It performs no runtime validation or mutation. Keep `asStable()` package-private and adjacent to the runtime mechanism that proves the guarantee. Never scatter it through consumers to make incompatible values compile.

### Provider implementation

React compares context provider values with `Object.is`. An inline provider object broadcasts a context update on every parent render. Build the complete value inside `useMemo`, list every meaningful field as a dependency, and apply the brand inside the memo factory:

```/dev/null/provider.tsx#L1-14
const value = useMemo(
  () =>
    asStable({
      state,
      action,
    } satisfies ContextValue),
  [action, state],
)

return <Context.Provider value={value}>{children}</Context.Provider>
```

The context and its accessor should preserve `Stable<ContextValue>` so the proof survives the provider boundary. Standard React hooks accept any dependency type, so this brand documents and transports the guarantee but does not make `useEffect` or `useMemo` reject unstable dependencies. Claim dependency-array enforcement only when strict hook types are installed.

### Mutable stable containers

Stable identity does not mean stable contents. React refs and TanStack Table instances retain container identity while their internal values change. Do not use a branded container reference as a state version, and do not tell consumers that an effect depending on the container will run when its internals change.

For third-party containers:

- Keep the public prop typed as the third-party return type when its API cannot produce the project brand.
- Establish any wrapper or context stability inside the design-system component.
- Preserve the library's own subscription or controlled-state mechanism for semantic updates.
- Include wrapper inputs that should notify context consumers in the memo dependency set.

### Consumer impact

The runtime benefit is narrower context broadcasts and stable props for memoized descendants. The type benefit is preserving evidence across shared boundaries. There is no benefit when every relevant callback, object, or array dependency changes on each render, so do not claim an optimization until the complete identity chain is stable.

### Required proof

Add a regression test with a memoized consumer. Render the provider, trigger an unrelated owner render with identical meaningful inputs, and assert that the consumer did not render again. Add a separate update assertion when a meaningful input changes and the consumer must be notified.

## Testing decision table

| Change | Required proof |
| --- | --- |
| Wrapper adds behavior or state transitions | Failing behavioral component test |
| Wrapper only constrains props and applies styles | Type test or extractor/API contract test |
| Public export uses `Object.assign` or a namespaced shape | Failing extractor-resolution test |
| Base UI state maps to Inspector styles | Focused render test when package test infrastructure supports it; otherwise typecheck plus focused lint |
| Component establishes `Stable<T>` at a provider or shared hook boundary | Failing identity regression test covering unrelated and meaningful input changes |

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
