# Table Explorer Research

## Purpose

This document captures the current understanding of Jazz table exploration and how Regarde should reason about it in the v1 inspector.

The goal is to align product language, Jazz APIs, Regarde implementation details, and UI direction before improving the Table Explorer.

## Short definition

The Table Explorer is the main surface for inspecting Jazz app data.

It uses the selected stored schema to list tables, build generic table queries, render rows and columns, follow references, and perform mutations through Jazz runtime APIs.

It does not import generated app-specific query builders or custom table views.

## What the table view represents

The table view represents one table from the selected Jazz app schema, queried through the inspector's active Jazz client.

It solves a simple problem:

> Developers need to see and act on Jazz app data without building a custom admin screen for every app schema.

The view should let developers:

- choose a table from the selected schema
- read rows clearly
- filter and sort rows
- inspect one row in detail
- follow references to related rows
- insert, update, and delete rows when supported
- understand enough schema context to know what they are looking at

## Data source in Regarde

Regarde gets table data through the Jazz runtime, not through a bespoke REST endpoint.

Current data flow:

1. The active route selects a connection, branch, schema hash, and table.
2. `useInspectorRuntime(...)` creates an in-memory Jazz client with `createJazzClient(...)`.
3. `useInspectorRuntime(...)` fetches the selected stored schema and stored permissions.
4. `useTableQuery(...)` builds a generic query for the selected table.
5. `useAll(...)` subscribes to that query and returns live rows.
6. `DataView` passes those rows into the grid.

Relevant Regarde files:

- `apps/web-inspector/src/hooks/useInspectorRuntime.ts`
- `apps/web-inspector/src/components/providers/inspectorProvider.tsx`
- `apps/web-inspector/src/routes/conn/$connectionId/$branch/$schemaHash/tables/$tableName/index.tsx`
- `apps/web-inspector/src/components/table-explorer/tableExplorerScreen.tsx`
- `apps/web-inspector/src/components/table-explorer/selectedTableView.tsx`
- `apps/web-inspector/src/hooks/useTableQuery.ts`
- `apps/web-inspector/src/components/table-explorer/data/view.tsx`

## Schema metadata

Schema metadata is the stored Jazz structural schema for the selected app schema hash.

The public shape is:

```/dev/null/wasmSchema.ts#L1-20
type WasmSchema = Record<string, TableSchema>;

type TableSchema = {
  columns: ColumnDescriptor[];
  indexed_columns?: string[];
  policies?: TablePolicies;
};

type ColumnDescriptor = {
  name: string;
  column_type: ColumnType;
  nullable: boolean;
  default?: Value;
  references?: string;
  merge_strategy?: "Counter";
};
```

Confirmed source:

- `packages/jazz-tools/src/drivers/types.ts`
- `crates/jazz-tools/src/query_manager/types/schema.rs`

Regarde uses schema metadata to derive:

- table list
- grid columns
- column labels and types
- filterable operators
- mutation field parsing
- nullable/default behavior
- relation cells through `references`
- schema view JSON

Relevant Regarde files:

- `apps/web-inspector/src/lib/table-explorer/tableSchema.ts`
- `apps/web-inspector/src/components/table-explorer/data/buildDataGridColumns.tsx`
- `apps/web-inspector/src/lib/table-explorer/whereOperators.ts`
- `apps/web-inspector/src/lib/table-explorer/filterParsing.ts`
- `apps/web-inspector/src/lib/table-explorer/mutationParsing.ts`
- `apps/web-inspector/src/components/table-explorer/schema/view.tsx`

## Stored schema and permissions APIs

Jazz exposes admin helpers for schema and permission metadata.

