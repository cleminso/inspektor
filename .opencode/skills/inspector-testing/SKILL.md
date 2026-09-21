---
name: inspector-testing
description: Implements and organizes Inspektor tests, browser verification, and isolated Jazz fixtures with the correct Vitest and Playwright boundaries. Use when adding or changing tests, verifying user-visible behavior, or changing Inspektor Test schema, permissions, seeded data, or fixture tooling.
---

# Inspektor testing

## Table of contents

- [Choose the test boundary](#choose-the-test-boundary)
- [Name web Vitest files](#name-web-vitest-files)
- [Workspace ownership](#workspace-ownership)
- [Inspektor Test](#inspektor-test)
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
- `apps/studio` owns product feature, route-composition, runtime-boundary, and Worker behavior. Use Node for pure, Worker, and bundle tests and JSDOM for React behavior.
- `apps/design-system` owns only registry and catalog contracts, `AppShell`, and `ComponentDemo`. Do not add page-level tests or use this app to assert `@inspektor/ds` component correctness.
- `apps/website` uses Node for pure and Worker tests, JSDOM for React behavior, and Playwright E2E for built-site behavior.

Keep standalone Playwright E2E separate from Vitest. Vitest covers source-adjacent behavior; Playwright covers assembled applications and external boundaries.

## Inspektor Test

Read `apps/inspektor-test/README.md` before changing its schema, permissions, seeded data, or fixture tooling.

- Use `pnpm inspektor-test:fixture` for interactive isolated or destructive checks. Playwright owns the isolated fixture for automated acceptance.
- Use the shared cloud app only for explicit shared-network or manual verification.
- The owned local fixture process intentionally emits ephemeral credentials for local handoff. Consume them only for that fixture session; do not echo them into responses, screenshots, committed files, durable logs, or unrelated commands.
- Shared-cloud credentials remain strictly protected. Do not print, commit, screenshot, log, or otherwise expose them.
- Do not deploy, initialize, or seed the cloud app unless the task explicitly includes changing shared fixture state.
- Keep seeded rows deterministic and replaceable by stable ID.
- Use `createPolicyTestApp(app, permissions, expect)` from `jazz-tools/testing` for focused schema-permission tests. Use `createInspectorTestFixture()` for schema publication, deterministic seeding, serialization, integration, and browser-boundary tests.
- Shut down every policy test app in teardown. `expectDenied()` waits for serving-authority rejection when a write can be staged; use a synchronous throw assertion when the loaded policy rejects before staging. `expectAllowed()` only checks local staging and rolls the write back. Await the write at the `edge` tier when positive authority acceptance is part of the contract.

## Browser verification

### Automated acceptance

- Run `pnpm test:e2e` from the workspace root.
- Install the Playwright browser with `pnpm test:e2e:install`.
- Playwright owns the application server and isolated fixture. Do not start `pnpm dev:studio` or `pnpm inspektor-test:fixture` for this mode.

### Interactive inspection

1. Start `pnpm dev:studio` and `pnpm inspektor-test:fixture` from the workspace root as separate owned persistent processes.
2. Record both process IDs, confirm reachability, and stop only those processes after verification.
3. Use a fresh isolated Chrome context. Do not rely on persistent profile state.
4. Open the direct HTTP Vite URL when the fixture endpoint uses `http://` or `ws://`; an HTTPS page would block those fixture connections as mixed content.
5. Use the fixture process's ephemeral credential output only as the intentional local handoff described above.
6. Close pages created for the check, stop the owned processes, and leave unrelated development processes running.

Reserve persistent browser profiles and saved cloud connections for explicit shared-cloud exploration. Treat profile data as credentials.

## Focus indicators

- Use Vitest for Inspektor-owned focus movement, roving tab stops, manual activation, and keyboard/pointer parity.
- Use a real browser for visible-focus claims. Inspect computed outline style, width, color, clipping, filled-state contrast, and forced-colors presentation.
- Do not use generated StyleX class names as evidence that a focus indicator is visible.

## Validate

- Root Vitest suites: `pnpm test`
- Root Playwright E2E: `pnpm test:e2e`
- Playwright browser installation: `pnpm test:e2e:install`
- Complete repository gate: `pnpm check`
- Package-focused Vitest: `pnpm --filter <package> test`
- Inspektor Test lint: `pnpm --filter inspektor-test lint`
- Inspektor Test suite: `pnpm --filter inspektor-test test`
- Inspektor Test typecheck: `pnpm --filter inspektor-test typecheck`
- Inspektor Test cloud validation without publishing: `pnpm inspektor-test:validate`
- The commands above are safe local validation. `pnpm inspektor-test:deploy`, `pnpm inspektor-test:initialize`, and `pnpm inspektor-test:seed` mutate shared cloud state and require explicit task scope.
- Root `pnpm test` runs Inspektor Test schema, deterministic-data, and permission coverage but excludes `inspectorTestFixture.test.ts` while Jazz `2.0.0-alpha.56` rejects top-level JSON fixture writes. Do not treat a root pass as evidence that the complete fixture suite passes, and do not skip or remove the fixture tests.
- Run the affected package's complete suite after the focused command passes when the execution scope requires it.
