# Table operation ideas

These options do not change the current pane-only write boundary. Each needs separate approval before implementation.

## Contents

The proposals separate entry-point composition from bulk mutation.

- [Filter entry points](#filter-entry-points)
- [Bulk operations](#bulk-operations)

## Filter entry points

Status: proposed. Evaluate a shared application action for future navigator or query links that create table filters.

The [cell context menu](../../apps/studio/src/features/tables/grid/tableGridContextMenu.tsx) already exposes value-filter actions. The [table navigator](../../apps/studio/src/features/tables/tableList/pane.tsx) has no filter-control API.

Before accepting more entry points, define their placement, activation, URL clause representation, and table-query identity. Verify the target query surface still exists. Do not restore removed query tooling only to complete an old checklist.

## Bulk operations

Status: deferred. Reconsider only after approval of a concrete multi-cell or query-wide workflow.

The current [cell clipboard serializer](../../apps/studio/src/features/tables/grid/cellActions.ts) does not establish matrix-copy or paste semantics. Selection does not authorize bulk writes.

A future design must define:

- Visible-page, loaded-row, and matching-query scope, including exact totals when available.
- Stable row IDs, column order, and non-rectangular selection behavior.
- Schema-aware serialization and parsing, including NULL, structured values, relations, timestamps, and binary values.
- Read-only exclusions, preview, confirmation, progress, cancellation, partial failure, and recovery.
- Jazz transaction guarantees before any atomic-write claim.

Internal [ledger sequencing](../../apps/studio/src/features/tables/mutationLedger/applyLedger.ts) is not a database transaction or a product-facing batch contract. Do not reuse the superseded floating-widget design as approval.
