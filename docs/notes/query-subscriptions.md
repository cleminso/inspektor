# Query Subscriptions Research

## Purpose

This document captures the current understanding of Jazz query subscriptions and how Inspector should reason about them.

The goal is to align product language, implementation constraints, and UI direction before redesigning the Query Subscriptions view.

## Short definition

A Jazz query subscription is a live query registered by a Jazz client. The query tells the Jazz runtime which rows the client wants to keep visible and updated.

When the subscription is propagated upstream, the sync server tracks the query, evaluates it against schema, permissions, branches, and policy context, then keeps sending matching row updates as data changes.

The Query Subscriptions view does not show returned row data. It shows active server-tracked query shapes.

## Query types and subscription mechanics

Jazz exposes different ways to read data:

| Concept           | Public API examples                                           | Product meaning                         | Telemetry meaning                                                                        |
| ----------------- | ------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| One-shot read     | `db.all(...)`, `db.one(...)`                                  | Read data once                          | Uses subscription machinery internally, then unsubscribes after the first settled result |
| Live subscription | `useAll(...)`, `db.subscribeAll(...)`                         | Keep a query active and receive updates | Can appear in server telemetry while active and propagated                               |
| Query composition | `where`, `orderBy`, `limit`, `offset`, relation query helpers | Shape a query                           | Appears inside the serialized query JSON                                                 |

Confirmed from Jazz source:

- One-shot reads are implemented internally as temporary subscriptions.
- Live subscriptions stay active until unsubscribed.
- Query composition is not a separate runtime mode. It describes how the query is shaped.
- The server telemetry response does not expose a `queryType`, `kind`, or one-shot/live flag.

UI implication:

- Inspector should not render separate UI modes for one-shot, live, and composed queries unless Jazz exposes a stable field for that.
- Inspector can explain that the view focuses on active server-tracked subscriptions.
- If one-shot reads appear, they are indistinguishable from active subscriptions in the current telemetry shape.

## Local-first and local-only

Local-first means Jazz reads through a local runtime and syncs with other storage tiers.

`local-only` is a propagation mode for a specific subscription. It means the subscription should not be forwarded further upstream.

Confirmed from Jazz source:

- `propagation` can be `full` or `local-only`.
- `full` can be forwarded upstream.
- `local-only` is constrained to the local storage tier or the directly receiving tier.
- Server telemetry can include `local-only` if a server/runtime receives that subscription, but a subscription that never reaches the server cannot appear in server telemetry.

UI implication:

- If the Query Subscriptions view is empty, Inspector should not imply the app has no queries.
- It may mean there are no active server-visible subscriptions.
- Local-only queries, short-lived temporary reads, app/server mismatch, hidden inspector reads, or fetch failure can all explain an empty view.

## Server telemetry response

Confirmed response shape from `fetchServerSubscriptions(...)`:

| Field         | Meaning                                       |
| ------------- | --------------------------------------------- |
| `appId`       | App id returned by the introspection endpoint |
| `generatedAt` | Server-generated snapshot marker              |
| `queries`     | Active grouped server subscriptions           |

Each item in `queries` contains:

| Field         | Meaning                                            |
| ------------- | -------------------------------------------------- |
| `groupKey`    | Hash derived from query, branches, and propagation |
| `count`       | Number of active server subscriptions in the group |
| `table`       | Table targeted by the query                        |
| `query`       | Serialized query JSON                              |
| `branches`    | Branch context for the subscription                |
| `propagation` | `full` or `local-only`                             |

No other fields are currently returned by the server telemetry endpoint.

The endpoint is an admin introspection endpoint using `fetchServerSubscriptions(serverUrl, { appId, adminSecret })`.

Evidence:

- `packages/jazz-tools/src/runtime/introspection-fetch.ts`
- `crates/jazz-tools/src/server/routes/http.rs`
- `crates/jazz-tools/src/query_manager/manager.rs`

## Grouped subscriptions

The server does not return every individual subscription separately. It groups equivalent active subscriptions.

Grouping uses:

- serialized query JSON
- branches
- propagation

The returned `count` is the number of active subscriptions in that group.

Product meaning:

- If two components subscribe to the same table with the same filters, branches, and propagation, the view shows one row with `count = 2`.
- If a filter changes from one value to another, it becomes a different query shape.
- If the old query is no longer active, only the new group appears in the next fetched server snapshot.
- If both query shapes are active at the same snapshot, both groups appear.

