# Validation reference

## Table of contents

- [Selection matrix](#selection-matrix)
- [Order](#order)
- [Preferred commands](#preferred-commands)

## Selection matrix

- Documentation only: documentation formatting and checks.
- Tests only: the changed test and affected suite.
- Styles only: StyleX lint, focused tests, and browser verification when appearance changes.
- Local implementation: focused tests, changed-file lint, and package typecheck.
- Public API or import graph: package build and consumer typecheck.
- Cross-package behavior: affected-package suites.
- Commit readiness: the complete prescribed gate.

## Order

1. Focused test for changed behavior.
2. Changed-file lint.
3. Package typecheck for implementation or public-type changes.
4. Browser verification for user-visible behavior.
5. Build for public API, import graph, bundling, or generated-output changes.
6. Package-wide tests for feature completion, cross-package behavior, or commit readiness.

Do not rerun a successful check unless a later edit invalidates it. Do not run builds for test-only or documentation-only changes. Run documented PNPM commands directly without output-transforming wrappers.

Run StyleX lint immediately after editing styles and follow a nearby passing property order.

Prefer contract invariants over manually calculated expectations for long identifiers, Unicode strings, ranges, and offsets.

For browser verification, fixture ownership, and credential handling, load `inspector-testing`.

## Preferred commands

- Inspektor web app Node tests: `pnpm test:web:node`
- Inspektor web app jsdom tests: `pnpm test:web:jsdom`
- Complete Inspektor web app suite: `pnpm test:web`
- Design-system documentation app tests: `pnpm test:web:design`
- Design-system Node tests: `pnpm test:design-system:node`
- Complete design-system suite: `pnpm test:design-system`
- Default workspace suite excluding design-system documentation app tests: `pnpm test`
- Complete workspace suite: `pnpm test && pnpm test:web:design`, only for cross-package changes or complete workspace coverage
- Web package: `pnpm --filter inspektor lint`, `pnpm --filter inspektor typecheck`, `pnpm --filter inspektor build`
- Design-system package: `pnpm --filter @inspektor/ds lint`, `pnpm --filter @inspektor/ds typecheck`, `pnpm --filter @inspektor/ds build`
- Design-system documentation: `pnpm --filter inspektor.design-system lint`, `pnpm --filter inspektor.design-system typecheck`, `pnpm test:web:design`, `pnpm --filter inspektor.design-system build`
- Inspektor Test validation and shared-cloud mutation boundaries are owned by `inspector-testing`.

Package manifests remain authoritative when scripts change.