| API | Method and path | Shape |
| --- | --- | --- |
| `fetchSchemaHashes(...)` | `GET /apps/:appId/schemas` | `{ hashes, schemas }` |
| `fetchStoredWasmSchema(...)` | `GET /apps/:appId/schema/:hash` | `{ schema, publishedAt }` |
| `fetchStoredPermissions(...)` | `GET /apps/:appId/admin/permissions` | `{ head, permissions }` |
| `fetchPermissionsHead(...)` | `GET /apps/:appId/admin/permissions/head` | `{ head }` |
| `publishStoredSchema(...)` | `POST /apps/:appId/admin/schemas` | `{ objectId, hash }` |
| `publishStoredPermissions(...)` | `POST /apps/:appId/admin/permissions` | `{ head }` |

These APIs use `X-Jazz-Admin-Secret`.

Confirmed source:

- `packages/jazz-tools/src/runtime/schema-fetch.ts`
- `crates/jazz-tools/src/server/routes/http.rs`

Regarde currently uses:

- `fetchSchemaHashes(...)`
- `fetchStoredWasmSchema(...)`
- `fetchStoredPermissions(...)`

Permissions are optional for runtime bootstrap. If permission loading fails, the rest of the inspector can still run.

## Jazz table and query APIs

Jazz exposes typed app table handles and structural query builders.

Important read APIs:

- `useAll(query, options?)`
- `useAllSuspense(query, options?)`
- `db.all(query, options?)`
- `db.one(query, options?)`
- `db.subscribeAll(query, callback, options?)`

Important query builder methods:

- `where(...)`
- `select(...)`
- `include(...)`
- `requireIncludes(...)`
- `orderBy(...)`
- `limit(...)`
- `offset(...)`
- `includeDeleted(...)`
- `hopTo(...)`
- `gather(...)`

Important query options:

- `tier`
- `localUpdates`
- `propagation`
- `visibility`

Important write APIs:

- `db.insert(table, data, options?)`
- `db.update(table, rowId, data, options?)`
- `db.delete(table, rowId, options?)`
- `db.upsert(table, rowId, data, options?)`
- `db.restore(table, rowId, options?)`
- `db.transaction(...)`
- `db.batch(...)`

Confirmed sources:

- `packages/jazz-tools/src/runtime/db.ts`
- `packages/jazz-tools/src/runtime/client.ts`
- `packages/jazz-tools/src/react-core/use-all.ts`
- Jazz docs: `reading/queries`, `reading/filters-and-sorting`, `reading/includes-and-relations`, `writing/writing-data`, `reference/durability-tiers`

## Generic query builder

A generic query builder is a structural implementation of Jazz's `QueryBuilder` contract that works with arbitrary table names and a fetched `WasmSchema`.

Regarde uses it because the inspector must support arbitrary app schemas without importing generated table handles from the inspected app.

Current Regarde implementation:

- `apps/web-inspector/src/lib/table-explorer/genericQueryBuilder.ts`

The builder stores:

- `_table`
- `_schema`
- `_rowType`
- `conditions`
- `orderBys`
- `limitValue`
- `offsetValue`

Supported methods:

- `where(...)`
- `orderBy(...)`
- `limit(...)`
- `offset(...)`
- `_build()`

Current serialized shape:

```/dev/null/genericQueryBuilder.ts#L1-10
{
  table,
  conditions,
  includes: {},
  orderBy,
  limit,
  offset,
  hops: [],
}
```

Jazz translates this shape to relation IR before execution.

Confirmed source:

- Regarde: `apps/web-inspector/src/lib/table-explorer/genericQueryBuilder.ts`
- Jazz: `packages/jazz-tools/src/runtime/query-adapter.ts`
- Official inspector: `packages/inspector/src/utility/generic-query-builder.ts`

Unknown:

- Jazz exports `allRowsInTableQuery(tableName, schema)` for the simplest arbitrary-table read.
- Jazz does not appear to export a full generic query builder factory matching the official inspector's implementation.

## Filtering and sorting

Regarde currently stores filters and sorting in URL search params.