Important distinction:

- Subscription telemetry describes query shapes.
- It does not describe the rows returned by those queries.
- If row data changes but the query shape stays the same, the telemetry row may not change.

## Polling versus push

Confirmed:

- The standalone Jazz inspector polls the admin introspection endpoint.
- Inspector currently follows the same standalone model.
- The server endpoint returns a current snapshot, not a pushed event stream.
- A server snapshot is the grouped active subscription state returned by one HTTP request to the admin introspection endpoint.
- The snapshot is generated when the endpoint handles that request and is marked with `generatedAt`.
- Inspector's polling interval is client-owned. The current Inspector hook polls every 20s.
- The official extension inspector has a different path that can receive active subscription changes from the DevTools bridge.

Inferred:

- Core Jazz subscriptions are real-time for app data.
- Query subscription telemetry is a separate admin introspection surface.
- Polling is likely simpler and avoids turning the admin endpoint into a persistent telemetry stream.
- A true event stream would require server support for subscription lifecycle events, not only a current grouped snapshot.

UI implication:

- Inspector should not present server subscription telemetry as logs.
- It can present a current snapshot.
- If Inspector stores snapshot history, that history is inspector-owned behavior, not server-provided logs.

## Short-lived one-shot reads

Confirmed:

- One-shot reads use temporary subscriptions internally.
- They unsubscribe after the first settled result.
- Server telemetry only shows active server subscriptions in the fetched server snapshot.

Inferred:

- One-shot reads can be missed by the standalone polling model.
- It is possible to catch one if it remains active when the snapshot is generated.
- If caught, it cannot be distinguished from a live subscription using the current telemetry fields.

UI implication:

- Empty telemetry does not prove that the app did not perform reads.
- It only means no matching active server-visible grouped subscriptions were present in the fetched snapshot.

## Stale and failed telemetry

Confirmed from `fetchServerSubscriptions(...)`:

- Non-success responses throw an error containing status, status text, and response body.
- Malformed response data is normalized by the client fetch helper.
- The response includes `generatedAt` as the server snapshot marker.

Confirmed in Inspector:

- `useQuerySubscriptionsTelemetry(...)` prevents overlapping requests.
- It keeps the last successful rows when a later refresh fails.
- It exposes `isInitialLoading`, `isRefreshing`, `error`, `generatedAt`, and `rows`.
- If there are no rows and the fetch fails, the grid shows an error state.
- If existing rows remain and refresh fails, the actions bar shows an error badge while stale rows remain visible.

UI implication:

- Inspector should label stale data clearly.
- If a refresh fails after a successful snapshot, the UI should say that it is showing the last successful snapshot.
- `generatedAt` should be used as a snapshot marker, not as proof that the data is still current.

## Current Inspector implementation

Current fetch behavior:

- `apps/web-inspector/src/hooks/useQuerySubscriptionsTelemetry.ts` fetches through `fetchServerSubscriptions(...)`.
- It starts with cached rows when available.
- It polls using a fixed interval.
- It avoids overlapping fetches with `isFetchingRef`.

Current cache behavior:

- Inspector stores a module-level cache in a `Map`.
- The cache key includes connection id, server URL, app id, and admin secret.
- Cache is overwritten after a successful fetch.
- Cache is not persisted across page reloads.
- Cache has no explicit freshness limit.
- Cache invalidates when the connection key changes.

Current UI behavior:

- Left pane lists tables and subscription counts.
- Main grid shows table, propagation, and count.
- Expanded row shows formatted query JSON.
- Expanded row can copy raw query JSON.
- Expanded row can link to the Data Explorer.
- Link building tries to recover supported filters from the serialized query JSON.

Current hidden reads:

- Inspector hides its own inspector reads using `visibility: "hidden_from_live_query_list"` in table and relation queries.
- This hides inspector-originated active subscription traces from local active subscription lists.
- It is not a server telemetry field.

Evidence:

