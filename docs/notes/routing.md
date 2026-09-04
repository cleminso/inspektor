# Inspektor route structure

## Table of contents

- [Mental model](#mental-model)
- [Route structure](#route-structure)
- [Context ownership](#context-ownership)
- [Workspace-item routing](#workspace-item-routing)
- [State ownership](#state-ownership)
- [Key decisions](#key-decisions)
- [Browser-tab behavior](#browser-tab-behavior)
- [Inspektor link prefill](#inspektor-link-prefill)
- [Example URLs](#example-urls)

## Mental model

The route identifies one saved local connection and the active content inside its workbench.

- Header: connection, branch, schema hash, and global context controls.
- Left dock: Tables or Live queries resource navigator.
- Main workspace: open workspace items represented by tabs.
- Route: active resource, representation, and shareable representation state.

The route does not represent the visual tab strip, open item order, pane arrangement, or dock selection.

## Route structure

```text
/conn/:connectionId/
├── tables/
│   └── :tableName/
│       ├── index          → Data representation
│       ├── schema         → Schema representation
│       └── stats          → later Stats representation
└── queries/
    ├── index              → Live queries navigator entry
    └── :queryId           → Query workspace item
```

Data is the primary table surface and does not add a `/data` segment.

Filters, sorting, and other shareable Data state use search parameters. Schema is a distinct representation and uses a path
segment instead of `view=schema` search state.

## Context ownership

`connectionId` remains in the path because it resolves one profile from the local `inspektor-connections` store. It
lets separate browser tabs open different saved connections and restore the intended profile after reload.

Branch and schema hash do not remain in ordinary content routes. They are workspace preferences for the selected connection:

- the header displays and changes them
- `preferencesByConnectionId` remembers the last branch and schema hash
- runtime bootstrap validates the remembered schema against available schema hashes
- changing either value replaces the Inspektor runtime and restores workspace state for the resolved context

A content URL is local-context-relative. It is expected to reopen an item using the saved connection profile on the same
Inspektor installation. It is not a portable remote-admin URL and does not carry credentials.

## Workspace-item routing

The route describes active content, not `WorkspaceTabs` or a tab id.

A workspace item has:

- a stable local instance identity
- a resource
- a representation
- representation-specific state

The active route can focus an equivalent persisted item or create an item when no equivalent item exists. Direct navigation
therefore remains useful without coupling browser history to the visual tab implementation.

Opening rules:

- clicking a table in the Tables navigator opens or focuses its default unfiltered Data item
- the same table can have several Data items when their filters differ
- clicking a relation opens or focuses the referenced table's default unfiltered Data item
- clicking Schema in a Data toolbar opens or focuses the Schema item for that table
- clicking a grouped subscription in the Live queries navigator opens or focuses its query item

Data, Schema, and Query items use distinct icons derived from their explicit item kind. Generated ids do not determine item
meaning.

## State ownership

### URL

- connection id
- active resource
- active representation
- shareable filters and sorting
- shareable row-editor target when required

### Local storage

- saved connection profiles and credentials
- last branch and schema hash per connection
- open workspace items and recent items
- item order and representation-specific saved state
- pane layout and left-dock selection
- table column preferences

Workspace state remains scoped by connection, branch, and schema hash even though branch and schema hash are not part of the
visible content route.

### Memory

- pagination
- transient row and cell selection
- focus
- live-update highlights
- drag state
- other interaction state that does not need restoration

Do not add `sessionStorage` unless a specific state must survive navigation without surviving a browser restart.

## Key decisions

| Decision                                      | Rationale                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Keep connection id in the path                | Resolves one saved local profile and preserves connection-level browser-tab isolation.   |
| Keep branch and schema out of content routes  | They are visible header context and saved preferences of the selected connection.        |
| Omit `/data`                                  | Data is the default table representation.                                                |
| Give Schema its own path                      | Schema is a distinct workspace-item representation, not Data search state.               |
| Keep tabs out of routes                       | Tabs are one presentation of workspace items and may later exist in several panes.       |
| Keep filters in search parameters             | Filters are shareable state of a Data item.                                              |
| Keep Tables and Live queries in the left dock | They are different resource navigators and switching them must not replace main content. |

## Browser-tab behavior

Each browser tab mounts an independent React state tree. The connection store is shared through `localStorage`, but Inspektor
does not automatically ingest another tab's writes while mounted.

This allows two tabs using the same connection to keep independent grid presentation, filters, selection, and editor state.
After reload, each tab resolves the connection from its route and branch and schema from the saved preferences for that
connection.

The model does not promise that two tabs using the same connection can permanently restore different branch or schema choices.
That would require branch and schema route identity or a separate per-window workspace id.

## Inspektor link prefill

Local development can still open the connection flow with credentials in the URL hash:

`/conn/new#serverUrl=<encoded>&appId=<encoded>&adminSecret=<encoded>`

The hash pre-fills and validates a saved local connection. After validation, Inspektor assigns a local connection id and opens
its workbench. Ordinary content routes never include the admin secret.

## Example URLs

```text
# Default Data representation
/conn/local-profile-id/tables/users

# Filtered Data representation
/conn/local-profile-id/tables/users?filters=<encoded>

# Table Schema representation
/conn/local-profile-id/tables/users/schema

# Live queries navigator
/conn/local-profile-id/live-queries

# Live query workspace item
/conn/local-profile-id/live-queries/group-key
```