v1 keeps filters and sorting URL-backed for the active tab view and also saves them per tab view in local storage. This allows several tab views of the same table to keep different filters and sort state.

Relevant files:

- `apps/web-inspector/src/hooks/useTableExplorerSearchParams.ts`
- `apps/web-inspector/src/types/tableFilters.ts`
- `apps/web-inspector/src/components/table-explorer/data/tableFilter.tsx`
- `apps/web-inspector/src/lib/table-explorer/filterParsing.ts`
- `apps/web-inspector/src/lib/table-explorer/whereOperators.ts`
- `apps/web-inspector/src/hooks/useTableQuery.ts`

Current supported filter operators:

- `eq`
- `ne`
- `gt`
- `gte`
- `lt`
- `lte`
- `contains`
- `in`
- `isNull`

Filter values are parsed from strings into typed values using schema metadata.

Sorting is limited to supported column types.

Current limitation:

- URL filter parsing validates basic shape, but does not fully validate every operator, column, and value before applying it.

## Relation cells

Regarde gets relation information from column-level schema metadata.

If a column has `references`, the column references another table.

Example meaning:

- column: `projectId`
- `references: "projects"`
- cell value: related project row id

Current Regarde flow:

1. `buildDataGridColumns(...)` checks `column.column?.references`.
2. If the current cell value is a non-empty string, it renders `RelationCellLink`.
3. `RelationCellLink` calls `useRelationRow(relationTable, relationId)`.
4. `useRelationRow(...)` queries the referenced table with `id = relationId` and `limit(1)`.
5. It picks a display column using schema heuristics.
6. It links to the referenced table with an `id eq relationId` filter.

v1 relation navigation opens or focuses a table tab view for the referenced table. If no matching filtered tab view exists, it creates one with an `id = relationId` filter.

Relevant Regarde files:

- `apps/web-inspector/src/components/table-explorer/data/buildDataGridColumns.tsx`
- `apps/web-inspector/src/components/table-explorer/data/relationCellLink.tsx`
- `apps/web-inspector/src/hooks/useRelationRow.ts`
- `apps/web-inspector/src/lib/table-explorer/relationNavigation.ts`
- `apps/web-inspector/src/lib/table-explorer/tableSchema.ts`

Relation display column priority:

- `name`
- `title`
- `label`
- `displayName`
- `display_name`
- `username`
- `handle`
- `slug`
- `email`

Current limitation:

- Relation labels may create one secondary live query per relation cell.
- Relation display labels are schema-only heuristics.
- No app-defined display label metadata was found.

v1 direction:

- Show the raw relation id immediately.
- Resolve friendly labels progressively when affordable.
- Cache relation labels by connection, branch, schema hash, table, and id.
- Never block grid rendering on relation label loading.

## Mutation and insert

Regarde performs mutations through the Jazz runtime `Db` API.

It creates a structural `TableProxy` for the selected table, then calls write methods from `useDb()`.

Current Regarde flow:

1. `useTableMutations(tableName)` reads `db` from `useDb()`.
2. It creates a table proxy from the selected table and `runtime.wasmSchema`.
3. Insert calls `db.insert(tableProxy, values).wait({ tier: "edge" })`.
4. Update calls `db.update(tableProxy, rowId, values).wait({ tier: "edge" })`.
5. Delete calls `db.delete(tableProxy, rowId).wait({ tier: "edge" })`.

Relevant Regarde files:

- `apps/web-inspector/src/hooks/useTableMutations.ts`
- `apps/web-inspector/src/lib/table-explorer/tableProxy.ts`
- `apps/web-inspector/src/lib/table-explorer/mutationParsing.ts`
- `apps/web-inspector/src/components/table-explorer/data/rowEditorFields.tsx`
- `apps/web-inspector/src/components/table-explorer/data/editRowForm.tsx`
- `apps/web-inspector/src/components/table-explorer/data/insertRowForm.tsx`

Mutation value parsing uses schema metadata:

