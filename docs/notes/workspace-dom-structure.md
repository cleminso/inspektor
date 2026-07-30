## High-level

1. `content.tsx` orchestrates everything

- reads route/search state
- loads table rows and schema
- manages selection
- manages row editor open/close state
- manages column visibility
- builds the TanStack table instance
- renders either:
  - schema view, or
  - data grid

2. `actionBar` is the outer row container

- render the left-side view switch (data / schema)
- render whatever is passed as children on the right side

- left slot = view switch
- right slot = injected action

`InspectorDataGridToolbar` return actions related to the grid itself

`content.tsx` does this:

- render ActionsBar
- pass InspectorDataGridToolbar as children

Then ActionsBar decides where those children go.
So visually the DOM becomes roughly:

- top bar row
  - left: data/schema buttons
  - right: columns row buttons

- Content
  - ActionsBar
    - left: view toggle
    - right: InspectorDataGridToolbar children
  - either:
    - SchemaView
    - or InspectorDataGrid
  - RowEditorSidePanel

Conceptually

- ActionsBar = page-level row layout
- InspectorDataGridToolbar = data-specific controls placed into that layout

This split is intentional because:

- ActionsBar should always exist
- InspectorDataGridToolbar should exist only in data view

## How the data grid itself works

`useTableRows`
Provides:

- rows
- columns
- loadedRowCount
- hasMore
- isFetchingMore
- fetchMore

`useTableSelection`
Tracks selected row ids separately from TanStack.

`useColumnVisibility`
Persists visible/hidden columns for the current table key.

`useInspectorDataGrid`
Bridges app state to TanStack Table:

- builds column defs from schema
- maps selected row ids into TanStack rowSelection
- maps sorting state
- handles callbacks from TanStack back into app state

`InspectorDataGrid`
Renders the actual ReUI/TanStack table:

- sticky header
- virtual rows
- infinite load on scroll
- bottom footer with loaded-row status

## Render tree

- ActionsBar

- Content
  - ActionsBar
    - left:
      - button toggle `tableListPane`
      - view switch
      - Insert row
    - right:
      - InspectorDataGridToolbar with Columns
  - either:
    - SchemaView
    - or InspectorDataGrid
  - RowEditorSidePanel
