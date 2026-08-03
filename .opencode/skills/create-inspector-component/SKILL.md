---
name: create-inspector-component
description: Creates or updates `@inspector/ds` components by wrapping Base UI primitives and applying Inspector StyleX tokens and styles. Use when adding components under `packages/design-system/src/components`, changing component APIs, wrapping Base UI, or building compound design-system components.
---

# Create Inspector Component

## Table of contents

- [Quick start](#quick-start)
- [Wrapper workflow](#wrapper-workflow)
- [Public contract](#public-contract)
- [StyleX workflow](#stylex-workflow)
- [Compound components](#compound-components)
- [Validation](#validation)

## Quick start

1. Read `AGENTS.md` and inspect adjacent components and tokens.
2. Confirm the installed `@base-ui/react` version from the workspace manifests.
3. Read Base UI's `llms.txt`, relevant handbook pages, matching API reference, and tagged source.
4. Complete the audit in [componentAudit.md](references/componentAudit.md) for every wrapped part.
5. Write the required behavioral, type, or contract test.
6. Implement the wrapper with the policies in [REFERENCE.md](REFERENCE.md).
7. Add documentation with the `document-inspector-component` skill.

## Wrapper workflow

- Create `packages/design-system/src/components/{componentName}/` using camelCase filenames.
- Keep behavior in `{componentName}.tsx` and StyleX definitions in `{componentName}.styles.ts`.
- Import Base UI primitives directly and alias them with a `Base` prefix.
- Preserve the Base UI prop surface by default, including refs, events, ARIA, DOM attributes, and controlled or uncontrolled state.
- Omit public `className` and `style` from every rendered part. Inspector owns presentation.
- Omit `render` by default and restore its exact Base UI type only on behavioral endpoints or valid semantic substitution points.
- Omit any Base UI prop that Inspector fixes, transforms, or replaces. Record the reason and mapping in the audit.
- Add Inspector props only for semantic variants, sizes, layout modes, loading, or other system decisions.
- Use [publicApiPolicy.md](references/publicApiPolicy.md) for inheritance, omission, and Inspector-prop rules.
- Use [refForwarding.md](references/refForwarding.md) and [renderComposition.md](references/renderComposition.md) for composition boundaries.

## Public contract

- Derive unchanged behavior from the exact Base UI part type.
- Derive native semantics from `React.ComponentPropsWithRef<Element>`.
- Define Inspector-owned unions when the design system owns the meaning.
- Prefer one union over mutually exclusive booleans and use discriminated unions for mode-specific props.
- Put reusable prop descriptions in JSDoc and literal defaults in parameter destructuring.
- Preserve exact Base UI event signatures, including event details.
- Export the component and consumer-facing types from `packages/design-system/src/index.ts`.

## StyleX workflow

- Before designing cross-component or parent/descendant styling, you must evaluate relevant official StyleX recipes, including [Context-driven styles](https://stylexjs.com/docs/learn/recipes/context-driven-styles) and [Descendant styles](https://stylexjs.com/docs/learn/recipes/descendant-styles), and choose and apply them only when useful.
- Use semantic tokens before primitive tokens and avoid raw values when a token exists.
- Keep variants in typed lookup objects with `satisfies Record<Variant, unknown>`.
- Apply Base UI state and interaction styling without replacing its behavior.
- Use `createStateStyleProps` from `packages/design-system/src/primitives/createStateStyleProps.ts` when Base UI provides state-based `className` and `style` callbacks. Define the state-to-style selection once and pass both returned callbacks to the primitive.
- Inventory every state property, data attribute, transition state, and CSS variable for each wrapped part. Empty StyleX rules may record intentionally unstyled state capabilities.
- Express StyleX pseudo-class conditions inside property values, such as `borderColor: { default: token, ':focus': focusedToken }`. Top-level conditional blocks are invalid under the package lint rules; top-level pseudo-elements such as `::placeholder` remain valid.
- Apply StyleX output through the primitive's internal `className`, `style`, or render interface without forwarding consumer styling values.
- Do not add app-specific layout or documentation styling to the package.
- Follow [stylexIntegration.md](references/stylexIntegration.md).

## Compound components

- Wrap each Base UI part separately and classify it as a provider, structural part, behavioral endpoint, semantic endpoint, or high-level composition.
- Expose one compound API with `Object.assign(Root, { Part })` when it improves call-site clarity.
- Keep shared state in Base UI's root/provider rather than duplicating it in React context.
- Export part props needed by consumers.
- Prefer separate semantic parts such as `Item` and `LinkItem` over unconstrained polymorphism.
- Add extractor support and tests if the public export shape is not a function declaration.

## Validation

- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds build`
- Run focused package lint from `packages/design-system`, for example `pnpm exec oxlint src/components/{componentName}/{componentName}.tsx src/components/{componentName}/{componentName}.styles.ts src/index.ts`. Include `src/primitives/createStateStyleProps.ts` when changing the shared adapter.
- Classify full-package lint findings as changed-file failures or existing repository failures. Fix all changed-file failures without expanding the task into unrelated cleanup.
- Run package-scoped formatting only when a shared formatter configuration preserves adjacent conventions. Do not normalize unrelated files to formatter defaults.
- Complete the documentation workflow and its validation commands.

See [REFERENCE.md](REFERENCE.md) for the decision register and detailed references.
