<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task involving a TanStack package:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
- Do not run the intent skill check for work unrelated to TanStack packages.

<!-- intent-skills:end -->

# Agent Notes

## Table of contents

- [Active workspace](#active-workspace)
- [Inspektor Test](#inspektor-test)
- [Browser verification](#browser-verification)
- [Implementation checklists](#implementation-checklists)
- [Commands](#commands)
- [Debugging workflow](#debugging-workflow)
- [Performance optimization workflow](#performance-optimization-workflow)
- [Editing and validation](#editing-and-validation)
- [Architecture](#architecture)
- [Import boundaries](#import-boundaries)
- [Design-system constraints](#design-system-constraints)
- [Component authoring](#component-authoring)
- [Component documentation](#component-documentation)
- [Application rules](#application-rules)
- [React patterns](#react-patterns)
- [Referential stability contracts](#referential-stability-contracts)
- [TypeScript conventions](#typescript-conventions)

## Active workspace

Implementation work is limited to these directories:

- `packages/design-system`: reusable `@inspektor/ds` components, primitives, and tokens.
- `apps/design-system`: documentation, examples, generated API metadata, and design-system validation.
- `apps/web`: Inspektor product application consuming `@inspektor/ds`.
- `apps/inspektor-test`: Inspektor Test schema, deterministic data, cloud deployment tooling, and isolated Jazz fixtures.

Other workspace packages are outside the replacement UI architecture. Do not modify them unless the user explicitly requests work in them.

## Inspektor Test

Use `apps/inspektor-test` as the curated test app for Inspektor behavior. Read its `README.md` before changing its schema, permissions, seeded data, or fixture tooling.

- Use `pnpm inspektor-test:fixture` for automated, isolated, or destructive browser checks.
- Use the shared cloud app only when the task requires shared-network or manual browser verification.
- Do not deploy or seed the cloud app unless the task explicitly requires changing shared fixture state.
- Never print or commit cloud credentials from `apps/inspektor-test/.env.local`.
- Keep seeded rows deterministic and replaceable by stable ID.

## Browser verification

- Start Inspektor from the workspace root with `pnpm dev:web`.
- Run the Inspektor and fixture as owned persistent processes. Record their process IDs, confirm both are reachable before opening the browser, and stop only those processes when verification is complete.
- Use `pnpm inspektor-test:fixture` for automated, isolated, or destructive checks. Keep its generated credentials out of responses, screenshots, and committed artifacts.
- When the fixture uses an `http://` or `ws://` endpoint, open the direct HTTP Vite URL reported by `pnpm dev:web` instead of the Portless HTTPS URL to avoid mixed-content blocking.
- Use a fresh Chrome isolated context for each fixture check. Do not rely on state from the persistent Chrome profile.
- Reserve the persistent Chrome profile and any saved cloud connection for explicit shared-cloud exploration. Treat its user-data directory as a credential store: do not commit, copy, upload, or expose it to test artifacts.
- Close pages created for the check and stop the owned fixture and Inspektor processes. Do not terminate unrelated development processes.

## Implementation checklists

Use `docs/todo/*.md` checklists to track implementation work for each UI element. One file corresponds to one UI element, such as `table-explorer`, `subscription-query`, or `routing`. The checklist is a working dump place for completed foundation work and for ideas that come up during development but are not to implement now.

A checklist file follows this structure:

- Table of contents linking to each section.
- Implemented foundation: completed parts of the UI element, grouped by topic.
- Open product work: known next steps that are out of scope for the current implementation.
- Work outside the foundation scope: explicit exclusions when the current foundation intentionally does not cover them.
- Settled interaction decisions: rules that are already decided and should not be reopened.
- Open design decisions: questions that still need a product decision before implementation.
- Validation checklist: commands and verification steps to run before considering the work done.

Record a date at the start of each checklist block so it is easy to see when items were added. Use the format `[DD/MM/YY]`. Keep existing dated blocks unchanged and add each new block above the older blocks in its section.

When working on an implementation:

- Create or update the relevant `docs/todo/{elementName}.md` file for the UI element in scope.
- Mark completed items with `[x]`. Do not update an existing block's date or append new work to it; add a newly dated block above it.
- Add new open items, design decisions, or exclusions as they appear, with the current date, instead of holding them in memory.
- Do not implement items marked as open or out of scope unless the user explicitly asks for them.
- Keep the checklist focused on one UI element. If an idea belongs to a different element, add it to that element's checklist instead.

Example: `docs/todo/table-explorer.md` tracks the Table Explorer selection and pane foundation, open product work, and decisions for the table explorer.

## Commands

- `pnpm dev` runs every workspace `dev` script.
- `pnpm dev:web` starts the Inspektor application.
- Fast test feedback:
  - `pnpm test:web:node` runs the web Node project.
  - `pnpm test:web:jsdom` runs the isolated web jsdom project.
  - `pnpm test:design-system:node` runs the design-system Node allowlist.
  - `pnpm --filter @inspektor/ds test:json-view` runs the focused JSON View tests.
- Affected-package validation:
  - `pnpm test:web` runs the complete Inspektor package suite.
  - `pnpm test:design-system` runs the complete design-system package suite.
- Run `pnpm test` only when a change crosses package boundaries or requires complete workspace coverage.
- Inspektor application:
  - `pnpm --filter inspektor dev`
  - `pnpm --filter inspektor dev:vite`
  - `pnpm --filter inspektor build`
  - `pnpm --filter inspektor typecheck`
  - `pnpm --filter inspektor lint`
- Design-system package:
  - `pnpm --filter @inspektor/ds build`
  - `pnpm --filter @inspektor/ds typecheck`
  - `pnpm --filter @inspektor/ds lint`
- Design-system documentation:
  - `pnpm --filter inspektor.design-system dev`
  - `pnpm --filter inspektor.design-system test`
  - `pnpm --filter inspektor.design-system gen:props`
  - `pnpm --filter inspektor.design-system check:props`
  - `pnpm --filter inspektor.design-system build`
  - `pnpm --filter inspektor.design-system typecheck`
  - `pnpm --filter inspektor.design-system lint`

## Debugging workflow

- Treat a reported cause as a hypothesis. Compare broken and working paths and isolate their smallest implementation difference before editing.
- For rendering or performance defects, inspect runtime structure, computed styles, render fan-out, observers, layout reads, and DOM writes before changing global infrastructure.
- Do not change font loading, network hints, compositor hints, virtualization settings, or application bootstrap behavior without evidence that subsystem causes the defect.
- Confirm a regression test fails for the reported behavior, not because its fixture or test harness is incorrect.

## Performance optimization workflow

- Classify affected interactions as primary or optional before introducing lazy loading. Do not defer code required by a primary interaction without explicit approval.
- Define the user-visible performance invariant before optimizing bundle size. Preserve instant first interaction when the product must not expose loading feedback.
- Treat prefetch effectiveness as a hypothesis. Prove that the deferred boundary does not commit a fallback instead of assuming a fetched module renders synchronously.
- Prefer deferring heavy internals within a primary surface instead of deferring the surface itself.
- When bundle size and interaction immediacy conflict, present the measured trade-off before implementation.
- Validate cold first-use behavior in a production browser build. A performance change is incomplete until both bundle impact and interaction behavior are verified.
- Add a regression test for the user-visible invariant, including the absence of loading feedback when that absence is required.

## Editing and validation

- Preserve existing file formatting and exclude unrelated formatting churn from behavioral changes.
- Substantial refactors require a fresh whole-diff simplification pass across staged and unstaged changes. Search for newly single-use helpers, obsolete compatibility paths, dead mocks, redundant effects, and comments that only narrate visible code. Preserve local comments that encode ownership boundaries, invariants, failure contracts, or architectural reasoning, even when broader documentation covers the same system. Continue until a fresh pass finds no meaningful reduction; skip this gate for small isolated changes.
- After editing, run `pnpm -r --if-present format`, affected-package lint, and affected-package typecheck before considering the work complete.
- After a multi-hunk or replacement patch, inspect the resulting file or semantic diff before running tests.
- Validate in order: focused test, changed-file lint, browser behavior when applicable, affected-package typecheck and build, then one package-wide test pass.
- Run StyleX lint immediately after editing styles; follow a nearby passing property order instead of guessing or alphabetizing it.
- Prefer contract invariants over manually calculated expectations for long identifiers, Unicode strings, ranges, and offsets.
- Stabilize source APIs before regenerating metadata, and commit generated output with its source change.
- Do not modify the Git index unless the user requests it; inspect cached and working-tree diffs separately when changes are already staged.
- Before reporting a change as commit-ready, inspect `git status --short` and reject staged deletions whose replacement paths are untracked or unstaged.

## Architecture

- `packages/design-system` owns reusable presentation and interaction components.
- `apps/design-system` consumes public `@inspektor/ds` exports like a product application; it does not import package-private implementation files at runtime.
- `apps/web` owns Inspektor routes, application state, Jazz data access, and feature composition.
- The Inspektor is schema-driven and generic. Do not add generated query builders or table-specific UI for inspected applications; use stored schema metadata and generic query construction.
- Connection data includes `serverUrl`, `appId`, `adminSecret`, branch, and schema hash. Treat `adminSecret` as sensitive even when local links pass it in URL hash parameters.
- TanStack Router route trees are generated. Do not hand-edit `apps/web/src/routeTree.gen.ts` or `apps/design-system/src/routeTree.gen.ts`.

## Import boundaries

Follow `docs/importBoundaryPlaybook.md` when adding a heavy dependency, deferring optional behavior, or changing a dynamic import boundary.

- Keep optional heavy runtime imports inside a dedicated deferred module.
- Keep static bridge contexts free of the deferred dependency.
- Attach behavioral refs through the React components that own the rendered elements; do not reconnect behavior through DOM discovery, positional matching, or mutation observers.
- Treat a deferred provider insertion as a possible subtree remount and preserve required user state by semantic identity.
- Add boundary and behavior regression tests, then inspect production output when the import graph changes.

## Design-system constraints

- The architecture follows Polar's typed token model and shadcn CSS-in-JS's Base UI plus StyleX component structure without Tailwind component styling.
- Public component APIs must make off-system design decisions difficult to express.
- Do not expose `className`, inline `style`, arbitrary CSS values, or broad styling slot overrides from `@inspektor/ds` components.
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
- Examples import from `@inspektor/ds` and must not demonstrate styling escape hatches.
- Never edit generated `props.json` or route trees manually.

## Application rules

- `apps/web` imports reusable UI from `@inspektor/ds`.
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

## Referential stability contracts

- Use `Stable<T>` only at shared boundaries where consumers intentionally rely on reference identity, such as memoized context values or reusable hooks. Do not brand ordinary local values.
- Establish `Stable<T>` beside the mechanism that proves identity preservation: `useMemo`, `useCallback`, React state or ref containers, or a module-scope constant.
- Treat `asStable()` as an explicit trust boundary. Never use it only to silence a type error, and cover each new proof boundary with an identity regression test.
- A stable reference is not immutable and is not a reactive state version. Consumers of stable mutable containers must subscribe to their state instead of depending on container identity.
- Include every meaningful input in the memoization dependency set. The stable value must change when a consumer should be notified.
- Do not require branded versions of third-party return types in public props when the third-party API cannot produce the brand. Prove stability inside the design-system boundary instead.
- Do not add memoization without a consumer or boundary that benefits from stable identity.
- Standard React hook types do not enforce stable dependencies. Do not claim dependency-array enforcement unless the project adopts strict hook types that require `Stable<T>`.

## TypeScript conventions

- Use explicit boolean comparisons: `=== true` and `=== false`.
- Preserve strict settings including `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`.
- Prefix native Node imports with `node:`.
- Prefer unions and typed lookup records that make invalid states unrepresentable.
