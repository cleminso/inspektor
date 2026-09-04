# Data-table architecture research plan

## Question

How should Inspektor structure a schema-aware data table for reading, filtering, selection, relation navigation, schema context, and safe row editing?

## Scope

### OpenStatus architecture

- Table schema, generated artifacts, state adapters.
- TanStack integration, query transport, server filtering, pagination.
- Extension boundaries.

### OpenStatus interaction model

- Filtering, column management, selection, detail views.
- Keyboard behavior, responsive behavior, product states.

### Jazz capability mapping

- Stored schemas, query operators, ordering, pagination, subscriptions.
- Relations, permissions, mutations, durability, conflicts.

### Inspektor architecture mapping

- Route state through schema metadata.
- Query construction, table state, relation resolution, side-panel mutations.
- Reusable boundaries and replacement surfaces.

## Synthesis

Compare systems by responsibility, not component names. Produce alternative architecture models, identify unsupported semantics, and converge on a model through discussion before implementation planning.

## Sources

- OpenStatus repository and documentation.
- Jazz documentation.
- Inspektor current table implementation.
