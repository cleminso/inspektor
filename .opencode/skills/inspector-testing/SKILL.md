---
name: inspector-testing
description: Implements and organizes Inspektor tests, browser verification, and isolated Jazz fixtures with the correct Vitest and Playwright boundaries. Use when adding or changing tests, verifying user-visible behavior, or changing Inspektor Test schema, permissions, seeded data, or fixture tooling.
---

# Inspektor testing

## Table of contents

- [Choose the test boundary](#choose-the-test-boundary)
- [Name web Vitest files](#name-web-vitest-files)
- [Design-system exception](#design-system-exception)
- [Inspektor Test](#inspektor-test)
- [Browser verification](#browser-verification)
- [Focus indicators](#focus-indicators)
- [Validate](#validate)

## Choose the test boundary

1. Use Playwright under `apps/web/e2e` only for behavior that must cross the real browser, built application, or fixture boundary.
2. Otherwise use Vitest beside the source file.
3. Prefer the Node project when the test does not require DOM or browser globals.

## Name web Vitest files

- Pure TypeScript tests use `*.test.ts`; `apps/web` runs them in the Node project.
- TypeScript tests requiring `window`, DOM APIs, or the jsdom setup use `*.jsdom.test.ts`; `apps/web` runs them in the jsdom project.
- React tests use `*.test.tsx`; `apps/web` runs them in the jsdom project.
- Do not add test paths to a central environment allowlist or use `@vitest-environment` comments. The filename owns environment selection.

## Design-system exception

`packages/design-system` defaults to jsdom. Keep its existing `@vitest-environment node` annotations and `test:node` allowlist unless that package adopts a measured package-wide convention.

## Inspektor Test

Read `apps/inspektor-test/README.md` before changing its schema, permissions, seeded data, or fixture tooling.

- Use `pnpm inspektor-test:fixture` for interactive isolated or destructive checks. Playwright owns the isolated fixture for automated acceptance.
- Use the shared cloud app only for explicit shared-network or manual verification.
- The owned local fixture process intentionally emits ephemeral credentials for local handoff. Consume them only for that fixture session; do not echo them into responses, screenshots, committed files, durable logs, or unrelated commands.
- Shared-cloud credentials remain strictly protected. Do not print, commit, screenshot, log, or otherwise expose them.
- Do not deploy, initialize, or seed the cloud app unless the task explicitly includes changing shared fixture state.
- Keep seeded rows deterministic and replaceable by stable ID.

## Browser verification

### Automated acceptance

- Run `pnpm test:browser` from the workspace root.
- Playwright owns the application server and isolated fixture. Do not start `pnpm dev:web` or `pnpm inspektor-test:fixture` for this mode.

### Interactive inspection

1. Start `pnpm dev:web` and `pnpm inspektor-test:fixture` from the workspace root as separate owned persistent processes.
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

- Inspektor web app Node test: `pnpm test:web:node`
- Inspektor web app jsdom test: `pnpm test:web:jsdom`
- Inspektor web app browser test: `pnpm test:browser`
- Design-system documentation app test: `pnpm test:web:design`
- Design-system Node allowlist: `pnpm test:design-system:node`
- Inspektor Test lint: `pnpm --filter inspektor-test lint`
- Inspektor Test suite: `pnpm --filter inspektor-test test`
- Inspektor Test typecheck: `pnpm --filter inspektor-test typecheck`
- Inspektor Test cloud validation without publishing: `pnpm inspektor-test:validate`
- The commands above are safe local validation. `pnpm inspektor-test:deploy`, `pnpm inspektor-test:initialize`, and `pnpm inspektor-test:seed` mutate shared cloud state and require explicit task scope.
- Run the affected package's complete suite after the focused command passes when the execution scope requires it.
