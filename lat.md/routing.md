# Inspektor route structure

This document defines route identity and separates URL state from local workspace presentation.

## Table of contents

This table of contents links to the document sections.

- [Mental model](#mental-model)
- [Route structure](#route-structure)
- [Stable route ancestry](#stable-route-ancestry)
- [Context ownership](#context-ownership)
- [Workspace-item routing](#workspace-item-routing)
- [State ownership](#state-ownership)
- [Key decisions](#key-decisions)
- [Browser-tab behavior](#browser-tab-behavior)
- [Example URLs](#example-urls)

## Mental model

The route identifies one saved local connection and the active content inside the workbench described by [[workspace-dom-structure#Table workspace structure|the table workspace structure]].

- Header: connection, branch, schema hash, and global context controls.
- Left dock: Tables or Live queries resource navigator.
- Main workspace: open workspace items represented by tabs.
- Route: active resource, representation, and shareable representation state.

The route does not represent the visual tab strip, open item order, pane arrangement, or dock selection.

## Route structure

The route tree places table and live-query resources under one saved connection.

```text
/conn                         → transparent outlet boundary
├── /                         → connections layout and saved connections
├── new                       → connections layout and add form
├── edit/:connectionId        → connections layout and edit form
└── :connectionId             → runtime provider and workbench
    ├── tables/
    │   └── :tableName/
    │       └── index         → Data or Schema representation
    └── live-queries          → Live queries navigator entry
```

Data is the primary table surface and does not add a `/data` segment.

Filters, sorting, and other shareable Data state use search parameters. Schema is a distinct representation selected with
`view=schema` on the table route.

## Stable route ancestry

The `/conn` route is a transparent boundary that always renders one unwrapped outlet.

Onboarding leaves own `ConnectionsLayout`. The `:connectionId` child owns `InspectorRuntimeBoundary`
and the workbench. This placement keeps the matched subtree at one React position while navigation
moves from onboarding into a connection.

Do not choose an outlet wrapper from the current location, the resolved location, or pending router
state. A conditional parent creates this unhappy path:

1. The router begins navigation while the onboarding layout remains committed.
2. The matched workspace subtree appears below the old wrapper.
3. The route resolves and removes that wrapper.
4. React discards the descendant tree because its parent type and position changed.
5. The runtime provider mounts again and restarts metadata requests, the Jazz client, the WebSocket,
   subscriptions, and local component state.

The remount can duplicate privileged requests and preflights. It can also close a client that is still
starting, discard in-flight results, reconnect subscriptions, and reset workspace state. These failures
look like network or Strict Mode duplication even though route ancestry caused them.

Conditional siblings do not have this problem when the provider and outlet remain in the same
position. Use a `key` only when a route identity change must reset the subtree.

## Context ownership

`connectionId` remains in the path because it resolves one profile from the local `inspektor-connections` store. It

lets separate browser tabs open different saved connections and restore the intended profile after reload.

Branch is a workspace preference for the selected connection. Schema hash is both a saved preference and optional route search
state:

- the header displays and changes them
- `preferencesByConnectionId` remembers the last branch and schema hash
- the parent connection route fetches the available schema hashes before it commits a runtime target
- the parent connection route validates and retains `?schema=` across child navigation
- a valid explicit `?schema=` selects that schema, while an unavailable hash is replaced with the first advertised schema
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

Data and Schema items use distinct icons derived from their explicit item kind. Generated ids do not determine item meaning.

## State ownership

URL, local storage, and memory each own state with different sharing and restoration needs.

### URL

The URL stores the active connection, resource, representation, and shareable representation state.

- connection id
- active resource
- active representation
- shareable filters and sorting
- page and page size
- shareable row-editor target when required

### Local storage

Local storage preserves connection credentials, workspace preferences, item state, layout, and table columns.

- saved connection profiles and credentials
- last branch and schema hash per connection
- open workspace items and recent items
- item order and representation-specific saved state
- pane layout and left-dock selection
- table column preferences

Workspace state remains scoped by connection, branch, and schema hash. Branch is not part of the visible content route. Schema
can appear as the parent route's `?schema=` search parameter.

### Memory

Memory holds transient selection, focus, highlights, drag state, and other non-restored interactions.

- transient row and cell selection
- focus
- live-update highlights
- drag state
- other interaction state that does not need restoration

Do not add `sessionStorage` unless a specific state must survive navigation without surviving a browser restart.

## Key decisions

These decisions keep route identity independent from workspace tabs and local layout.

| Decision                                      | Rationale                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Keep connection id in the path                | Resolves one saved local profile and preserves connection-level browser-tab isolation.   |
| Keep branch out of content routes             | It is visible header context and a saved preference of the selected connection.          |
| Allow schema in parent route search           | It selects a schema explicitly and remains available across connection child navigation. |
| Omit `/data`                                  | Data is the default table representation.                                                |
| Select Schema with `view=schema`              | Schema is a distinct workspace-item representation on the table route.                   |
| Keep tabs out of routes                       | Tabs are one presentation of workspace items and may later exist in several panes.       |
| Keep filters in search parameters             | Filters are shareable state of a Data item.                                              |
| Keep Tables and Live queries in the left dock | They are different resource navigators and switching them must not replace main content. |
| Keep `/conn` as a transparent outlet          | Onboarding layout changes cannot remount the connection runtime and restart its work.    |

## Browser-tab behavior

Each browser tab mounts an independent React state tree. The connection store is shared through `localStorage`, but Inspektor

does not automatically ingest another tab's writes while mounted.

This allows two tabs using the same connection to keep independent grid presentation, filters, selection, and editor state.
After reload, each tab resolves the connection from its route and branch and schema from the saved preferences for that
connection.

The model does not promise that two tabs using the same connection can permanently restore different branch or schema choices.
That would require branch and schema route identity or a separate per-window workspace id.

## Example URLs

These examples show canonical routes for table data, schema, and live queries.

```text
# Default Data representation
/conn/local-profile-id/tables/users

# Filtered Data representation
/conn/local-profile-id/tables/users?filters=<encoded>

# Table Schema representation
/conn/local-profile-id/tables/users?view=schema

# Table Schema representation with an explicit schema hash
/conn/local-profile-id/tables/users?view=schema&schema=schema-hash

# Live queries navigator
/conn/local-profile-id/live-queries

```
