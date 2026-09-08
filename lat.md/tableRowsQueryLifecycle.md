# Table row query lifecycle

This document traces a table row query from route state through Jazz subscription and grid rendering.

## Table of contents

This table of contents links to the document sections.

- [Purpose](#purpose)
- [Ownership boundaries](#ownership-boundaries)
- [Execution flow](#execution-flow)
- [Query construction](#query-construction)
- [Subscription lifecycle](#subscription-lifecycle)
- [Grid presentation states](#grid-presentation-states)
- [Pagination and virtualization](#pagination-and-virtualization)
- [Implementation map](#implementation-map)
- [Maintenance constraints](#maintenance-constraints)

## Purpose

As defined by [[tableExplorerBehaviors#Behavior model|the Table Explorer behavior model]], the Table Explorer starts its row query when the table view renders. The Inspektor runtime uses the in-memory Jazz driver, so inspected

admin data is not persisted to browser storage.

## Ownership boundaries

React hooks, Jazz orchestration, and DataGrid presentation each own a separate part of the query lifecycle.

- `useTableRows` owns table-query derivation, compatible-row preservation, pagination, and view-facing status flags.
- `useJazzQueryState` adapts one Jazz orchestrator cache entry to React through `useSyncExternalStore`.
- Jazz's `SubscriptionsOrchestrator` owns query-key generation, cache-entry reuse, subscription delivery, and reference counting.
- `DataGrid` owns reusable loading, empty, complete-row, and virtual-row presentation without knowing about Jazz.

## Execution flow

The query flow resolves route state, subscribes through Jazz, and projects the result into product states.

### 1. Resolve route state

The table route provides filters, sorting, page, and page size. `resolveTableRowsSearch` applies defaults and malformed-search handling

before the query is built.

### 2. Build and subscribe to the query

`useTableRows` calls `buildTableRowsQuery` with the resolved route state and `INSPEKTOR_QUERY_OPTIONS`. `useJazzQueryState` acquires the

canonical Jazz cache entry and subscribes React to its state.

### 3. Project query state into UI state

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
- propagation and visibility options

Change route defaults in `tableRowsSearch.ts`, query construction in `tableRowsQuery.ts`, and Jazz options in `queryOptions.ts`.

## Subscription lifecycle

The rendered table acquires one canonical Jazz cache entry and releases it through React cleanup.

The rendered table owns its subscription through `useSyncExternalStore`. React calls the returned cleanup when the active query entry
changes or the component unmounts. Page, page-size, filter, sort, schema, table, or manager changes acquire the matching query entry.
The Jazz manager decides how long an entry remains available after it is no longer active.

## Grid presentation states

The grid distinguishes initial loading, compatible refresh, resolved rows, empty results, and errors.

| Query state            | Existing compatible rows | Grid body                       | Toolbar pagination |
| ---------------------- | ------------------------ | ------------------------------- | ------------------ |
| Pending                | No                       | Spinner and `Loading rows`      | Available          |
| Pending refresh        | Yes                      | Existing virtual rows           | Available          |
| Fulfilled with rows    | Not applicable           | Resolved virtual row window     | Available          |
| Fulfilled without rows | Not applicable           | Filtered or table-empty message | Available          |
| Rejected               | No compatible result     | Error message                   | Available          |

The loading body uses the design-system spinner and visible status text. It communicates pending work without implying a result count
or record shape.

## Pagination and virtualization

The table route stores a one-based page and a constrained page size. The default page size is 100 rows; supported alternatives are 500

and 1000 rows. Default values are omitted from the URL. Filter and sort changes reset the page to one.

Each Jazz query uses `offset = (page - 1) x pageSize` and requests `pageSize + 1` rows. The extra row is not rendered; it enables the
next-page control without a separate total-count query. Non-ID sorts add ascending ID order as a deterministic tie-breaker.

A result without the extra probe row proves the end of the result set.

Pagination renders a lower-bound row status, compact page-size selector, previous and next actions, and a `Page x` label. While another
page exists, the row status uses a lower bound such as `1-100 of 101+`. The final page can show an exact total. During a page-size query,
the toolbar keeps the last settled range and page visible while disabling page navigation.

`DataGrid.Content` renders the default 100-row page directly. Larger row models use TanStack Virtual while spacer rows preserve the
scroll range inside the same semantic table, `colgroup`, sticky header, and scroll viewport. Page, page-size, filter, and sort scope
changes reset both scroll axes without remounting the viewport.

## Implementation map

These source modules implement route resolution, Jazz querying, state projection, controls, and grid rendering.

- `apps/web/src/features/tables/routing/tableRowsSearch.ts`: route query-state resolution.
- `apps/web/src/features/tables/query/queryOptions.ts`: Jazz query options and cache identity.
- `apps/web/src/features/tables/query/tableRowsQuery.ts`: canonical row-query construction.
- `apps/web/src/features/tables/query/useJazzQueryState.ts`: React external-store adapter for Jazz cache entries.
- `apps/web/src/features/tables/query/useTableRows.ts`: query derivation, row preservation, pagination, and status projection.
- `apps/web/src/features/tables/grid/toolbar.tsx`: row status, page-size, page label, and previous/next controls.
- `apps/web/src/features/tables/workspace/tableView.tsx`: product loading copy and virtual rendering selection.
- `packages/design-system/src/components/dataGrid/dataGrid.tsx`: reusable loading and virtual table-body presentation.

## Maintenance constraints

These constraints preserve subscription cleanup, semantic table structure, and fixed density behavior.

- Keep the default admin runtime non-persistent unless durable inspected-row caching becomes an explicit product option.
- Release every rendered subscription through the cleanup function returned by Jazz.
- Preserve one semantic table, one `colgroup`, one header, and one body for loading and resolved rows.
- Keep virtual row estimates aligned with the fixed Data Grid density heights.
