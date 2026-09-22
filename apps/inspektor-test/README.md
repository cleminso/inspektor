# Inspektor Test

Inspektor Test is a curated Jazz app for exercising Inspektor schema, permissions, data-grid, filtering, sorting, relation, and row-editor behavior.

## Table of contents

- [Purpose](#purpose)
- [Connection modes](#connection-modes)
- [Scenario inventory](#scenario-inventory)
- [Cloud app setup](#cloud-app-setup)
- [Ephemeral fixture](#ephemeral-fixture)
- [Commands](#commands)
- [Dependency security](#dependency-security)
- [Extending Inspektor Test](#extending-inspektor-test)
- [Agent rules](#agent-rules)

## Purpose

Inspeltor Test keeps supported UI cases discoverable and deterministic. It is a schema, permissions, and fixture package, not a web application or scratch database.

Use focused tables instead of adding every case to one table. Stable row IDs make seeding idempotent and keep browser checks comparable.

## Connection modes

### Shared cloud app

The cloud app provides one shared connection for manual exploration and browser verification. Its credentials belong in `apps/inspektor-test/.env.local` and must not be committed or printed.

Copy `.env.example` to `.env.local` and set the values issued by Jazz Cloud:

```text
VITE_JAZZ_APP_ID=<cloud-app-id>
VITE_JAZZ_SERVER_URL=https://v2.sync.jazz.tools/
JAZZ_ADMIN_SECRET=<cloud-admin-secret>
BACKEND_SECRET=<cloud-backend-secret>
```

### Isolated fixture

The isolated fixture uses `jazz-tools/testing` to create an in-memory local server, publish the same schema and permissions, and seed the same rows. Stopping the fixture removes its data. Focused permission tests use Jazz's `createPolicyTestApp()` helper instead of rebuilding ordinary client sessions through the full fixture.

## Scenario inventory

| Table | Cases |
| --- | --- |
| `columnTypeShowcase` | Required Jazz column types plus populated and null optional values |
| `contentEdgeCases` | Empty, whitespace, long, multiline, Unicode, bidirectional, nested JSON, and byte values |
| `creatorManagedRecords` | Creator-managed permissions |
| `emptyRecords` | A valid table with no seeded rows |
| `paginationRecords` | Enough deterministic rows to cross the first page boundary |
| `projects` | A compact referenced table used by relation scenarios |
| `publicEditableRecords` | Public read, insert, update, and delete permissions |
| `publicReadOnlyRecords` | Public reads with denied mutations |
| `relationParents` | Relation targets |
| `relationChildren` | Required, populated optional, and null optional relations |
| `todos` | Self-relations plus conditional update and delete permissions |
| `uiPerformanceRecords` | All currently insertable scalar and collection column types for UI performance data |
| `wideRecords` | Horizontal overflow, long headers, mixed types, and optional-value pairs |

## Cloud app setup

1. Create and claim an app in Jazz Cloud.
2. Add its app ID, admin secret, backend secret, and server URL to `.env.local`.
3. Validate Inspektor Test with `pnpm inspektor-test:validate`.
4. Initialize an empty cloud app with `pnpm inspektor-test:initialize`.
5. Seed deterministic rows with `pnpm inspektor-test:seed`.
6. Add the same connection values to Inspektor and name it `Inspektor Test`.

Structural changes to the cloud app may require a Jazz migration. Create the required migration reported by `jazz-tools`, review it, and run the deploy command again.

## Ephemeral fixture

Run:

```text
pnpm inspektor-test:fixture
```

The command prints readiness text followed by one JSON object containing the connection name, server URL, app ID, admin secret, environment, and branch. Use those values in Inspektor. Press Ctrl+C to stop the fixture.

Automated tests can import `createInspectorTestFixture()` from `inspectorTestFixture.ts` and must call `fixture.stop()` in teardown. The integration suite verifies schema publication, serialized edge-case values, relations, repeatable seeding, and server disposal.

Permission tests use `createPolicyTestApp(app, permissions, expect)` from `jazz-tools/testing` and must call `testApp.shutdown()` in teardown. Use `testApp.as(session)` for identity-scoped reads and writes. `expectDenied()` waits for authority rejection when a write can be staged; use a synchronous throw assertion when the loaded policy rejects before staging. `expectAllowed()` only verifies local staging and rolls the write back. Await a write at the `edge` tier when a test needs to prove authority acceptance.

Inspektor browser acceptance tests run with `pnpm test:e2e`. Playwright owns a built application, a direct loopback server, and an ephemeral Inspektor Test fixture; it never uses the shared cloud connection.

## Commands

| Command | Action |
| --- | --- |
| `pnpm inspektor-test:validate` | Validate schema and permissions without publishing |
| `pnpm inspektor-test:initialize` | Publish the first cloud schema and permissions |
| `pnpm inspektor-test:deploy` | Publish the cloud schema and permissions |
| `pnpm inspektor-test:seed` | Seed deterministic cloud rows by inserting missing rows and updating existing rows |
| `pnpm inspektor-test:fixture` | Start an isolated local app |
| `pnpm --filter inspektor-test test` | Test schema metadata, serialized data, relations, permission contracts, repeatable seeding, and fixture disposal |
| `pnpm test:e2e` | Run standalone Playwright E2E against built applications and isolated fixtures |
| `pnpm test:e2e:install` | Install the Playwright Chromium browser |

The root `pnpm test` command runs the schema, deterministic-data, and permission suites but excludes `inspectorTestFixture.test.ts`. Jazz `2.0.0-alpha.56` still rejects native writes to top-level `s.json()` columns; this is tracked upstream in [Jazz issue #1865](https://github.com/garden-co/jazz/issues/1865). The complete fixture suite and Playwright acceptance remain blocked until a compatible Jazz release is available. Do not skip or remove those fixture tests to make the package command pass.

## Dependency security

Inspeltor Test uses the current Jazz 2 `jazz-tools` package rather than the retired `create-jazz-app` package layout. Jazz currently pins vulnerable transitive versions of `protobufjs`, `@opentelemetry/core`, and `esbuild`. The workspace overrides those dependencies to patched compatible versions in `pnpm-workspace.yaml`.

Keep the overrides until `jazz-tools` resolves to patched versions without them. Verify removal with `pnpm audit --prod` and the Inspeltor Test validation commands.

## Extending Inspektor Test

1. Add a focused table or column case to `schema.ts`.
2. Add its permission shape to `permissions.ts`.
3. Add deterministic rows and UUIDs to `inspectorTestData.ts` when the case needs data.
4. Add the corresponding insert-or-update logic to `seedInspectorTest.ts`.
5. Update the scenario inventory in this README.
6. Add or update fixture tests for publication, seeding, serialization, or integration behavior.
7. Add or update `permissions.test.ts` with `createPolicyTestApp()` when permissions change.
8. Validate with the package test, typecheck, and schema validation commands.

Prefer additive schema changes. Use the isolated fixture for destructive schema experiments.

## Agent rules

- Use the isolated fixture for automated and destructive checks.
- Use the cloud app for explicit shared-network or manual browser verification.
- Do not deploy or seed the cloud app unless the task requires changing shared fixture state.
- Do not expose cloud secrets in logs, URLs, screenshots, responses, or committed files.
- Treat `.env.local` as the source of cloud credentials.
- Keep seeded values deterministic and safe to replace by stable ID.
