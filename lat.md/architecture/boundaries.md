# Workspace boundaries

Applications own product behavior. The design system owns reusable presentation and interaction. These boundaries keep application data and optional dependencies out of shared UI.

## Contents

Use these rules when assigning code or choosing validation.

- [Owners](#owners)
- [Validation](#validation)

## Owners

Each workspace has one primary responsibility.

| Workspace                | Responsibility                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| `apps/studio`            | Routes, session state, Jazz access, and inspection features.      |
| `packages/design-system` | Reusable components, interaction, tokens, and brand presentation. |
| `apps/design-system`     | Public component documentation, examples, and registry contracts. |
| `apps/website`           | Public routes, copy, metadata, analytics, and page assembly.      |

Applications consume public `@inspektor/ds` exports, not package-private source paths. Studio does not recreate Base UI behavior.

See [[designSystem|Design system]] for presentation rules, [[importBoundaryPlaybook|Import boundaries]] for optional dependencies, and [[website|Website]] for the public request boundary.

## Validation

Checks prove different boundaries. Source consumption does not prove package distribution, and a build does not prove browser behavior.

- Design-system tests own reusable component correctness.
- The documentation app tests its registry, catalog, shell, and demo contracts, not every component page.
- Website tests cover local behavior; Playwright covers built-site browser behavior.
- Studio has no automated test suite. Use lint, typecheck, build, and Worker checks; report runtime verification separately.

Use the [workflow validation reference](../../.opencode/skills/inspector-workflow/references/validation.md).
