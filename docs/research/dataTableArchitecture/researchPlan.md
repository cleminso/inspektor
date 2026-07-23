# Data-table architecture research plan

## Table of contents

- [Research question](#research-question)
- [OpenStatus architecture](#openstatus-architecture)
- [OpenStatus interaction model](#openstatus-interaction-model)
- [Jazz capability mapping](#jazz-capability-mapping)
- [Inspector architecture mapping](#inspector-architecture-mapping)
- [Synthesis](#synthesis)

## Research question

How should Inspector structure a schema-aware data-table surface for reading, filtering, selection, relation navigation, schema context, and safe row editing?

## OpenStatus architecture

Identify the table schema, generated artifacts, state adapters, TanStack integration, query transport, server filtering, pagination, and extension boundaries.

## OpenStatus interaction model

Catalog filtering, column management, selection, detail views, keyboard behavior, responsive behavior, and product states.

## Jazz capability mapping

Map stored schemas, query operators, ordering, pagination, subscriptions, relations, permissions, mutations, durability, and conflict behavior to generic grid requirements.

## Inspector architecture mapping

Trace the active implementation from route state through schema metadata, query construction, table state, relation resolution, and side-panel mutations. Identify reusable boundaries and replacement surfaces.

## Synthesis

Compare the systems by responsibility rather than component names. Produce alternative architecture models, identify unsupported semantics, and converge on a model through user discussion before implementation planning.
