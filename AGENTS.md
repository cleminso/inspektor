<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task that changes TanStack behavior or directly changes a TanStack integration:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Run the skill check once per applicable task, not once per file or workspace package.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
- Do not run the skill check merely because the containing workspace package depends on TanStack.
- Do not run it for unrelated styling, copy, documentation, generic component, Jazz, or product-logic changes that do not alter a TanStack integration.
- Editing a route file only triggers the skill check when the task changes routing behavior or route generation.

<!-- intent-skills:end -->

# Agent Notes

## Table of contents

- [Repository knowledge](#repository-knowledge)
- [Skill routing](#skill-routing)
- [Active workspace](#active-workspace)
- [Git index ownership](#git-index-ownership)
- [Architecture](#architecture)
- [Route lifecycle](#route-lifecycle)
- [Design-system boundaries](#design-system-boundaries)
- [Repository invariants](#repository-invariants)
- [TypeScript conventions](#typescript-conventions)

## Repository knowledge

- Before broad repository searches, run `lat search` for relevant architecture, ownership, behavior, decisions, and implementation paths. Read useful matches with `lat section`.
- Treat Lat as navigation, not proof. Verify implementation claims against source, tests, manifests, generated output, or runtime behavior as applicable. Report conflicts.
- When a change alters documented behavior, architecture, tests, or accepted decisions, update the relevant current-state Lat sections and run `lat check`.
- Keep long-lived component checklists in `todo/`, bounded lifecycle plans in `specs/<camelCase>/plan.md`, optional plan detail beside them, and supporting evidence in `research/`. Spec folders without `plan.md` are legacy accepted specifications, not lifecycle plans. Do not use `lat.md/` as a changelog or task ledger.

## Skill routing

- Load `inspektor-workflow` before planning, implementing, validating, debugging, optimizing performance, reviewing, or preparing repository changes for commit.
- Load `typescript-discipline` when changing TypeScript configuration, domain or state models, reusable or public types, boundary parsing, or code that relies on assertions or custom narrowing.
- Load `product-design` for user-visible product or design decisions and UI implementation checklists.
- Load `create-inspector-component` when adding or changing `@inspektor/ds` components, public component APIs, Base UI wrappers, or StyleX component behavior.
- Load `document-inspector-component` when adding a public component or changing its documentation, examples, registry metadata, or generated prop metadata.
- Load `inspector-testing` when adding or changing tests, running browser verification, or working with Inspektor Test fixtures, schema, permissions, or seeded data.

## Active workspace

Implementation work is limited to:

- `packages/design-system`: reusable `@inspektor/ds` components, primitives, and tokens.
- `apps/design-system`: documentation, playgrounds, and design-system validation.
- `apps/studio`: Inspektor routes, product state, Jazz access, and feature composition.
- `apps/website`: public website routes, copy, metadata, and brand-page composition.
- `apps/inspektor-test`: deterministic test schema, data, deployment tooling, and isolated fixtures.

Other workspace packages require an explicit user request.

## Git index ownership

- Record the working tree and Git index before implementation so task changes remain distinguishable from user-owned changes.
- Treat the Git index as user-owned state. Never unstage, restage, replace, or remove an entry that was staged at task entry.
- Do not run `git add`, `git reset`, `git restore --staged`, `git rm --cached`, `git apply --cached`, commit commands, or equivalent index-writing operations unless the user explicitly requests that exact operation.
- Inspect staged and working-tree changes separately and report differences without reconciling them through index changes.

## Architecture

- `packages/design-system` owns reusable presentation and interaction components.
- `apps/design-system` consumes public `@inspektor/ds` exports and never imports package-private implementation files at runtime.
- `apps/studio` owns routes, application state, Jazz data access, and feature composition. Move reusable presentation and interaction behavior into `packages/design-system`.
- `apps/website` owns public website routes, copy, metadata, SEO, analytics, and page assembly. Reusable brand presentation belongs in `packages/design-system/src/brand`.
- Do not recreate Base UI behavior in `apps/studio`.
- The Inspektor is schema-driven and generic. Do not add table-specific UI or generated query builders for inspected applications.

## Route lifecycle

- Keep provider and outlet ancestry unconditional on routes that own shared lifecycle state.
- Put route-specific layouts on child routes instead of conditionally wrapping a parent outlet from current or pending location state.
- Treat an outlet wrapper change as a lifecycle change: React remounts the descendant tree, which restarts providers, requests, clients, subscriptions, and local state.
- Use a React `key` to reset a routed subtree only when that reset is intentional and covered by a lifecycle test.

## Design-system boundaries

- The design system uses typed tokens with Base UI and StyleX; do not use Tailwind for component styling.
- `apps/studio` imports reusable UI from `@inspektor/ds`; application code owns feature and data logic.
- Public components and application code cannot bypass the design system with `className`, inline `style`, raw HTML layout, arbitrary CSS values, or broad styling slot overrides.
- Add a semantic token, constrained prop, variant, primitive, or composed component when the system cannot express a valid design. Necessary escape hatches require explicit, narrow, auditable lint suppression.

## Repository invariants

- Treat connection `adminSecret` values, fixture credentials, and persistent browser profiles as sensitive.
- Never hand-edit `apps/studio/src/routeTree.gen.ts` or `apps/design-system/src/routeTree.gen.ts`.

## TypeScript conventions

- Use explicit boolean comparisons: `=== true` and `=== false`.
- Prefix native Node.js imports with `node:`.
- Preserve strict settings, including `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`.
- Prefer unions and typed lookup records that make invalid states unrepresentable.
