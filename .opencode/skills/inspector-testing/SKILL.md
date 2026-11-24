---
name: inspector-testing
description: Implements and organizes design-system and website tests and browser verification with the correct Vitest and Playwright boundaries. Use when adding or changing tests in those packages or verifying their user-visible behavior.
---

# Inspektor testing

## Table of contents

- [Choose the test boundary](#choose-the-test-boundary)
- [Name web Vitest files](#name-web-vitest-files)
- [Workspace ownership](#workspace-ownership)
- [Browser verification](#browser-verification)
- [Focus indicators](#focus-indicators)
- [Validate](#validate)

## Choose the test boundary

1. Use standalone Playwright E2E only for behavior that must cross the built application, routing, server, or fixture boundary.
2. Otherwise use Vitest beside the source file.
3. Use the Node project for pure logic and JSX bundle-graph checks.
4. Use JSDOM for React component, feature, and route-composition behavior.

Do not use Vitest Browser Mode. The repository does not maintain visual snapshots; verify appearance interactively when a visual claim matters.

## Name web Vitest files

- Pure Node tests use `*.test.ts`.
- Node tests that need JSX syntax use `*.node.test.tsx`; reserve this form for bundle and import-graph checks rather than rendered behavior.
- React, component, and feature JSDOM tests use `*.test.tsx`.
- Non-React tests that require DOM globals use `*.jsdom.test.ts`.
- Do not add test paths to a central environment allowlist or use `@vitest-environment` comments. The filename owns environment selection.

## Workspace ownership

- `packages/design-system` owns component correctness. Use Node for pure and bundle tests and JSDOM for component behavior.
- `apps/studio` has no automated test suite. Use lint, typecheck, and build for Studio changes.
- `apps/design-system` owns only registry and catalog contracts, `AppShell`, and `ComponentDemo`. Do not add page-level tests or use this app to assert `@inspektor/ds` component correctness.
- `apps/website` uses Node for pure and Worker tests, JSDOM for React behavior, and Playwright E2E for built-site behavior.

Keep standalone Playwright E2E separate from Vitest. Vitest covers source-adjacent behavior; Playwright covers assembled applications and external boundaries.

## Browser verification

### Automated acceptance

- Run `pnpm test:e2e` from the workspace root.
- Install the Playwright browser with `pnpm test:e2e:install`.
- Playwright owns the website test server.

### Interactive inspection

1. Start the target website using its documented development command.
2. Record the process ID, confirm reachability, and stop only that process after verification.
3. Use a fresh isolated Chrome context. Do not rely on persistent profile state.
4. Use the correct protocol for the target server.
5. Close pages created for the check, stop the owned process, and leave unrelated development processes running.

## Focus indicators

- Use design-system Vitest tests for component-owned focus movement, roving tab stops, manual activation, and keyboard/pointer parity.
- Use a real browser for visible-focus claims. Inspect computed outline style, width, color, clipping, filled-state contrast, and forced-colors presentation.
- Do not use generated StyleX class names as evidence that a focus indicator is visible.

## Validate

- Root Vitest suites: `pnpm test`
- Root Playwright E2E: `pnpm test:e2e`
- Playwright browser installation: `pnpm test:e2e:install`
- Complete repository gate: `pnpm check`
- Package-focused Vitest: `pnpm --filter <package> test`
- Studio is not part of the automated test suites. Use its package lint, typecheck, and build commands.
- Run the affected package's complete suite after the focused command passes when the execution scope requires it.
