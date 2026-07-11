# Agent Notes

## Table of contents

- [Active workspace](#active-workspace)
- [Commands](#commands)
- [Architecture](#architecture)
- [Design-system constraints](#design-system-constraints)
- [Component authoring](#component-authoring)
- [Component documentation](#component-documentation)
- [Application rules](#application-rules)
- [React patterns](#react-patterns)
- [TypeScript conventions](#typescript-conventions)

## Active workspace

Implementation work is limited to these directories:

- `packages/design-system`: reusable `@inspector/ds` components, primitives, and tokens.
- `apps/design-system`: documentation, examples, generated API metadata, and design-system validation.
- `apps/web`: Inspector product application consuming `@inspector/ds`.

`packages/ui` and `apps/web-inspector` are deprecated. Do not modify them, add imports from them, or implement replacement behavior there. They may be read only when migration context is required.

Other workspace packages are outside the replacement UI architecture. Do not modify them unless the user explicitly requests work in them.

## Commands

- `pnpm dev` runs every workspace `dev` script.
- `pnpm dev:web` starts the Inspector application.
- Inspector application:
  - `pnpm --filter regarde.inspector dev`
  - `pnpm --filter regarde.inspector dev:vite`
  - `pnpm --filter regarde.inspector build`
  - `pnpm --filter regarde.inspector typecheck`
  - `pnpm --filter regarde.inspector lint`
- Design-system package:
  - `pnpm --filter @inspector/ds build`
  - `pnpm --filter @inspector/ds typecheck`
  - `pnpm --filter @inspector/ds lint`
- Design-system documentation:
  - `pnpm --filter inspector.design-system dev`
  - `pnpm --filter inspector.design-system test`
  - `pnpm --filter inspector.design-system gen:props`
  - `pnpm --filter inspector.design-system check:props`
  - `pnpm --filter inspector.design-system build`
  - `pnpm --filter inspector.design-system typecheck`
  - `pnpm --filter inspector.design-system lint`

## Architecture

- `packages/design-system` owns reusable presentation and interaction components.
- `apps/design-system` consumes public `@inspector/ds` exports like a product application; it does not import package-private implementation files at runtime.
- `apps/web` owns Inspector routes, application state, Jazz data access, and feature composition.
- The Inspector is schema-driven and generic. Do not add generated query builders or table-specific UI for inspected applications; use stored schema metadata and generic query construction.
- Connection data includes `serverUrl`, `appId`, `adminSecret`, branch, and schema hash. Treat `adminSecret` as sensitive even when local links pass it in URL hash parameters.
- TanStack Router route trees are generated. Do not hand-edit `apps/web/src/routeTree.gen.ts` or `apps/design-system/src/routeTree.gen.ts`.

## Design-system constraints

- The architecture follows Polar's typed token model and shadcn CSS-in-JS's Base UI plus StyleX component structure without Tailwind component styling.
- Public component APIs must make off-system design decisions difficult to express.
- Do not expose `className`, inline `style`, arbitrary CSS values, or broad styling slot overrides from `@inspector/ds` components.
- Do not use `className`, inline `style`, raw HTML layout, or invented values as an application escape hatch.
- When a valid design cannot be expressed, add a semantic token, constrained prop, variant, primitive, or composed component.
- Use semantic tokens before primitive value tokens. Theme-specific values stay behind tokens.
- Escape hatches require explicit, narrow lint suppression and should remain auditable.

## Component authoring

- Before wrapping Base UI, verify the installed version, read `https://base-ui.com/llms.txt`, the matching component API, relevant handbook pages, utilities, and tagged source.
- Keep each component under `packages/design-system/src/components/{componentName}/` with camelCase filenames.
- Put behavior and markup in `{componentName}.tsx`; put StyleX rules in `{componentName}.styles.ts`.
- Use Base UI for interactive behavior and accessibility. Use intrinsic elements only when no behavioral primitive is needed.
- Derive props from the exact Base UI part, then omit `className` and `style` from the public wrapper type.
- Use Base UI state callbacks internally to select StyleX rules; do not expose those callbacks as styling APIs.
- Preserve Base UI refs, event handlers, state attributes, semantic defaults, and required compound structure.
- Use `render` and `useRender` for composition instead of `asChild`. Use `mergeProps` when manually combining behavioral props.
- Keep compound parts together and use `Object.assign(Root, { Part })` when it creates one clear API.
- Put reusable prop descriptions in package JSDoc and literal defaults in parameter destructuring.
- Export public components and consumer-facing types from `packages/design-system/src/index.ts`.

## Component documentation

- Every exported component requires documentation in `apps/design-system`.
- Add navigation only when the component page exists; do not add planned entries or readiness markers.
- Use a stable `componentId` to join registry metadata and generated API records.
- Package types, defaults, requiredness, descriptions, and source locations are authoritative.
- Documentation pages select prop names and order but do not override generated API facts.
- Keep examples in executable camelCase TSX modules imported normally for preview and with `?raw` for displayed source.
- Examples import from `@inspector/ds` and must not demonstrate styling escape hatches.
- Never edit generated `props.json` or route trees manually.

## Application rules

- `apps/web` imports reusable UI from `@inspector/ds`, not `@regarde/ui`.
- Keep feature and data logic in `apps/web`; move reusable presentation and interaction behavior into `packages/design-system`.
- Build layouts with constrained design-system primitives and token props instead of raw layout elements with CSS strings.
- Do not recreate Base UI behavior in application components.

## React patterns

- Name props relative to their component context.
- Avoid booleans when behavior can be derived from existing props.
- Prefer enum props over mutually exclusive booleans.
- Prefer composition and compound components over broad data props or slot overrides.
- Treat `useEffect` as synchronization with external systems, not a derived-state mechanism.
- Put user-action side effects in event handlers.
- Use keys when remounting is the intended state reset.
- Return cleanup from subscriptions, listeners, observers, and imperative integrations.

## TypeScript conventions

- Use explicit boolean comparisons: `=== true` and `=== false`.
- Preserve strict settings including `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`.
- Prefix native Node imports with `node:`.
- Prefer unions and typed lookup records that make invalid states unrepresentable.
