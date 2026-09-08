# Table workspace structure

This document maps route state to table workspace tabs, Data views, and Schema views.

## Table of contents

This table of contents links to the document sections.

- [Workspace flow](#workspace-flow)
- [Data view](#data-view)
- [Schema view](#schema-view)

## Workspace flow

Route state selects table content while `TableTabsProvider` reconciles the corresponding workspace tab.

`TableExplorerScreen` composes the table-list dock and `TableTabsView` according to [[routing#Workspace-item routing|workspace-item routing]]. Route search state identifies the selected table content. Data is the default content because table links omit `view` and the search parser resolves a missing value to `data`.

Setting `view=schema` makes the route search non-base. `TableTabsProvider` reconciles that search into a separate workspace tab while retaining the table's base data tab. `SelectedTableView` then renders `SchemaView` for that tab.

## Data view

`TableView` renders:

- A toolbar whose trailing actions are column visibility, schema, and insert row.
- The compact `DataGrid` and loaded-row footer.
- The deferred row editor when insert or edit mode is active.

The schema action uses the route search setter. Tab creation remains owned by `TableTabsProvider` rather than the toolbar.

`useTableViewState` connects URL-backed filters and sorting, [[tableRowsQueryLifecycle#Table row query lifecycle|Jazz row queries]], persisted column preferences, TanStack Table state, selection, and row-editor state.

## Schema view

`SchemaView` renders schema and permission data without an empty data-grid toolbar. Its workspace tab retains the selected table name and schema route search.
