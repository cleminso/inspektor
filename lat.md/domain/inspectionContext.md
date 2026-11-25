# Inspection context

Studio inspects one Jazz app through a saved local connection. Stored schema metadata determines the available tables, fields, filters, and mutation inputs.

## Contents

This contract separates connection identity, workspace context, and remote data scope.

- [Connection identity](#connection-identity)
- [Schema and branch](#schema-and-branch)
- [Workspace identity](#workspace-identity)

## Connection identity

A saved connection identifies a local profile, not a portable remote administration link.

The profile contains a local ID, name, server URL, app ID, environment, and credential-retention policy. The runtime connection adds the admin secret. [[apps/studio/src/app/connections/connections.ts#writeStoredConnections]] persists an explicit secret-free projection.

Two browser tabs can use different connections. Mounted tabs do not automatically ingest each other's profile writes. Credential retention belongs to [[jazzAccess#Credential boundary]].

## Schema and branch

The schema hash selects stored schema metadata. The local branch label does not select Jazz data.

An available explicit URL schema takes precedence. Otherwise, connection entry uses the first schema in the catalogue. [[jazzAccess#Metadata access]] defines discovery ordering.

[[packages/core/src/studio/connection.ts#buildSchemaCatalogue]] owns catalogue ordering. [[packages/core/src/workbench/connection.ts#createConnectionRuntime]] treats branch as local runtime identity only.

Studio does not expose branch controls or supply operation-scoped Jazz branch views. A branch label is not evidence that reads or writes target that branch.

## Workspace identity

Connection ID, local branch label, and schema hash partition workspace state.

[[apps/studio/src/features/tables/workspace/scope.ts#createTableWorkspaceScope]] derives that scope. Table state adds the table name. Tabs and layout are local presentation; they do not define remote row identity.

A row ID identifies a row. A row's position depends on the active filter, sort, and page. Live changes can move that position.

See [[routing]] for URL ownership and [[exploreTables]] for table navigation.
