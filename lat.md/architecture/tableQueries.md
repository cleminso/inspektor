# Table queries

Jazz's canonical subscription entry is the grid's row source. Studio derives queries from schema and route state; it does not merge one-shot snapshots into live rows.

## Contents

This contract owns query preparation, subscription lifetime, and result limits.

- [Query identity](#query-identity)
- [Workflow ownership](#workflow-ownership)
- [Preparation and lifetime](#preparation-and-lifetime)
- [Pagination](#pagination)
- [Failure and evidence limits](#failure-and-evidence-limits)

## Query identity

The query selects schema fields and provenance with validated filters, supported ordering, limit, and offset.

[[packages/core/src/studio/query.ts]] adds ascending ID order after a non-ID sort. Unsupported sort columns fall back to ascending ID.

The Jazz adapter requests the remote tier without branch or base options. Equivalent work shares Jazz's client-attached subscription store.

The client, serialized builder, and query options determine the canonical entry. [[packages/core/src/jazz/query.ts#canonicalQuery]] acquires that entry for scoped observation and preparation. The React adapter exposes its snapshots through `useSyncExternalStore`.

## Workflow ownership

One exploration feature owns query observation, navigation preparation, compatible result retention, prefetch, correction admission, and shared recovery.

[[packages/core/src/workbench/exploration.ts#createExploration]] composes existing query and Jazz operations. Studio supplies committed route intent, diagnosis and repair ports, route commits, columns, and rendered feedback.

The manager survives table changes and same-target client replacement. Recovery resets for another runtime target or explicit retry, not pane replacement. Per-view compatibility state is not a shared row cache.

Creating a view or reading its snapshot starts no native work. The first subscriber acquires observation; the last releases it. Cleanup permits reattachment under React effect replay. Stale route, client, or schema observations cannot trigger correction, feedback, or recovery.

## Preparation and lifetime

Every rendered or prepared query has a lifecycle owner.

The rendered consumer subscribes after runtime prerequisites exist and releases through React cleanup. Preparation acquires the same canonical entry, waits for fulfillment, and releases after completion, replacement, or invalidation.

The exploration feature uses [[packages/core/src/studio/query.ts#createTableNavigationPreparation]] for one foreground preparation. Replace-policy actions supersede older work. Pagination ignores additional input while its request is pending. Core derives refinement destinations and page resets; Studio serializes accepted destinations into the URL.

Runtime, schema, workspace, or route changes invalidate stale preparation. Query preparation does not run rendered mutation feedback or page-correction effects.

Direct links and browser history use the mounted readiness boundary rather than foreground preparation. No application row cache bridges the handoff.

## Pagination

Each page query requests one extra row to detect another page without a separate count query.

The route uses one-based pages and sizes 100, 500, or 1000. The query applies `offset = (page - 1) * pageSize` and `limit = pageSize + 1`. The probe row is not rendered.

The exploration feature prepares one exact next page only at size 100 and releases preparation after settlement or view retirement. Larger pages load on demand. Filter and sort changes reset pagination.

Counts describe the current result window. A lower-bound count is not an exact table total. Probe absence is interpreted as the end of the delivered result; it does not independently verify complete remote replay.

## Failure and evidence limits

Canonical fulfillment is Studio's opening boundary, not proof that all authoritative remote rows have arrived.

The retained source does not establish a complete sorted, limited, and offset replay guarantee. Do not add callback counts, timers, or a raced `db.all()` snapshot to infer completion.

A failed destination query triggers bounded catalogue diagnosis. A classified connection failure opens repair; successful discovery leaves the original query failure table-specific.

The exploration manager permits one runtime replacement for a recognized terminal transport failure. Replacement failure exhausts that attempt; successful settlement rearms recovery. All rendered table and row observations share that decision; Studio executes replacement.

Grid errors use product copy rather than unknown Jazz error text. This contract reports source behavior, not completed runtime acceptance.
