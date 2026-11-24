# Runtime optimization ideas

Status: deferred. Reconsider these options only when production measurements identify a remaining cost. No caching or retention expansion is selected.

## Contents

Measure each boundary before selecting an optimization.

- [Metadata and client reuse](#metadata-and-client-reuse)
- [Prefetch and row persistence](#prefetch-and-row-persistence)

## Metadata and client reuse

Schema discovery and Jazz client startup are separate costs in [runtime startup](../../apps/studio/src/app/runtime/useInspectorRuntime.tsx).

Consider short-lived, runtime-profile-keyed metadata reuse only if discovery remains perceptible after request deduplication. Consider bounded warm-client retention only if client startup remains the dominant repeat-switch cost.

Any design must preserve credential and schema isolation, stale-intent rejection, shutdown, and selected-schema verification. Reuse must not publish an unverified runtime.

## Prefetch and row persistence

The [current prefetch adapter](../../apps/studio/src/features/tables/query/prefetchJazzQuery.ts) uses Jazz's subscription store and an explicit release operation.

Measure cache hits, unused preparation, transferred rows, failures, and duplicate server work before broadening preparation beyond accepted navigation intent.

Persistent inspected-row caching needs a separate privacy and lifecycle decision. Do not infer consent to persist admin data from a performance goal.
