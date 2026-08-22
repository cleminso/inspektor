# Inspector Test

Inspector Test is a curated Jazz app for exercising Inspector schema, permissions, data-grid, filtering, sorting, relation, and row-editor behavior.

## Table of contents

- [Purpose](#purpose)
- [Connection modes](#connection-modes)
- [Scenario inventory](#scenario-inventory)
- [Cloud app setup](#cloud-app-setup)
- [Ephemeral fixture](#ephemeral-fixture)
- [Commands](#commands)
- [Dependency security](#dependency-security)
- [Extending Inspector Test](#extending-inspector-test)
- [Agent rules](#agent-rules)

## Purpose

Inspector Test keeps supported UI cases discoverable and deterministic. It is not a product application or a scratch database.

Use focused tables instead of adding every case to one table. Stable row IDs make seeding idempotent and keep browser checks comparable.

## Connection modes

### Shared cloud app

The cloud app provides one shared connection for manual exploration and browser verification. Its credentials belong in `apps/my-jazz-app/.env.local` and must not be committed or printed.

Copy `.env.example` to `.env.local` and set the values issued by Jazz Cloud:

```text
VITE_JAZZ_APP_ID=<cloud-app-id>
VITE_JAZZ_SERVER_URL=https://v2.sync.jazz.tools/
JAZZ_ADMIN_SECRET=<cloud-admin-secret>
BACKEND_SECRET=<cloud-backend-secret>
```

### Isolated fixture

The isolated fixture uses `jazz-tools/testing` to create an in-memory local server, publish the same schema and permissions, and seed the same rows. Stopping the fixture removes its data.

## Scenario inventory

| Table | Cases |
| --- | --- |
| `columnTypeShowcase` | Required Jazz column types plus populated and null optional values |
| `contentEdgeCases` | Empty, whitespace, long, multiline, Unicode, bidirectional, nested JSON, and byte values |
| `creatorManagedRecords` | Creator-managed permissions |
| `emptyRecords` | A valid table with no seeded rows |
| `projects` | A compact referenced table used by the sample app |
| `publicEditableRecords` | Public read, insert, update, and delete permissions |
| `publicReadOnlyRecords` | Public reads with denied mutations |
| `relationParents` | Relation targets |
| `relationChildren` | Required, populated optional, and null optional relations |
| `todos` | Conditional update and delete permissions used by the sample app |
| `wideRecords` | Horizontal overflow, long headers, mixed types, and optional-value pairs |

## Cloud app setup

1. Create and claim an app in Jazz Cloud.
2. Add its app ID, admin secret, backend secret, and server URL to `.env.local`.
3. Validate Inspector Test with `pnpm inspector-test:validate`.
4. Initialize an empty cloud app with `pnpm inspector-test:initialize`.
5. Seed deterministic rows with `pnpm inspector-test:seed`.
6. Add the same connection values to Inspector and name it `Inspector Test`.

Structural changes to the cloud app may require a Jazz migration. Create the required migration reported by `jazz-tools`, review it, and run the deploy command again.

## Ephemeral fixture

Run:

```text
pnpm inspector-test:fixture
```

The command prints one JSON object containing the connection name, server URL, app ID, admin secret, environment, and branch. Use those values in Inspector. Press Ctrl+C to stop the fixture.

Automated tests can import `createInspectorTestFixture()` from `inspectorTestFixture.ts` and must call `fixture.stop()` in teardown. The integration suite verifies schema publication, serialized edge-case values, relations, repeatable seeding, and server disposal.

## Commands

| Command | Action |
| --- | --- |
| `pnpm inspector-test:validate` | Validate schema and permissions without publishing |
| `pnpm inspector-test:initialize` | Publish the first cloud schema and permissions |
| `pnpm inspector-test:deploy` | Publish the cloud schema and permissions |
| `pnpm inspector-test:seed` | Upsert deterministic cloud rows |
| `pnpm inspector-test:fixture` | Start an isolated local app |
| `pnpm --filter inspector-test test` | Test schema metadata, serialized data, relations, repeatable seeding, and fixture disposal |

## Dependency security

Inspector Test uses the current Jazz 2 `jazz-tools` package rather than the retired `create-jazz-app` package layout. Jazz currently pins vulnerable transitive versions of `protobufjs`, `@opentelemetry/core`, and `esbuild`. The workspace overrides those dependencies to patched compatible versions in `pnpm-workspace.yaml`.

Keep the overrides until `jazz-tools` resolves to patched versions without them. Verify removal with `pnpm audit --prod` and the Inspector Test validation commands.

## Extending Inspector Test

1. Add a focused table or column case to `schema.ts`.
2. Add its permission shape to `permissions.ts`.
3. Add deterministic rows and UUIDs to `inspectorTestData.ts` when the case needs data.
4. Add the corresponding upsert to `seedInspectorTest.ts`.
5. Update the scenario inventory in this README.
6. Add or update tests that state the supported case.
7. Validate with the package test, typecheck, and schema validation commands.

Prefer additive schema changes. Use the isolated fixture for destructive schema experiments.

## Agent rules

- Use the isolated fixture for automated and destructive checks.
- Use the cloud app for explicit shared-network or manual browser verification.
- Do not deploy or seed the cloud app unless the task requires changing shared fixture state.
- Do not expose cloud secrets in logs, URLs, screenshots, responses, or committed files.
- Treat `.env.local` as the source of cloud credentials.
- Keep seeded values deterministic and safe to replace by stable ID.
