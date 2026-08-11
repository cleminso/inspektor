# Table row prefetch and query lifecycle

## Table of contents

- [Purpose](#purpose)
- [Ownership boundaries](#ownership-boundaries)
- [Execution flow](#execution-flow)
- [Query identity contract](#query-identity-contract)
- [Subscription lifecycle](#subscription-lifecycle)
- [Grid presentation states](#grid-presentation-states)
- [Pagination and virtualization](#pagination-and-virtualization)
- [Implementation map](#implementation-map)
- [Maintenance constraints](#maintenance-constraints)

## Purpose

The Table Explorer starts an initial row query when direct navigation intent is detected in the table list or an inactive table tab.
If navigation follows, the table view subscribes to the same Jazz query cache entry instead of starting unrelated work after the
route mounts.

This is speculative subscription reuse, not durable row caching. The Inspector runtime continues to use the in-memory Jazz driver so
admin data is not persisted to browser storage.

## Ownership boundaries

- The table list and tabs view each own navigation-intent detection and the lifetime of their speculative subscription.
- The shared query module owns the exact query shape and query options used by both prefetch and rendered rows.
- Jazz's `SubscriptionsOrchestrator` owns query-key generation, cache-entry reuse, subscription delivery, and reference counting.
- `useJazzQueryState` adapts one orchestrator cache entry to React through `useSyncExternalStore`.
- `useTableRows` owns table-query derivation, active loaded-window reuse, page projection, compatible-row preservation, and
  view-facing status flags.
- `DataGrid` owns reusable loading, empty, complete-row, and virtual-row presentation without knowing about Jazz.

The adapter around `SubscriptionsOrchestrator` is intentionally isolated because that Jazz API is from an alpha package surface. A
supported Jazz prefetch API can replace the adapter without changing table-list interactions or grid rendering.

## Execution flow

### 1. Detect navigation intent

`TableListPane` handles intent on each table link, and `TableTabsView` handles intent on each inactive table tab:

- pointer entry schedules prefetch after a short settling delay
- pointer exit cancels work that has not started and releases matching speculative work
- keyboard focus starts prefetch immediately
- blur releases the matching speculative subscription
- pointer down starts prefetch immediately before route navigation

Prefetch is disabled while table multi-selection is active because clicking a table then changes selection instead of navigating.
The tabs view skips the active tab, the new-view tab, schema-view tabs, and tabs whose table is absent from the active schema. Only
one speculative subscription is retained by each navigation surface at a time.

### 2. Build the destination query

`buildInitialTableRowsQuery` delegates to the same `buildTableRowsQuery` function used by the rendered table. The table list omits
search inputs and produces this default shape:

- no filters
- sort by `id` ascending
- request page one with a page size of 100 rows
- fetch one additional row so `useTableRows` can derive whether more rows are available
- use the shared `TABLE_ROWS_QUERY_OPTIONS`

An inactive table tab supplies its stored filters, sort column, sort direction, page, and page size. `resolveTableRowsSearch` applies
the same defaults and malformed-search handling used by the destination route, so prefetch can acquire the exact page represented by
the tab.

### 3. Acquire the Jazz cache entry

`startTableRowsPrefetch` asks the active Jazz client's manager to create the canonical query key, acquires that cache entry, and
subscribes without a result callback. The subscription itself starts or joins the Jazz work. The returned function releases that
subscription reference. This adapter accepts optional resolved search inputs so table-list and tab intent can share one ownership
mechanism.

### 4. Render the destination table

`useTableRows` constructs its query from the route-backed filters, sorting, page, and page size. For the default table route, the query
and options match the prefetch query exactly. `useJazzQueryState` therefore obtains the same orchestrator entry and subscribes React
to its state.

If the prefetch has fulfilled, rows are available in the first destination snapshot. If it is pending, the destination joins that
pending entry. If route state differs from the default query, the rendered table creates the query matching that route unless the
active fulfilled query already contains the complete requested page and its pagination probe.

### 5. Project cache state into UI state

`useJazzQueryState` exposes `idle`, `pending`, `fulfilled`, and `rejected` states. `useTableRows` then derives the product states:

- initial loading when no compatible rows have resolved
- refreshing when sorting changes within the same table-page data scope
- rejected query error text

Resolved rows remain visible while compatible sorting work is pending. A fulfilled wider window remains the active Jazz subscription
while smaller pages can be projected from it. Rows are not reused across a table, schema, filter, sort, or Jazz-manager change, and an
uncovered page or page-size request starts its own bounded query.

## Query identity contract

Prefetch only provides reuse when both callers produce the same canonical Jazz query key. Keep these inputs shared:

- query builder serialization
- default sort column and direction
- page and page size
- page-derived query offset
- extra-row pagination probe
- propagation and visibility options

Do not duplicate the default query shape in `TableListPane`. Change defaults in `tableRowsQuery.ts` and cover both prefetch and
rendered-query identity in tests.

`TABLE_ROWS_QUERY_OPTIONS` is a module-scope constant. Its stable reference also prevents subscription churn in React dependencies.

Loaded-window reuse is separate from exact prefetch identity. `useTableRows` can keep an already fulfilled broader query active while
the route represents a contained page. The broader query remains authoritative; the Inspector does not seed or open redundant exact
page subscriptions for contained rows.

## Subscription lifecycle

`useTableRowsPrefetchIntent` stores timeout and release handles in refs because they are transient resources and do not affect rendered
output. The table list and tabs view share this owner. Cleanup runs when intent moves to another target, pointer and keyboard intent end,
the target closes, the runtime changes, or the owning surface unmounts. Prefetch is released after the target becomes active; React
effects run after the destination render, allowing its subscription to join the cache entry first.

The destination table owns an independent subscription through `useSyncExternalStore`. React calls the returned cleanup when the
active query entry changes or the component unmounts. A contained pagination change keeps the broader entry active. `useTableRows`
retains one committed fulfilled window for this decision; it does not persist rows or retain multiple independent subscriptions. The
Jazz manager decides how long an entry remains available after it is no longer active.

## Grid presentation states

| Query state            | Existing compatible rows | Grid body                       | Toolbar pagination |
| ---------------------- | ------------------------ | ------------------------------- | ------------------ |
| Pending                | No                       | Spinner and `Loading rows`      | Available          |
| Pending refresh        | Yes                      | Existing virtual rows           | Available          |
| Fulfilled with rows    | Not applicable           | Resolved virtual row window     | Available          |
| Fulfilled without rows | Not applicable           | Filtered or table-empty message | Available          |
| Rejected               | No compatible result     | Error message                   | Available          |

The loading body uses the design-system spinner and visible status text. It communicates real pending work without implying a result
count or record shape.

## Pagination and virtualization

The table route stores a one-based page and a constrained page size. The default page size is 100 rows; supported alternatives are
500 and 1000 rows. Default values are omitted from the URL. Filter and sort changes reset the page to one.

Each Jazz query uses `offset = (page - 1) × pageSize` and requests `pageSize + 1` rows. The extra row is not rendered; it only enables
the next-page control without requiring a separate total-count query. The installed Jazz public query API exposes row queries with
filtering, sorting, limits, and offsets, but no count aggregate or total-result metadata. Loading every matching row only to read the
array length would defeat bounded pagination, so the Inspector represents only the pages established by the current query path. This
replaces the cumulative load-more query, which repeatedly requested every row from offset zero. Non-ID sorts add ascending ID order as
a deterministic tie-breaker so equal values cannot move unpredictably across offsets.

A fulfilled query window can represent smaller pages whose visible rows and extra probe are fully contained by that window. For
example, an offset-zero 501-row result can represent size-100 pages one through five without changing the active Jazz subscription.
Page six starts an offset-500, limit-101 query because only its first row was the preceding window's probe. A result shorter than its
requested page size proves the end of the result set and can also satisfy a larger page that cannot contain additional rows.

Pagination renders between the toolbar content and actions as a lower-bound row status, compact page-size selector, previous and next
icon actions, and a `Page x` label. While another page exists, the row status communicates a truthful lower bound such as
`1–100 of 101+`. The final page proves the exact result count and can show a status such as `10,001–10,004 of 10,004`. The product
table does not render a separate footer or claim an exact total before the query path establishes one. Empty results use
`0–0 of 0`. During a page-size query, the toolbar keeps the last settled range and page visible while disabling page navigation. The
page-size trigger follows its selected value, and both page navigation actions provide tooltips.

`DataGrid.Content` uses a hybrid row-rendering boundary for the Inspector table. TanStack Table still produces the complete current-page
row model. The default 100-row page renders directly. Larger row models use TanStack Virtual with a 48-row overscan; spacer rows
preserve the full scroll range inside the same semantic table, `colgroup`, sticky header, and scroll viewport. Page changes reset both
scroll axes without remounting the viewport or its retained table content.

## Implementation map

- `apps/web/src/features/tables/tableList/pane.tsx`: navigation-intent handlers and speculative resource cleanup.
- `apps/web/src/features/tables/workspace/tabsView.tsx`: exact inactive-tab intent, handoff, and cleanup.
- `apps/web/src/features/tables/routing/tableRowsSearch.ts`: shared route and stored-tab query-state resolution.
- `apps/web/src/features/tables/query/tableRowsQuery.ts`: canonical row-query construction and shared options.
- `apps/web/src/features/tables/query/tableRowsPrefetch.ts`: isolated Jazz orchestrator prefetch adapter.
- `apps/web/src/features/tables/query/useTableRowsPrefetchIntent.ts`: shared intent timer, ownership, handoff, and runtime cleanup.
- `apps/web/src/features/tables/query/useJazzQueryState.ts`: React external-store adapter for Jazz cache entries.
- `apps/web/src/features/tables/query/useTableRows.ts`: query derivation, active loaded-window reuse, page projection, row
  preservation, pagination, and status projection.
- `apps/web/src/features/tables/grid/toolbar.tsx`: row status, compact page-size, `Page x`, and previous/next toolbar controls.
- `apps/web/src/features/tables/workspace/tableView.tsx`: product loading copy and virtual rendering selection.
- `packages/design-system/src/components/dataGrid/dataGrid.tsx`: reusable loading and virtual table-body presentation.

## Maintenance constraints

- Keep speculative work limited to direct table-list and inactive-tab navigation intent until its hit rate and transferred-row cost
  are measured.
- Keep the default admin runtime non-persistent unless durable inspected-row caching becomes an explicit product option.
- Release every speculative and rendered subscription through the cleanup function returned by Jazz.
- Preserve one semantic table, one `colgroup`, one header, and one body for loading and resolved rows.
- Do not show prefetched default rows for a filtered or differently sorted route.
- Reuse a loaded window only when it contains the complete visible page plus its probe, or when it proves the result-set end.
- Invalidate loaded-window reuse when the manager, schema, table, filters, or sorting changes.
- Keep virtual row estimates aligned with the fixed Data Grid density heights.
- Replace only `tableRowsPrefetch.ts` if Jazz adds a supported prefetch API with shared pending work and bounded retention.
