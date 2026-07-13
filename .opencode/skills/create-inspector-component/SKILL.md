---
name: create-inspector-component
description: Creates or updates `@inspector/ds` components by wrapping Base UI primitives and applying Inspector StyleX tokens and styles. Use when adding components under `packages/design-system/src/components`, changing component APIs, wrapping Base UI, or building compound design-system components.
---

# Create Inspector Component

## Quick start

1. Read `AGENTS.md` and inspect adjacent components and tokens.
2. Confirm the installed `@base-ui/react` version from the workspace manifests.
3. Read Base UI's `llms.txt`, the matching API reference, and tagged source before designing the wrapper.
4. Write a failing behavioral or type test when the change adds logic.
5. Implement the smallest public API that represents valid component states.
6. Add documentation with the `document-inspector-component` skill before considering the component complete.

## Component workflow

- Create `packages/design-system/src/components/{componentName}/` using camelCase filenames.
- Keep behavior in `{componentName}.tsx` and StyleX definitions in `{componentName}.styles.ts`.
- Import Base UI primitives directly and alias them with a `Base` prefix.
- Derive wrapper props from the Base UI primitive, but omit public `className` and `style`; use `useRender.ComponentProps` for custom polymorphic leaves.
- Check every Inspector-specific prop name against inherited Base UI and native DOM props. Omit collisions such as the native numeric `size` prop when replacing them with a constrained design-system union.
- Preserve Base UI accessibility, refs, events, state attributes, and render composition.
- Add only Inspector-specific API: semantic variants, sizes, layout, loading, or composition.
- Prefer enum props and composition over mutually exclusive booleans and broad slot override props.
- Use explicit boolean comparisons and keep derived state in render.
- Put public prop descriptions in JSDoc and literal defaults in parameter destructuring.
- Export the component and consumer-facing types from `packages/design-system/src/index.ts`.

## Closed styling contract

- Do not expose `className`, inline `style`, arbitrary CSS values, or styling slot overrides in public component props.
- Use Base UI `className` and `style` callbacks internally only to translate primitive state into StyleX rules.
- When a design decision is missing, add a semantic token, typed prop, variant, or composed component instead of an escape hatch.
- Keep exceptions explicit, narrow, and enforced by lint rather than normalizing bypasses in component APIs.

## StyleX workflow

- Use semantic tokens before primitive tokens and avoid raw values when a token exists.
- Keep variants in typed lookup objects with `satisfies Record<Variant, unknown>`.
- Apply Base UI state and interaction styling without replacing its behavior.
- Use `createStateStyleProps` from `packages/design-system/src/primitives/createStateStyleProps.ts` when Base UI provides state-based `className` and `style` callbacks. Define the state-to-style selection once and pass both returned callbacks to the primitive.
- Express StyleX pseudo-class conditions inside property values, such as `borderColor: { default: token, ':focus': focusedToken }`. Top-level conditional blocks are invalid under the package lint rules; top-level pseudo-elements such as `::placeholder` remain valid.
- Apply StyleX output through the primitive's internal `className`, `style`, or render interface without forwarding consumer styling values.
- Do not add app-specific layout or documentation styling to the package.

## Compound components

- Wrap each Base UI part separately with a narrow prop type.
- Expose one compound API with `Object.assign(Root, { Part })` when it improves call-site clarity.
- Keep shared state in Base UI's root/provider rather than duplicating it in React context.
- Export part props needed by consumers.
- Add extractor support and tests if the public export shape is not a function declaration.

## Validation

- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds build`
- Run focused package lint from `packages/design-system`, for example `pnpm exec oxlint src/components/{componentName}/{componentName}.tsx src/components/{componentName}/{componentName}.styles.ts src/index.ts`. Include `src/primitives/createStateStyleProps.ts` when changing the shared adapter.
- Classify full-package lint findings as changed-file failures or existing repository failures. Fix all changed-file failures without expanding the task into unrelated cleanup.
- Run package-scoped formatting only when a shared formatter configuration preserves adjacent conventions. Do not normalize unrelated files to formatter defaults.
- Complete the documentation workflow and its validation commands.

See [REFERENCE.md](REFERENCE.md) for API decisions, wrapper patterns, and compound-component guidance.
