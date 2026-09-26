# Table row query lifecycle

This document traces a table row query from route state through Jazz subscription and grid rendering.

## Table of contents

This table of contents links to the document sections.

- [Purpose](#purpose)
- [Ownership boundaries](#ownership-boundaries)
- [Runtime readiness](#runtime-readiness)
- [Execution flow](#execution-flow)
- [Query construction](#query-construction)
- [Subscription lifecycle](#subscription-lifecycle)
- [Remote opening contract](#remote-opening-contract)
- [Grid presentation states](#grid-presentation-states)
- [Pagination and bounded rendering](#pagination-and-bounded-rendering)
- [Implementation map](#implementation-map)
- [Maintenance constraints](#maintenance-constraints)

## Purpose

As defined by [[tableExplorerBehaviors#Behavior model|the Table Explorer behavior model]], the Table Explorer renders before runtime readiness and starts its row query when the verified schema and Jazz client are available. The Inspektor runtime uses the in-memory Jazz driver, so inspected

admin data is not persisted to browser storage.

## Ownership boundaries

React hooks, Jazz orchestration, and DataGrid presentation each own a separate part of the query lifecycle.

- `useTableRows` owns table-query derivation, compatible-row preservation, pagination, and view-facing status flags.
- `useJazzQueryState` adapts one Jazz subscription-store cache entry to React through `useSyncExternalStore`.
- Jazz's `SubscriptionsOrchestrator` owns query-key generation, cache-entry reuse, subscription delivery, and reference counting.
- `DataGrid` owns reusable loading, empty, complete-row, and virtual-row presentation without knowing about Jazz.

## Runtime readiness

Schema verification and admin-client creation overlap, but the table cannot query Jazz until both operations succeed.

Accepted connection intent starts one best-effort WASM preparation. `RuntimeAdminClient` waits for that shared preparation before it creates the admin client, which avoids competing initialization while preserving concurrent schema and client startup.

`RuntimeAdminClient` publishes the client only after the selected stored schema is verified. A schema failure, runtime replacement, or unmount retires the client attempt and shuts down any client that has resolved. The first fatal startup error remains the runtime error when concurrent work also fails.

While either the client or schema is absent, `useTableRows` reports initial loading and `useJazzQueryState` does not register a subscription. `ConnectionContentBoundary` keys readiness to table and query-route identity, keeping initial, direct-link, and browser-history data destinations behind the connection fallback until their canonical row query settles. Schema views can reveal once route and tab identity agree.

## Execution flow

The query flow resolves route state, subscribes through Jazz, and projects the result into product states.

### 1. Resolve route state

The table route provides filters, sorting, page, and page size. `resolveTableRowsSearch` applies defaults and malformed-search handling

before the query is built.

### 2. Wait for runtime readiness

`useTableRows` waits for the verified schema and published admin client. Missing prerequisites keep the table in initial loading without acquiring a Jazz cache entry.

### 3. Prepare, build, and subscribe to the query

The tables index prepares the selected recent or default table's exact data query and waits for its canonical Jazz entry to fulfill
before committing route navigation.

`useTableRows` calls `buildTableRowsQuery` with the resolved route state and `INSPEKTOR_QUERY_OPTIONS`. `useJazzQueryState` acquires the

canonical Jazz cache entry and subscribes React to its state.

After a default-size page fulfills with another page available, `useTableRows` keeps one exact next-page query prepared. Navigating forward adopts that canonical entry and prepares the following page. Larger page sizes remain demand-loaded to avoid speculative 500- or 1000-row transfers.

Application-initiated table, filter, sort, page-size, and pagination navigation prepares the destination's exact canonical entry before changing route identity. The current compatible view remains committed while preparation is pending. Pagination accepts one foreground request at a time, preventing rapid input from creating a chain of intermediate page subscriptions. Runtime, schema, workspace, or route replacement invalidates pending preparation before it can commit.

One workspace preparation coordinator owns foreground navigation. Table, filter, sort, page-size, and workspace-history intents replace an older pending preparation; pagination ignores additional input while its first request is pending. Workspace history also accepts one browser traversal at a time once a prepared traversal starts. The coordinator sits outside the unchanged mutation-workspace, navigation-history, and table-tabs provider ancestry.

Direct links and native browser history update route identity without foreground preparation. `ConnectionContentBoundary` keys readiness to the exact table route query and keeps the connection fallback visible until that destination reports ready. The routed provider and outlet ancestry remains mounted.

### 4. Project query state into UI state

`useJazzQueryState` exposes `idle`, `pending`, `fulfilled`, and `rejected` states. `useTableRows` derives the product states:

- initial loading when no compatible rows have resolved
- refreshing when sorting changes within the same table-page data scope
- rejected query error text

Resolved rows remain visible while compatible sorting work is pending.

## Query construction

The query identity includes:

- query builder serialization
- sort column and direction
- page and page size
- page-derived query offset
- extra-row pagination probe

The query selects the schema columns plus `$createdAt`, `$createdBy`, `$updatedAt`, and `$updatedBy`.
The grid keeps author provenance hidden by default and exposes it through column visibility controls.
The complete-row JSON and Provenance representations expose the selected row's provenance as read-only metadata.
When the selected row leaves the visible page, its identity fallback query uses the same explicit provenance projection.

Inspektor uses the `remote` tier and treats the canonical entry's first fulfilled value as the opening
result. The same subscription then receives server changes.

Change route defaults in `tableRowsSearch.ts`, query construction in `tableRowsQuery.ts`, and Jazz options in `queryOptions.ts`.

## Subscription lifecycle

The rendered table acquires one canonical Jazz cache entry and releases it through React cleanup.

The runtime provider owns bounded recovery from the verified Jazz message-credit transport failure. The rendered table-rows query reports its
settlement against the client that produced it. A recognized terminal rejection replaces the runtime and admin client once while the
workspace remains mounted. The grid presents `Reconnecting…` until the active row query fulfills through the replacement client. A
replacement rejection exhausts the automatic attempt and presents generic query-failure copy; internal Jazz error text is never shown.
Successful replacement settlement rearms recovery for a separate incident.

Initial-route preparation, foreground navigation, and one default-size next-page lookahead may temporarily own exact canonical entries through the same public Jazz subscription store.

The rendered table owns its subscription through `useSyncExternalStore`. React calls the returned cleanup when the active query entry
changes or the component unmounts. Page, page-size, filter, sort, schema, table, or client changes acquire the matching query entry.
Prepared ownership remains active through navigation completion and is released on completion, replacement, or scope invalidation. The rendered consumer acquires the same canonical cache entry, whose Jazz-owned retention bridges subscription cleanup and acquisition without an application row cache. Preparation never runs row-insert feedback, page correction, or other rendered-query product effects.

## Remote opening contract

The isolated Jazz contract shows alpha.57 suppressing the immediate local-first empty opening for a
single-row remote subscription.

The sorted, limited, and offset contract remains an expected failure: remote replay can fulfill on an
incremental result before every authoritative row is available. Inspektor does not add a callback-count,
timeout, or snapshot race over Jazz's canonical entry promise, so canonical fulfillment is not proof that
a hosted opening is complete.

Contract tests use the published `jazz-tools` package with `createInspectorAdminClient` and an isolated
Jazz server. They verify populated remote, empty remote, and local-first openings, and preserve the
desired paginated and sorted opening as an expected failure. Local-first retains its immediate empty
opening for a fresh standalone memory client, so it is not the table-read policy.

The maintained subscription remains the only row source. Do not add a timeout, callback-count
heuristic, or raced `db.all()` snapshot.

## Grid presentation states

The grid distinguishes initial loading, compatible refresh, resolved rows, empty results, and errors.

| Query state            | Existing compatible rows | Grid body                       | Toolbar pagination |
| ---------------------- | ------------------------ | ------------------------------- | ------------------ |
| Pending                | No                       | Spinner and `Loading rows`      | Available          |
| Pending refresh        | Yes                      | Existing rows                   | Available          |
| Fulfilled with rows    | Not applicable           | Resolved rows                   | Available          |
| Fulfilled without rows | Not applicable           | Filtered or table-empty message | Available          |
| Rejected               | No compatible result     | Error message                   | Available          |
| Recovering transport   | Not applicable           | Spinner and `Reconnecting…`     | Available          |

Query errors use product-owned copy rather than rendering unknown Jazz error messages.

The loading body uses the design-system spinner and visible status text. It communicates pending work without implying a result count
or record shape.

Duplicated-row insertions remain in mutation review and do not enter the query-row projection. Applying an insertion lets the Jazz live
query publish the persisted row at its authoritative filtered and sorted position; failed insertions remain retryable. Pagination,
export, selection, navigation, and rendering therefore operate on one Jazz-owned row collection.

## Pagination and bounded rendering

The table route stores a one-based page and a constrained page size. The default page size is 100 rows; supported alternatives are 500

and 1000 rows. Default values are omitted from the URL. Filter and sort changes reset the page to one.

Each Jazz query uses `offset = (page - 1) x pageSize` and requests `pageSize + 1` rows. The extra row is not rendered; it enables the
next-page control without a separate total-count query. Non-ID sorts add ascending ID order as a deterministic tie-breaker.

A result without the extra probe row proves the end of the result set.

Pagination renders a lower-bound row status, compact page-size selector, previous and next actions, and a `Page x` label. While another
page exists, the row status uses a lower bound such as `1-100 of 101+`. The final page can show an exact total. During foreground page
or page-size preparation, the toolbar keeps the committed range and page visible while disabling pagination controls. Route metadata
commit after the exact canonical remote query fulfills. The remote-opening limitation below still applies.

`DataGrid.Content` renders the default 100-row page directly and virtualizes larger pages with a bounded mounted row window. Grid
checkboxes provide explicit label relationships so Base UI does not discover labels across every mounted hidden input after each
commit. Page, page-size, filter, and sort scope changes reset both scroll axes without remounting the viewport.

Only the default 100-row size automatically prepares its exact next page. The 500- and 1000-row sizes remain demand-loaded.

## Implementation map

These source modules implement route resolution, Jazz querying, state projection, controls, and grid rendering.

- `apps/studio/src/app/runtime/jazzWasmPreparation.ts`: shared best-effort WASM preparation.
- `apps/studio/src/app/providers/inspectorProvider.tsx`: concurrent client ownership and verified publication.
- `apps/studio/src/app/runtime/useInspectorRuntime.tsx`: schema, permissions, client, and error projections.
- `apps/studio/src/app/runtime/connectionContentBoundary.tsx`: mounted-content visibility boundary.
- `apps/studio/src/routes/conn/$connectionId.tsx`: connection-scoped foreground preparation ownership.
- `apps/studio/src/routes/conn/$connectionId/tables.tsx`: unconditional workspace provider composition and route-query readiness identity.
- `apps/studio/src/features/tables/routing/tableRowsSearch.ts`: route query-state resolution.
- `apps/studio/src/features/tables/routing/tableNavigationPreparation.tsx`: foreground navigation preparation, replacement, and cancellation ownership.
- `apps/studio/src/features/tables/query/queryOptions.ts`: Jazz query options and cache identity.
- `apps/studio/src/features/tables/query/prefetchJazzQuery.ts`: pre-render ownership of a canonical query-entry lease.
- `apps/studio/src/features/tables/query/tableRowsQuery.ts`: canonical row-query construction.
- `apps/studio/src/features/tables/query/useJazzQueryState.ts`: React external-store adapter for Jazz cache entries.
- `apps/studio/src/features/tables/query/useTableRows.ts`: query derivation, row preservation, pagination, and status projection.
- `apps/studio/src/features/tables/workspace/useTableViewState.ts`: query-row ownership and table interaction state.
- `apps/studio/src/features/tables/workspace/tabsProvider.tsx`: tab state and prepared table-route commits.
- `apps/studio/src/features/tables/workspace/navigationHistory.tsx`: prepared workspace back and forward commits.
- `apps/studio/src/features/tables/grid/toolbar.tsx`: row status, page-size, page label, and previous/next controls.
- `apps/studio/src/features/tables/workspace/tableView.tsx`: product loading copy and bounded-page rendering selection.
- `packages/design-system/src/studio/dataGrid/dataGrid.tsx`: reusable loading and virtual table-body presentation.

## Maintenance constraints

These constraints preserve subscription cleanup, semantic table structure, and fixed density behavior.

- Keep the default admin runtime non-persistent unless durable inspected-row caching becomes an explicit product option.
- Do not serialize admin-client creation behind stored-schema verification. Gate client publication instead.
- Shut down an admin client that resolves after failure, replacement, or unmount.
- Do not reconcile Jazz one-shot snapshots with maintained subscription results without an upstream ordering boundary.
- Release every rendered subscription through the cleanup function returned by Jazz.
- Keep terminal transport recovery bounded to one runtime replacement per active query incident.
- Do not broaden automatic recovery beyond explicitly verified Jazz transport errors without a typed upstream error contract or new evidence.
- Preserve one semantic table, one `colgroup`, one header, and one body for loading and resolved rows.
- Keep virtual rendering opt-in for consumers whose measured row counts require it.