- `apps/web-inspector/src/hooks/useQuerySubscriptionsTelemetry.ts`
- `apps/web-inspector/src/components/query-subscriptions/dataGrid.tsx`
- `apps/web-inspector/src/components/query-subscriptions/actionsBar.tsx`
- `apps/web-inspector/src/components/query-subscriptions/expandedRow.tsx`
- `apps/web-inspector/src/lib/query-subscriptions/buildExplorerUrl.ts`
- `apps/web-inspector/src/lib/query-subscriptions/extractFiltersFromIR.ts`
- `apps/web-inspector/src/hooks/useTableQuery.ts`
- `apps/web-inspector/src/hooks/useRelationRow.ts`

## Official Jazz inspector comparison

Standalone inspector:

- Uses the same `fetchServerSubscriptions(...)` admin endpoint.
- Polls using a fixed interval.
- Stores telemetry in component state.
- Keeps existing rows when a refresh fails.
- Displays table, count, propagation, branches, and query.
- Does not use Inspector's module-level navigation cache.

Extension inspector:

- Uses a DevTools bridge rather than server introspection.
- Can receive active subscription changes from the inspected client.
- Maintains an active subscription snapshot in the extension panel.
- This is a different telemetry source than the standalone server endpoint.

Evidence:

- `packages/inspector/src/pages/live-query/index.tsx`
- `packages/jazz-tools/src/dev-tools/extension-panel.ts`

## Cache direction

Recommended direction:

- Keep a short-lived in-memory snapshot cache per connection to avoid empty flashes during navigation.
- Mark cached data as cached until a fresh fetch succeeds.
- Keep stale rows on fetch failure, but make the stale state explicit.
- Do not persist query subscription snapshots to durable local storage.
- Do not build a large history into the core cache.
- If history becomes useful, store a small in-memory ring buffer of successful snapshots per connection.

Why:

- The server returns current grouped snapshots, not logs.
- Persisting snapshots would make the inspector look like it has historical telemetry it does not actually receive from the server.
- A small in-memory history can support UI comparison without changing the product model.

## Data Explorer mapping

“Open in Data Explorer” means:

1. Read the subscription row’s `table`.
2. Parse the serialized `query` JSON.
3. Extract supported filter expressions.
4. Open the Data Explorer on that table.
5. Apply recovered filters when possible.

If Inspector cannot extract filters, it should still open the table without filters.

Example:

- A subscription targets `todos` with a filter equivalent to `projectId = abc`.
- Inspector opens the `todos` table with a `projectId = abc` filter.

This feature does not show the subscribed row data inside the Query Subscriptions view. It helps the developer jump from server query shape to inspectable rows.

## UI direction for v1

The Query Subscriptions view should explain active server-tracked queries before exposing raw JSON.

Recommended structure:

- Left panel: tables and filters.
- Top toolbar: search, refresh, auto-refresh state, propagation filter, and snapshot marker.
- Main grid: grouped subscription rows.
- Bottom dock: selected subscription details.

Bottom dock tabs:

- `Overview`: deconstructs the query into readable fields.
- `Raw JSON`: exposes the original serialized query JSON.

Overview should include:

- table
- count
- propagation
- branches
- recovered filters when available
- whether the row can open in Data Explorer with filters
- short explanations for fields that are easy to misread

Grid columns to consider:

- table
- count
- optional short query summary only when it stays readable

The grid should stay simple. `generatedAt`, propagation, branches, and explorer-link details belong in the toolbar or selected dock because they describe the fetched snapshot or selected query, not the primary row identity.

## v1 decisions

- Keep only the latest successful server snapshot in the core product model.
- Use a short-lived module-memory cache to avoid empty flashes during navigation.
- Do not persist query subscription snapshots to durable storage.
- Snapshot history is out of scope for v1.
- Branch filtering is not a default control while the inspector route already scopes the user to a branch. Reconsider it only if telemetry returns multiple branch contexts inside the same session.
- Treat `count` as the duplicate-subscription signal for equivalent query, branch, and propagation groups.
- Show `count` in the grid and explain it in the selected dock.
- Render a readable overview from the serialized query JSON when possible.
- Render the complete serialized query as structured expandable key/value rows in the Overview tab, with Raw JSON as the source-of-truth fallback.
- Treat returned `local-only` propagation as metadata. Do not show it as a warning by default.
- Explain local-only subscriptions that never reach the server as a possible empty-state cause.
- Keep v1 focused on standalone server introspection through `fetchServerSubscriptions(...)`.
- Extension-style client telemetry is out of scope for v1.
