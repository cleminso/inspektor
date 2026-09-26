# Jazz branch behavior

Jazz alpha.57 defines branches through schema columns and selects branch views per query or mutation.

## Table of contents

The sections describe the branch schema, branch views, and operation options.

- [Branch schema](#branch-schema)
- [Branch views](#branch-views)
- [Query and mutation behavior](#query-and-mutation-behavior)

## Branch schema

A table declares one or more branch-key columns through `branchBy`.

Branch-key columns are ordinary, immutable table columns. They are returned by `select("*")` and
are not `$` magic columns. A single-column branch accepts a scalar coordinate. A compound branch
requires an object containing every branch-key column.

## Branch views

A branch view contains a head and can contain a base.

The head selects the branch whose rows the operation reads or changes. A base can track another
live branch or freeze that branch at a snapshot. Alpha.54 requires a head whenever a base is set.
Read coordinates contain every branch-key name used by the schema, while mutation coordinates are
validated against the target table.

## Query and mutation behavior

Jazz receives branch coordinates with each database operation rather than when it creates a client.

- Queries pass the head through `QueryOptions.branch` and the optional base through
  `QueryOptions.base`.
- Inserts and restores pass the target branch through `branch`.
- Updates, upserts, and deletes pass the head through `branch` and can pass a live or frozen `base`.
- Written branch-column values must agree with the operation's branch coordinate.

`createInspectorAdminClient` has no branch option. Changing a branch view does not require a new
Jazz client.

Inspektor does not expose branch controls because it does not yet construct Jazz branch views
for individual queries and mutations.
