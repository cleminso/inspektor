# Inspektor agent instructions

Start with [lat.md/lat.md](lat.md/lat.md).

## Contents

- [Design and code](#design-and-code)
- [Testing](#testing)
- [Skills](#skills)
- [Documentation and progress](#documentation-and-progress)
- [Git and sensitive data](#git-and-sensitive-data)

## Design and code

- Read the owning contracts before planning. Use `lat search` and `lat section` before broad source searches. Verify claims against source; documents are not proof.
- Agree on scope and obtain approval before edits. Ask about conflicting contracts. Build only what the approved scope needs.
- Work in `apps/studio`, `apps/website`, `apps/design-system`, `packages/core`, and `packages/design-system`. Other implementation areas need an explicit request.
- Follow the [workspace boundaries](lat.md/architecture/boundaries.md) when assigning headless behavior, platform adapters, and reusable UI.
- Use explicit boolean comparisons, `node:` imports, and strict TypeScript settings. Prefer types that exclude invalid states.
- Keep generated route trees unchanged by hand. Preserve stable provider ancestry when changing routes.

## Testing

- Load `inspector-workflow` and follow its validation reference. Run checks for the changed boundary, not unrelated packages.
- Add focused regression checks for changed behavior within approved scope. Confirm that a bug test fails before the fix.
- Check observable results, preserved state, and forbidden effects. Use compiler checks for type contracts.
- Review assertions separately from implementation. Report unrun checks, test doubles, and validation gaps.
- New test infrastructure needs approval. Follow the [validation ownership](lat.md/architecture/boundaries.md#validation); lint and build checks do not prove runtime behavior.
- Complete independent review before reporting completion. Required failed checks remain blockers.

## Skills

- Load `inspector-workflow` for repository changes and reviews.
- Load `typescript-discipline` for shared types, state models, parsing, or narrowing.
- Load `product-design` for product UI; `create-inspector-component` for design-system components.
- Load `inspector-testing` for design-system or website tests and browser verification.
- Load `lat-md` for Lat edits and `todo` for work ledgers.
- Use available component-documentation guidance for public examples and metadata. Report missing skills instead of assuming they exist.

<!-- intent-skills:start -->

For substantial changes to TanStack behavior or an integration, run `pnpm dlx @tanstack/intent@latest list` at the workspace root. Load the most specific matching skill with `pnpm dlx @tanstack/intent@latest load <package>#<skill>`.

Run this check once per applicable task. Dependency presence, unrelated edits, and route-file edits without routing changes do not trigger it.

<!-- intent-skills:end -->

## Documentation and progress

- Lat owns contracts. `GLOSSARY.md` owns terms. `todo.md/` owns durable open work. Ideas remain proposals until accepted.
- Give each rule one owner. Link instead of repeating. Keep routine edit logs and completed task history out of contracts and ledgers.
- Update affected contracts and run `lat check`. Preserve source-linked anchors when moving topics.
- Use `todo.md/<responsibility>.md` and link it from `todo.md/index.md`. Each item needs a state, completion condition, and evidence or validation limit.
- This layout replaces legacy `todo/`, `specs/`, and `research/` guidance in unchanged skills. The import-boundary contract is `lat.md/architecture/importBoundaryPlaybook.md`.
- Write terse Simplified Technical English. Preserve technical identifiers.

## Git and sensitive data

- Record staged, unstaged, and untracked state separately. Preserve user changes and existing index entries.
- Change the index or create a commit only when the user explicitly requests that operation.
- Treat `adminSecret` values and persistent browser profiles as sensitive. Do not include them in documentation or logs.
