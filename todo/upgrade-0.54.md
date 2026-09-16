# Jazz alpha.54 migration

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Known alpha.54 table-loading issue](#known-alpha54-table-loading-issue)
- [Alpha.55 follow-up](#alpha55-follow-up)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[12/09/26]

- [x] Start admin-client creation concurrently with stored-schema and permissions loading.
- [x] Withhold client publication until stored-schema verification succeeds.
- [x] Shut down clients after schema failure, runtime replacement, stale resolution, or unmount.
- [x] Preserve the first fatal runtime error when concurrent startup work also fails.

[11/09/26]

- [x] Show selected-row provenance consistently in dedicated Provenance and complete JSON representations while keeping it outside mutation state.
- [x] Select provenance in the fallback query for a selected row outside the visible table page.

[10/09/26]

- [x] Upgrade the workspace Jazz packages to `2.0.0-alpha.54`.
- [x] Create browser admin runtimes through `createInspectorAdminClient` with explicit shutdown.
- [x] Replace `JazzClient.manager` with the exported subscription store while preserving deltas.
- [x] Use the standalone alpha.54 inspector's default live-query options.
- [x] Own dynamic table row typing inside Inspektor.
- [x] Migrate backend fixture clients to `createJazzSession`.
- [x] Replace alpha.54 `Db.upsert` seeding with deterministic writes that insert missing rows and update existing rows by stable ID.
- [x] Recognize payload-enum schema metadata in generic table presentation.
- [ ] Materialize alpha.54 payload-enum query values as `{ type, ...payload }`; alpha.54 leaves the internal `Enum` value unwrapped.
- [x] Remove global branch controls that no longer select Jazz data.
- [x] Make the relation fixture's `projects` table writable by inspector admin clients.

## Known alpha.54 table-loading issue

Jazz alpha.54 can publish a provisional empty subscription opening before a fresh Inspector admin client receives remotely stored rows.

The observed sequence is:

1. Inspektor shows `Loading rows` while the Jazz subscription is pending.
2. Jazz publishes an empty opening and marks the subscription fulfilled.
3. Inspektor shows `This table is empty`.
4. Jazz publishes the remotely stored rows.
5. Inspektor replaces the empty state with the populated grid.

This is a subscription-settlement problem and a separate performance question. The recording proves that the UI labels part of the wait as an empty result. It does not prove that alpha.54 takes longer than alpha.53 to deliver the final rows.

Tests against the published alpha.54 packages established these facts:

- A remote one-shot `db.all()` returns the existing server row.
- The first subscription callback returns `[]` for `remote`, `remote-if-possible`, `local-first`, and the internal `global` tier.
- The official standalone Inspector also uses a memory-backed admin client and local-first query options.
- Jazz issue [#2755](https://github.com/garden-co/jazz/issues/2755) tracks initial WASM subscription-materialization cost, but it has no release milestone or confirmed fix.
- Jazz issue [#1783](https://github.com/garden-co/jazz/issues/1783) tracks the broader subscription lifecycle and settlement contract.

Do not race the subscription with `db.all()`. Jazz warns that the one-shot snapshot can be older than subscription deltas already delivered. Do not use a timeout or wait for a second callback because a genuinely empty table might never produce another callback.

## Alpha.55 follow-up

Alpha.55 adoption and remaining validation are tracked in [Jazz alpha.55 adoption](./upgrade-0.55.md).

## Open product work

[10/09/26]

- [ ] Replace legacy global branch state with table-scoped `branchBy` head and base selection.
- [ ] Support single and compound branch coordinates in reads, row details, inserts, updates, and deletes.
- [ ] Decide how branch values and application-owned branch metadata are discovered.
- [ ] Block mutations on branched tables until their complete branch view is selected.
- [ ] Add `notIn` filter editing; alpha.54 exposes the operator but the existing token editor only supports `in`.
- [ ] Complete payload-enum support:
  - [ ] Add deterministic schema and seeded-value fixtures covering cases, required and nullable
        fields, and defaults.
  - [ ] Add grid coverage for valid cases, malformed values, and unavailable values.
  - [ ] Add case-aware editing, object parsing, and schema validation for required, nullable,
        defaulted, unknown, and incorrectly typed fields.
  - [ ] Add the payload-enum `match` filter UI and generic-query serialization.
  - [ ] Verify payload-enum read and write round trips in an isolated browser fixture.
  - [x] Keep payload enums non-sortable unless Jazz defines ordering semantics.
- [ ] Restore a public Jazz database round-trip test for row mutation submissions.
- [ ] Surface or prevent sessionless admin writes to `managedByCreator` tables; alpha.54 can report
      durability while dropping those writes.

## Work outside the foundation scope

[10/09/26]

- [ ] Create a fresh Jazz Cloud app or arrange migration assistance before connecting alpha.54 to alpha.53 data.
- [ ] Reinitialize and reseed shared Inspektor Test cloud data only through an explicitly approved deployment.
- [ ] Add bounded or streaming reads for large byte, text, and JSON columns.
- [x] Add sortable `$createdAt` and `$updatedAt` provenance columns through Jazz selection.

## Settled interaction decisions

[10/09/26]

- [x] Do not present a global branch picker that has no effect on alpha.54 queries.
- [x] Keep branch selection out of Jazz client identity.
- [x] Leave the query tier unset so local-first subscriptions retain full propagation.
- [x] Keep exact row-change highlighting through Jazz's exported framework subscription store.

## Open design decisions

[10/09/26]

- [ ] Decide whether `_dev/inspector-client` is an acceptable supported dependency or requires a stable upstream API.
- [ ] Decide how to migrate or discard `lastBranch`, `rememberedBranches`, and branch-keyed workspace storage.
- [ ] Decide whether branch selection belongs in the table header, workspace controls, or a dedicated branch view.
- [ ] Decide how live and frozen branch bases are represented without assuming application conventions.
- [ ] Resolve the lack of a public replacement for `hidden_from_live_query_list`.

## Validation checklist

[10/09/26]

- [x] Run focused provider, query, filter, and value-presentation tests.
- [x] Run web and Inspektor Test lint and typechecks.
- [x] Run the complete web suite.
- [x] Build the web package.
- [x] Verify shared-cloud row loading and insert persistence through a fresh browser context.
- [x] Run `lat check`.
