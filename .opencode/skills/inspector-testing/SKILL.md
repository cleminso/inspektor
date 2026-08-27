---
name: inspector-testing
description: Implements and organizes Inspector tests with the correct Vitest project and Playwright boundary. Use when adding, renaming, or changing tests in apps/web or packages/design-system.
---

# Inspector testing

## Choose the test boundary

1. Use Playwright under `apps/web/e2e` only for behavior that must cross the real browser, built application, or fixture boundary.
2. Otherwise use Vitest beside the source file.
3. Prefer the Node project when the test does not require DOM or browser globals.

## Name web Vitest files

- Pure TypeScript tests use `*.test.ts`; `apps/web` runs them in the Node project.
- TypeScript tests requiring `window`, DOM APIs, or the jsdom setup use `*.jsdom.test.ts`; `apps/web` runs them in the jsdom project.
- React tests use `*.test.tsx`; `apps/web` runs them in the jsdom project.
- Do not add test paths to a central environment allowlist or use `@vitest-environment` comments. The filename owns environment selection so agents cannot forget separate configuration bookkeeping.

## Design-system exception

`packages/design-system` defaults to jsdom. Keep its existing `@vitest-environment node` annotations and `test:node` allowlist unless that package adopts a measured, package-wide convention.

## Validate

- Web Node test: `pnpm --filter regarde.inspector test:node`
- Web jsdom test: `pnpm --filter regarde.inspector test:jsdom`
- Web browser test: `pnpm --filter regarde.inspector test:browser`
- Design-system Node allowlist: `pnpm --filter @inspector/ds test:node`
- Run the affected package's complete suite after the focused command passes.
