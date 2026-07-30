# Frontend structure

## Table of contents

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

- `app` owns application-wide infrastructure: providers, connection persistence, runtime setup, routing contracts, session state, and the connected-application shell.
- `features` own product capabilities, including onboarding, Tables, and Queries.
- `routes` contain TanStack Router adapters. Routes declare loaders, search validation, and route composition, then delegate product and runtime behavior to their owners.
- `shared` contains code with multiple existing owners. It is not a staging area for code that might become shared.

The connected header belongs to `app/shell` because it composes application-wide connection context and primary navigation. Tables-specific docks and workspace behavior remain inside the Tables feature until another capability requires the same contract.

## Implemented structure

```text
src/
  app/
    connections/
    providers/
    routing/
    runtime/
    session/
    shell/
      header/
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

- `filters` owns filter parsing, operators, and filter types.
- `grid` owns DataGrid column construction, selection, visibility, ordering, and cell presentation.
- `query` owns generic Jazz query construction and row-loading hooks.
- `routing` owns Tables URL search state and relation-table links.
- `rowEditor` owns insert and edit forms, mutation drafts, field focus, and value presentation.
- `schema` owns stored-schema interpretation and schema presentation.
- `tableList` owns table discovery presentation, pinning, list selection, and the Tables-specific left-dock layout.
- `workspace` owns open table views, workspace tabs, and table-view orchestration.

Feature-root modules such as `tableTypes.ts` and `valueParsing.ts` are valid when several Tables slices use them and no narrower owner exists.

## Placement rule

Use the narrowest owner that explains both the behavior and its consumers:

- Application or runtime infrastructure belongs to `app`.
- Product behavior belongs to its feature.
- Behavior used by several slices of one feature belongs at that feature's nearest common boundary.
- Code moves to `shared` only after multiple owners consume it.
- Route-specific declarations remain in `routes`; reusable behavior invoked by a route belongs to `app` or the relevant feature.

A row editor therefore belongs to `features/tables/rowEditor`, even when a Tables workspace renders it in a side pane. The Tables left-dock layout belongs to `features/tables/tableList` while Tables is its only consumer.

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
- Use `@app/*`, `@tables/*`, `@queries/*`, `@onboarding/*`, and `@shared/*` for cross-owner imports.
- Prefer relative imports for modules within the same focused directory.
- Avoid broad barrel exports that hide cross-owner dependencies.

## Evolution constraints

- Keep structural moves separate from behavior and UI changes.
- Keep tests beside their source.
- Preserve provider placement and deferred import boundaries when moving modules.
- Keep routes focused on router integration and never edit `routeTree.gen.ts` manually.
- Generalize workspace or dock infrastructure only after another feature requires the same contract.
- Update this document when ownership terminology or directory boundaries change.
