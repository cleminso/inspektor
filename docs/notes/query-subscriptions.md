# Jazz live-query and subscription telemetry

## Table of contents

- [Purpose](#purpose)
- [Source basis](#source-basis)
- [Terminology](#terminology)
- [Application query APIs](#application-query-apis)
- [Query construction](#query-construction)
- [Query execution options](#query-execution-options)
- [Subscription lifecycle](#subscription-lifecycle)
- [React and framework integration](#react-and-framework-integration)
- [Advanced binding APIs](#advanced-binding-apis)
- [Inspector telemetry sources](#inspektor-telemetry-sources)
- [Standalone server telemetry contract](#standalone-server-telemetry-contract)
- [Official Jazz Inspector implementation](#official-jazz-inspektor-implementation)
- [Polling and snapshot semantics](#polling-and-snapshot-semantics)
- [Observable and unavailable information](#observable-and-unavailable-information)
- [Security and privacy](#security-and-privacy)
- [Inspector implications](#inspektor-implications)
- [Source references](#source-references)

## Purpose

This note is the shared technical reference for Jazz live queries and the subscription telemetry available to Inspector.

It separates three related but different systems:

1. Application APIs that execute and subscribe to queries.
2. Framework bindings that manage subscription state for application components.
3. Inspector telemetry APIs that observe active subscription definitions.

Product structure and interaction decisions belong in [query-interface.md](query-interface.md). Implementation tasks belong in [subscription-query.md](../todo/subscription-query.md).

## Source basis

The investigation used:

- Jazz source revision `923c6a951e528e86c043b7bb375ddf83aded6b8b`.
- Jazz Tools package version `2.0.0-alpha.53`.
- The installed Inspector `jazz-tools` declarations.
- The official Jazz Inspector live-query page.
- A deployed Jazz Inspector response containing populated server subscription groups.

The deployed server and the inspected Jazz server source do not expose identical behavior. The source handler validates the request but returns an empty query list, while the deployed endpoint returns populated groups. The exported TypeScript response contract matches the deployed response. Package version alone must not be used to infer server capability.

## Terminology

### Query

A query is a serialized definition of requested rows, including its table, conditions, ordering, limits, branches, joins, and relation behavior.

### Subscription

A subscription is a long-lived query registration. Jazz maintains its result and publishes changes until the owner unsubscribes.

### Query result

A query result is the materialized collection of matching rows delivered to application code. The standalone telemetry endpoint does not expose it.

### Subscription telemetry snapshot

A telemetry snapshot is the grouped set of server-visible subscriptions returned by one introspection request. It is not a query result, sync result, event stream, or server-provided history.

### Live query

Jazz does not export a public TypeScript function named `liveQuery`. The application APIs are `Db.subscribe`, `useAll`, `useOne`, and framework-specific equivalents. “Live query” is Jazz documentation terminology; Inspector names the product workspace “Live queries.”

## Application query APIs

### One-shot reads

`Db.all(query, options?)` returns `Promise<T[]>`.

`Db.one(query, options?)` applies a limit of one and returns `Promise<T | null>`.

In the inspected Jazz source, these methods use the one-shot `client.query` path. They do not register an active `Db.subscribe` development trace.

Sources:

- `packages/jazz-tools/src/runtime/db.ts:2235-2295`

### Direct subscription

`Db.subscribe(query, callback, options?)` is the public imperative live-query API.

Its behavior:

- The callback receives the complete materialized result whenever it changes.
- Each callback receives a newly allocated result array and transformed row objects.
- The returned function cancels pending setup, removes the local Inspector trace, unsubscribes the native handle, and clears materialized state.
- The public callback has no error channel.
- Setup may fail synchronously; deferred readiness failures can surface asynchronously.

Sources:

- `packages/jazz-tools/src/runtime/db.ts:2298-2319`
- `packages/jazz-tools/src/runtime/db.ts:2353-2577`

### Delta subscription

Jazz internally models added, removed, updated, and reset operations with `SubscriptionDelta<T>` and `RowDelta<T>`.

`Db.subscribeDelta` is private. Application code using `Db.subscribe` receives complete arrays rather than deltas. Framework bindings use the internal delta surface to preserve reactive identity.

Sources:

- `packages/jazz-tools/src/runtime/subscription-manager.ts:17-108`
- `packages/jazz-tools/src/runtime/db.ts:200-222`
- `packages/jazz-tools/src/runtime/db.ts:2353-2359`

## Query construction

`QueryBuilder<T>` is the protocol consumed by `Db`. It exposes the table, schema, optional column transforms, serialized query builder, and a TypeScript inference brand.

Typed query builders support:

- `where(...)`
- `select(...)`
- `include(...)`
- `requireIncludes()`
- `orderBy(column, direction?)`
- `limit(n)`
- `offset(n)`
- `includeDeleted()`
- `hopTo(relation)`
- `gather(...)`
- application-level `union(...)`

Important behavior:

- Builder operations clone instead of mutating the existing builder.
- Scalar conditions mean equality.
- Multiple conditions combine as conjunctions.
- `undefined` condition values are omitted.
- Includes participate in subscription invalidation.
- Ordering uses row identity as an implicit tie-breaker.
- There is no public cursor-pagination method.
- Serialized queries may contain application filter values.

Sources:

- `packages/jazz-tools/src/runtime/db.ts:171-186`
- `packages/jazz-tools/src/typed-app.ts:1267-1384`

## Query execution options

Application-facing `QueryOptions` includes:

| Option         | Values                                                                          | Meaning                                                     |
| -------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `tier`         | `ReadTier.LocalFirst`, `Remote`, `RemoteIfPossible`, or legacy durability names | Initial read policy                                         |
| `localUpdates` | `immediate`, `deferred`                                                         | Visibility of local writes while the requested tier settles |
| `propagation`  | `full`, `local-only`                                                            | Whether the subscription communicates with upstream servers |
| `visibility`   | `public`, `hidden_from_live_query_list`                                         | Visibility in the local `Db` development trace list         |
| `branch`       | scalar or qualified branch                                                      | Branch head                                                 |
| `base`         | live branch or branch/snapshot pair                                             | Optional branch base                                        |

`visibility` is local development-trace metadata. It is not encoded as an exclusion from server telemetry.

`local-only` explicitly avoids upstream server communication from an application client. A subscription that never reaches the server cannot appear in standalone server telemetry.

Sources:

- `packages/jazz-tools/src/runtime/db.ts:188-198`
- `packages/jazz-tools/src/runtime/client.ts:345-410`

## Subscription lifecycle

The execution flow is:

1. A typed builder serializes through `_build()`.
2. `Db.subscribe` delegates to the internal delta subscription.
3. Jazz normalizes the builder JSON and resolves input and output tables.
4. The query adapter translates it into runtime JSON.
5. `SubscriptionManager` materializes native deltas into typed rows.
6. `JazzClient.subscribe` opens the native stream.
7. Rust validates the query and derives canonical shape and binding identities.
8. The protocol registers the shape and attaches a usage-site subscription.
9. Equivalent canonical coverage can be shared by the serving peer.
10. View updates return resets, membership changes, terminal operations, and facts.
11. Cleanup detaches the native and core subscription.

Relevant protocol messages include `RegisterShape`, `Subscribe`, `SubscribeRejected`, `ViewUpdate`, and `Unsubscribe`.

Reconnect behavior includes replaying desired subscriptions and sending known-state declarations. `ReadTier.RemoteIfPossible` uses local fallback after an explicit disconnect; an ordinary transport failure is not equivalent to that fallback.

Sources:

- `packages/jazz-tools/src/runtime/query-adapter.ts`
- `packages/jazz-tools/src/runtime/native-runtime/native-runtime-adapter.ts`
- `crates/jazz/src/protocol.rs:60-82`
- `crates/jazz/src/db/subscriptions.rs`
- `crates/jazz/src/db/node_runtime.rs`

## React and framework integration

### React

`jazz-tools/react` exports:

- `useAll`
- `useAllSuspense`
- `useOne`
- `useOneSuspense`
- `useDb`
- `useJazzClient`
- `JazzProvider`
- `JazzClientProvider`

The non-Suspense result distinguishes idle, loading, fulfilled, and rejected setup states through `{ data, isLoading, error }`.

React uses `useSyncExternalStore`. Equivalent serialized queries and options share an orchestrated cache entry. Inline builder object identity alone does not cause resubscription when the serialized key remains equal.

Session replacement clears the previous session’s fulfilled data, returns entries to pending, and resubscribes them.

Sources:

- `packages/jazz-tools/src/react-core/use-all.ts`
- `packages/jazz-tools/src/react-core/use-one.ts`
- `packages/jazz-tools/src/subscriptions-orchestrator.ts`

### Other framework bindings

- Vue exports `useAll` and `useOne`.
- Solid exports `useAll` and `useOne`.
- Svelte exports `QuerySubscription` and `QuerySubscriptionOne`.
- React Native reuses the React core query hooks.

These bindings use the same subscription-store concepts while adapting state delivery and cleanup to their framework.

## Advanced binding APIs

`jazz-tools/client` exports `getSubscriptionStore(client)` and cache-entry state types for framework authors.

The store exposes keyed operations such as `computeKey`, `makeQueryKey`, `peekState`, and `getCacheEntry`.

This store is not a telemetry inventory:

- It cannot enumerate another application’s active subscriptions.
- It requires a caller-supplied query key.
- It describes the Inspector-owned client when called from Inspector.

`jazz-tools/shared` exports `applyDelta` and `reconcileArray` for bindings that preserve object identity while applying subscription changes.

Sources:

- `packages/jazz-tools/src/client/index.ts`
- `packages/jazz-tools/src/subscription-store-internal.ts`
- `packages/jazz-tools/src/shared/index.ts`

## Inspector telemetry sources

Jazz has two different Inspector telemetry paths.

### Same-origin overlay telemetry

With `devMode` enabled, a `Db` records `ActiveQuerySubscriptionTrace` entries containing:

- local trace id
- serialized runtime query
- table
- branches
- tier
- propagation
- creation marker
- optional JavaScript stack

Internal `Db` methods return the active list and subscribe to list changes. Traces with hidden visibility are filtered from the returned list.

`JazzInspectorHost` exposes stack-free traces to a same-origin Inspector window and pushes replacement snapshots through `postMessage`.

This path observes one inspected application runtime. It is not available to the standalone Regarde web application without a same-origin host relationship.

Sources:

- `packages/jazz-tools/src/runtime/db.ts:427-436`
- `packages/jazz-tools/src/runtime/db.ts:1754-1772`
- `packages/jazz-tools/src/runtime/db.ts:2615-2659`
- `packages/jazz-tools/src/dev/inspektor-overlay/inspektor-host-types.ts`
- `packages/jazz-tools/src/dev/inspektor-overlay/host-bridge.ts`

### Standalone server telemetry

The standalone Inspector calls the admin introspection endpoint through `fetchServerSubscriptions`.

This path observes grouped subscriptions visible to the connected server and app. It does not expose an inspected client’s local trace list or JavaScript stack.

Regarde uses this path. It must not attempt to derive external telemetry from its own `Db` or subscription store.

## Standalone server telemetry contract

The public call is:

`fetchServerSubscriptions(serverUrl, { appId, adminSecret })`

The request sends the admin secret through `X-Jazz-Admin-Secret` and scopes the URL to the requested app.

The response contains:

| Field         | Meaning                              |
| ------------- | ------------------------------------ |
| `appId`       | App represented by the snapshot      |
| `generatedAt` | Server-generated snapshot marker     |
| `queries`     | Grouped server-visible subscriptions |

Each query group contains:

| Field         | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `groupKey`    | Opaque server-defined group identity             |
| `count`       | Number of subscriptions represented by the group |
| `table`       | Target table                                     |
| `query`       | Serialized runtime query JSON                    |
| `branches`    | Branch context                                   |
| `propagation` | `full` or `local-only`                           |

The API does not define result rows, result counts, query source, execution duration, latency, settlement, errors, or lifecycle events.

The client helper coerces a non-number `generatedAt` to `0` and a non-array `queries` value to `[]`. Inspector validates every returned group before accepting a snapshot, but code downstream of this helper cannot distinguish those malformed top-level values from a valid zero marker or empty snapshot.

Non-success responses include status, status text, and response body in the thrown error. Inspector must normalize these errors and avoid rendering arbitrary response bodies.

Sources:

- `packages/jazz-tools/src/runtime/introspection-fetch.ts`
- installed `jazz-tools/dist/runtime/introspection-fetch.d.ts`

### Source and deployment discrepancy

The inspected Jazz server handler:

- validates the admin secret
- validates `appId`
- returns `generatedAt`
- returns an empty query list

Its test preserves that empty shell until core telemetry backs it.

The deployed Jazz Inspector demonstrates populated groups using the same exported response shape. Regarde should implement against the public transport contract and verify capability against its target server rather than inferring it from the package version.

Sources:

- `crates/jazz-server/src/server/routes/http.rs:1216-1269`
- `crates/jazz-server/src/server/routes/mod.rs:2420-2457`

## Official Jazz Inspector implementation

The official page lives under `packages/inspektor/src/pages/live-query/`:

- `index.tsx`
- `index.module.css`
- `index.test.tsx`
- `LiveQueryFilters.tsx`
- `LiveQueryFilters.test.tsx`

The route is `/live-query`, while the navigation label is “Subscriptions.”

The page branches by runtime:

- Overlay mode reads same-origin host traces.
- Standalone mode polls `fetchServerSubscriptions`.

The standalone branch owns query groups, snapshot marker, loading, error, and table-filter state. It preserves existing groups when a refresh fails.

The page renders subscription definitions, not matching result rows. Its populated standalone test mocks the response and does not establish server implementation behavior.

The official query-to-Data-Explorer conversion only recognizes a narrow subset of relation IR comparisons. It does not faithfully map ordinary conditions, disjunctions, negation, joins, or repeated-column clauses. Regarde must not adopt it as a general query parser.

Sources:

- `packages/inspektor/src/routes.tsx`
- `packages/inspektor/src/pages/live-query/index.tsx`
- `packages/inspektor/src/pages/live-query/index.test.tsx`
- `packages/inspektor/src/contexts/host-link.ts`

## Polling and snapshot semantics

The server does not independently create a snapshot on the official Inspector’s polling cadence. The standalone Inspector requests the endpoint on a fixed cadence, and the server returns a snapshot for that request.

Consequences:

- Telemetry is sampled rather than event-driven.
- A query can appear, change, and disappear between requests without being observed.
- Consecutive snapshots do not establish an exact transition point.
- A failed request creates an unknown interval, not confirmed subscription absence.
- Inspector-owned history is derived client state, not server logs.
- Polling frequency trades freshness against admin requests and server work.

For a query timeline, a segment means that the group was observed in a successful snapshot. Segment length does not represent query execution duration or synchronization latency.

## Observable and unavailable information

| Information                  | Overlay trace                        | Standalone telemetry |
| ---------------------------- | ------------------------------------ | -------------------- |
| Active subscription identity | Local trace id                       | Group key            |
| Serialized query             | Yes                                  | Yes                  |
| Table                        | Yes                                  | Yes                  |
| Branches                     | Yes                                  | Yes                  |
| Tier                         | Yes                                  | No                   |
| Propagation                  | Yes                                  | Yes                  |
| Creation stack               | Captured internally, removed by host | No                   |
| Grouped subscription count   | No                                   | Yes                  |
| Query result rows            | No                                   | No                   |
| Matching-row count           | No                                   | No                   |
| Added, updated, removed rows | No                                   | No                   |
| Reset and settlement state   | No                                   | No                   |
| Reconnect state              | No                                   | No                   |
| Rejection or transport error | No                                   | No                   |
| Query execution latency      | No                                   | No                   |
| Transaction attribution      | No                                   | No                   |
| Source component or owner    | No                                   | No                   |

The standalone API can support inventory, churn, persistence, and grouped-count debugging. It cannot explain changed application rows or query performance.

## Security and privacy

- `adminSecret` must remain in the request header and must never enter route state, rendered output, logs, screenshots, or persisted telemetry.
- Serialized query JSON can contain application filter values and must be treated as sensitive.
- Raw query history must remain session-local unless a separate security decision permits persistence.
- Server response bodies must not be displayed directly after failed requests.
- `groupKey` is opaque server data. Inspector must not parse it or depend on its format.

## Inspector implications

- Regarde’s standalone Live queries feature must use `fetchServerSubscriptions`, not `Db.subscribe`, local trace accessors, or `getSubscriptionStore`.
- Connection identity is `serverUrl`, `appId`, and `adminSecret`.
- Branch and schema selection do not scope the introspection request.
- An empty successful snapshot means no server-visible groups were returned. It does not prove the application performed no reads.
- Server grouping and `count` are authoritative. Inspector must not regroup or reinterpret them.
- Query JSON remains the source representation. Parsing should produce a derived JSON-compatible value without replacing the raw string.
- Query-result diffing requires another Jazz capability and is outside the standalone telemetry foundation.
- A swimlane timeline may retain bounded session-local history, but every interval must preserve the distinction between observed presence, confirmed absence, and unknown capture failure.

## Source references

Related Inspector references:

- [Live queries interface](query-interface.md)
- [Subscription query implementation checklist](../todo/subscription-query.md)
- [Swimlane Timeline implementation checklist](../todo/swimlaneTimeline.md)
