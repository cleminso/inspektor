# Explore tables

A developer selects a schema table, reads its rows, inspects values, and follows relations. One generic flow serves supported tables without generated app-specific query builders.

## Contents

This journey covers workspace navigation and inspection without changing row values.

- [Open a destination](#open-a-destination)
- [Inspect a row](#inspect-a-row)
- [Read result state](#read-result-state)

## Open a destination

A workspace item represents a table and its Data or Schema representation, with representation-specific state.

Selecting a table opens or focuses its default unfiltered Data item. Different filters can produce separate Data items for the same table. Schema opens a distinct representation. A relation link navigates to the referenced table's default Data item.

Application navigation prepares the destination's exact query before committing route identity. The current view stays committed while preparation is pending. Superseded preparation cannot commit.

Direct links and native browser history use the connection fallback until the destination becomes ready. They keep the provider ancestry mounted.

See [[routing]] and [[tableQueries]]. [[apps/studio/src/features/tables/workspace/tabsProvider.tsx]] owns workspace-item navigation.

## Inspect a row

Cell selection and complete-row inspection are separate actions.

A single cell click changes cell selection without opening the pane. Row checkboxes select at most one row and open its complete-row pane. Double-click or Enter activates the requested field.

Application fields and ID use Details. Synthetic `$createdAt`, `$createdBy`, `$updatedAt`, and `$updatedBy` fields use read-only Provenance. JSON shows the complete row. Hidden grid columns remain available in the pane.

[[apps/studio/src/features/tables/rowEditor/editForm.tsx#EditRowForm]] routes requested fields. [[apps/studio/src/features/tables/workspace/tableView.tsx]] owns selection-to-pane transitions.

Cell ranges use row and column IDs for their corners, with displayed order defining their contents. Cell ranges support inspection and copy; they do not create a second write surface.

Binary inspection offers hexadecimal copy, Base64 copy, and raw-byte download. [[apps/studio/src/features/tables/rowEditor/values/binary.ts#encodeBinaryValue]] limits text copy to 1 MiB.

## Read result state

The grid distinguishes loading, compatible refresh, rows, empty results, query failure, and transport recovery.

Sorting can retain compatible rows during refresh. A different data scope does not reuse those rows as its result. Row positions and pagination counts describe current query results, not stable table positions or an independently verified total.

The standalone Live queries feature is removed. Its legacy route redirects to Tables with history replacement and retained schema state. Live table subscriptions remain active.

[[apps/studio/src/routes/conn/$connectionId/live-queries.tsx#Route]] owns that redirect. Editing continues through [[changeRow]].