- boolean
- integer
- bigint
- double
- timestamp
- JSON
- array
- row object
- enum
- text
- UUID

Bytea fields are read-only.

Permissions:

- Regarde fetches stored permissions and shows them in the schema view.
- The Table Explorer does not currently use stored permissions to hide or disable mutation UI.
- Mutations are attempted through Jazz APIs, and failures surface as mutation errors.

## Official Jazz inspector comparison

The official standalone inspector uses the same general approach:

- create a Jazz client
- fetch stored schema
- fetch schema hashes
- fetch stored permissions
- build table list from `Object.keys(wasmSchema)`
- build columns from schema columns
- use a generic query builder
- query rows with `useAll(...)`
- create a structural `TableProxy` for mutations
- use `db.insert`, `db.update`, and `db.delete`

Notable differences found in source:

- Official inspector uses offset pagination with `limit(pageSize + 1)` and `offset(pageIndex * pageSize)`.
- Regarde currently grows the limit from offset `0`, which acts like incremental loading.
- Official inspector has no row detail/sidebar route in the inspected source.
- Regarde already has row side-panel foundations.

Confirmed official source:

- `packages/inspector/src/App.tsx`
- `packages/inspector/src/pages/data-explorer/index.tsx`
- `packages/inspector/src/components/data-explorer/TableDataGrid.tsx`
- `packages/inspector/src/components/data-explorer/TableFilterBuilder.tsx`
- `packages/inspector/src/utility/generic-query-builder.ts`

## Current limitations and risks

- No total row count is available in Regarde.
- Current incremental loading grows `limit` from offset `0`.
- Relation labels may create many secondary queries.
- Filter parsing is partly permissive.
- Permissions are displayed raw but not used for mutation affordances.
- Binary mutation fields are read-only.
- A full generic query builder factory is not exposed as a stable Jazz public API.
- Relation metadata is only column-level `references`; no separate relation graph metadata was found.
- The exact server permission failure payload available to the UI is unknown.

## Product guidance for v1

The Table Explorer should treat schema metadata as the source of UI structure and Jazz runtime APIs as the source of data and writes.

Recommended direction:

- Keep the explorer schema-driven and generic.
- Keep table list as navigation, not a full schema browser.
- Improve the grid around reading, filtering, selection, relations, and safe edits.
- Validate filters before applying clauses.
- Use page-windowed pagination with Jazz `limit(pageSize + 1)` and `offset(pageIndex * pageSize)`.
- Keep relation navigation useful while preventing relation label queries from blocking grid rendering.
- Show stored permissions as debugging hints, but keep the server/runtime response authoritative for mutations.

## v1 decisions

- Regarde switches from incremental loading to page-windowed pagination.
- Pagination is the product model; virtualization can still render the current page efficiently.
- The default page size is 100 rows, with 100, 500, and 1000 as page-size options.
- Do not show exact total pages or exact row counts unless Jazz exposes a reliable count API.
- The same table can be opened in several tab views with different filters or sort state.
- Filters and sort are per tab view.
- Grid column state is per table.
- Relation cell labels load progressively, use raw ids as fallback, and are cached by connection, branch, schema hash, table, and id.
- Stored permissions do not disable mutation UI by themselves. They are hints; mutation success or failure comes from Jazz runtime/server behavior.
- Regarde keeps its structural generic query builder for v1. `allRowsInTableQuery(...)` is only suitable for the simplest arbitrary-table read and does not replace filters, sorting, limit, and offset.
- Filters are validated before URL state is accepted as applied query state.
- Row detail and mutation flows remain side-panel-first.
- Inline cell editing is out of scope for v1.
- Row bookmarks are UI-only, attach to row ids, and are scoped to connection, branch, schema hash, and table.
- Hidden bookmarks remain in the table bookmark list; clicking one opens a tab view with an `id = bookmarkedRowId` FilterBar token.
