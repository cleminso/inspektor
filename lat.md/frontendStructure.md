# Frontend structure

This document defines ownership, placement, and import boundaries in the web application.

## Table of contents

This table of contents links to the document sections.

- [Purpose](#purpose)
- [Ownership](#ownership)
- [Implemented structure](#implemented-structure)
- [Tables feature structure](#tables-feature-structure)
- [Placement rule](#placement-rule)
- [Import direction](#import-direction)
- [Evolution constraints](#evolution-constraints)

## Purpose

The frontend uses explicit ownership boundaries instead of technical root buckets such as `components`, `hooks`, `lib`, and `types`. Related presentation, state, domain logic, and tests live together under the owner responsible for their behavior.

## Ownership

The web application assigns infrastructure, product behavior, route adapters, and shared code to explicit owners.

- `app` owns application-wide infrastructure: providers, connection persistence, runtime setup, routing contracts, session state, and the connected-application shell.
- `features` own product capabilities, including onboarding, Tables, and Live queries.
- `routes` contain TanStack Router adapters. Routes declare loaders, search validation, and route composition, then delegate product and runtime behavior to their owners.
- `shared` contains code with multiple existing owners. It is not a staging area for code that might become shared.

The connected header and footer chrome belong to `app/shell` and follow [[shellLayout#Shell Layout ownership|Shell Layout ownership]]. The header contains connection context and theme controls; workspace navigation controls live in the footer. The design system owns generic shell geometry and dock mechanics. `app/shell` owns the universal Inspektor layout preference, storage migration, and product controls. Tables and Live queries compose their content into shell regions without owning shell state.

## Implemented structure

The implemented directory tree groups infrastructure by application owner and product code by feature.

```text
src/
  app/
    connections/
    providers/
    routing/
    runtime/
    session/
    shell/
      footer/
      header/
      shellLayoutStorage.ts
  features/
    onboarding/
    queries/
      navigation/
      telemetry/
    tables/
      filters/
      grid/
      query/
      routing/
      rowEditor/
      schema/
      tableList/
      workspace/
  routes/
  shared/
    connections/
```

The root `components`, `hooks`, `lib`, and product-wide `types` buckets are intentionally absent. Hooks, models, routing helpers, and types live beside their owner.

## Tables feature structure

The Tables feature divides filters, grid behavior, queries, routing, editing, schema, navigation, and workspace state by owner.

- `filters` owns filter parsing, operators, and filter types.
- `grid` owns DataGrid column construction, selection, visibility, ordering, and cell presentation.
- `query` owns generic Jazz query construction and row-loading hooks.
- `routing` owns Tables URL search state and relation-table links.
- `rowEditor` owns insert and edit forms, mutation drafts, field focus, and value presentation.
- `schema` owns stored-schema interpretation and schema presentation.
- `tableList` owns table discovery presentation, pinning, and list selection inside the shell's left dock.
- `workspace` owns open table views, workspace tabs, and table-view orchestration.

Feature-root modules such as `tableTypes.ts` and `valueParsing.ts` are valid when several Tables slices use them and no narrower owner exists.

## Placement rule

Use the narrowest owner that explains both the behavior and its consumers:

- Application or runtime infrastructure belongs to `app`.
- Product behavior belongs to its feature.
- Behavior used by several slices of one feature belongs at that feature's nearest common boundary.
- Code moves to `shared` only after multiple owners consume it.
- Route-specific declarations remain in `routes`; reusable behavior invoked by a route belongs to `app` or the relevant feature.

A row editor therefore belongs to `features/tables/rowEditor`, even when a Tables workspace renders it in a side pane. Generic shell geometry and dock mechanics belong to `@inspektor/ds`; universal Inspektor persistence and controls belong to `app/shell`; feature content remains with Tables or Live queries.

## Import direction

The intended dependency direction is:

```text
routes -> app, features, shared
features -> app, shared, same-feature modules
app -> shared
shared -> external packages and same-shared-owner modules
```

Additional rules:

- Features do not import route modules.
- One feature does not import another feature's internal modules.
- `app` exposes infrastructure and routing contracts but does not own feature behavior.
- Application-shell controls consume generic shell state without importing feature internals.
- Use `@app/*`, `@tables/*`, `@queries/*`, `@onboarding/*`, and `@shared/*` for cross-owner imports.
- Prefer relative imports for modules within the same focused directory.
- Avoid broad barrel exports that hide cross-owner dependencies.

## Evolution constraints

These constraints preserve ownership and runtime behavior as the frontend structure changes.

- Keep structural moves separate from behavior and UI changes.
- Keep tests beside their source.
- Preserve provider placement and deferred import boundaries when moving modules.
- Keep routes focused on router integration and never edit `routeTree.gen.ts` manually.
- Keep reusable shell geometry in the design system and product-specific dock behavior in its application owner.
- Update this document when ownership terminology or directory boundaries change.
