# Table queries

Jazz's canonical subscription entry is the grid's row source. Studio derives queries from schema and route state; it does not merge one-shot snapshots into live rows.

## Contents

This contract owns query preparation, subscription lifetime, and result limits.

- [Query identity](#query-identity)
- [Preparation and lifetime](#preparation-and-lifetime)
- [Pagination](#pagination)
- [Failure and evidence limits](#failure-and-evidence-limits)

## Query identity

The query selects schema fields and provenance with validated filters, supported ordering, limit, and offset.

[[apps/studio/src/features/tables/query/tableRowsQuery.ts#buildTableRowsQuery]] adds ascending ID order after a non-ID sort. Unsupported sort columns fall back to ID.

[[apps/studio/src/features/tables/query/queryOptions.ts]] requests the remote tier without branch or base options. [[apps/studio/src/features/tables/query/useJazzQueryState.ts#useJazzQueryState]] shares equivalent work through Jazz's client-attached subscription store.

The client, serialized builder, and query options determine the canonical entry. The adapter exposes Jazz snapshots through `useSyncExternalStore`.

## Preparation and lifetime

Every rendered or prepared query has a lifecycle owner.

The rendered consumer subscribes after runtime prerequisites exist and releases through React cleanup. Preparation acquires the same canonical entry, waits for fulfillment, and releases after completion, replacement, or invalidation.

[[apps/studio/src/features/tables/routing/tableNavigationPreparation.tsx#TableNavigationPreparationProvider]] owns one foreground preparation. Replace-policy actions supersede older work. Pagination ignores additional input while its request is pending.

Runtime, schema, workspace, or route changes invalidate stale preparation. Query preparation does not run rendered mutation feedback or page-correction effects.

Direct links and browser history use the mounted readiness boundary rather than foreground preparation. No application row cache bridges the handoff.

## Pagination

Each page query requests one extra row to detect another page without a separate count query.

The route uses one-based pages and sizes 100, 500, or 1000. The query applies `offset = (page - 1) * pageSize` and `limit = pageSize + 1`. The probe row is not rendered.

[[apps/studio/src/features/tables/query/useTableRows.ts#useTableRows]] prepares one exact next page only at size 100. Larger pages load on demand. Filter and sort changes reset pagination.

Counts describe the current result window. A lower-bound count is not an exact table total. Probe absence is interpreted as the end of the delivered result; it does not independently verify complete remote replay.

## Failure and evidence limits

Canonical fulfillment is Studio's opening boundary, not proof that all authoritative remote rows have arrived.

The retained source does not establish a complete sorted, limited, and offset replay guarantee. Do not add callback counts, timers, or a raced `db.all()` snapshot to infer completion.

A failed destination query triggers bounded catalogue diagnosis. A classified connection failure opens repair; successful discovery leaves the original query failure table-specific.

The runtime permits one replacement for a recognized terminal transport failure. Replacement failure exhausts that attempt; successful settlement rearms recovery. [[apps/studio/src/app/providers/inspectorProvider.tsx#InspectorProvider]] owns this state.

Grid errors use product copy rather than unknown Jazz error text. This contract reports source behavior, not completed runtime acceptance.
