# Studio routing

The URL identifies active content within one saved local connection. It does not identify the visual tab strip or pane layout.

## Contents

This contract owns route identity, stable ancestry, and state placement.

- [Route identity](#route-identity)
- [Stable route ancestry](#stable-route-ancestry)
- [State placement](#state-placement)
- [Accepted workspace selection](#accepted-workspace-selection)

## Route identity

Connection routes contain table resources and their shareable representation state.

- `/conn` lists saved connections.
- `/conn/new` and `/conn/edit/:connectionId` own connection forms.
- `/conn/:connectionId/tables/:tableName` opens Data by default.
- `view=schema` selects Schema on the same table route.
- `schema` selects stored schema metadata across connection children.
- Filters, sort, direction, page, and page size use validated search parameters.

The route omits `/data`, branch labels, tab IDs, tab order, and dock selection. Legacy Live queries URLs redirect under [[exploreTables#Read result state]].

[[apps/studio/src/features/tables/routing/tableRowsSearch.ts#canonicalizeTableRouteSearch]] removes default search values and rejects malformed pagination. [[apps/studio/src/routes/conn/$connectionId.tsx#Route]] retains schema search state.

## Stable route ancestry

The `/conn` route always renders one unwrapped outlet.

Onboarding leaves own their layouts. The connection child owns its runtime boundary and workbench. [[apps/studio/src/routes/-connRoute.tsx#ConnRoute]] preserves that React position.

A location-dependent parent wrapper remounts descendants when the wrapper changes. That restarts metadata requests, privileged clients, transport, subscriptions, and local state. Keep provider and outlet ancestry unconditional.

Use a React key only for an intentional identity reset. Pending router state is not a reason to replace a shared lifecycle owner.

## State placement

Persistence follows sharing and restoration needs.

The URL owns active content and shareable query state. Local storage owns secret-free profiles, preferences, workspace items, layout, and column choices. Workspace state uses [[inspectionContext#Workspace identity]].

Memory owns transient interaction and active credentials. Opted-in session storage can retain credentials under [[jazzAccess#Credential boundary]]. Credentials never belong in URL state or local storage.

Browser tabs mount independent React trees. Shared local preferences do not guarantee that two tabs restore different branch or schema choices.

## Accepted workspace selection

Committed connection entry is the only runtime selection authority. Preferences provide entry defaults and record accepted selection.

Pending, cancelled, or blocked navigation cannot start the destination runtime. Schema commands request navigation before preferences change. History and schema navigation use the same exit admission as other scope changes.

Entry binds its discovery to execution settings through a secret-free credential revision. Changed credentials or execution settings require entry resolution again; they cannot reuse the previous discovery evidence.

Entry and React read the same tab-local profile controller. Local storage restores that controller once; loader rediscovery does not ingest another tab's profile writes.

Connection labels, retention choices, and newly allocated profile snapshots do not replace a runtime. Connection execution settings, credentials, branch label, schema, and explicit retry determine replacement. Credentials never enter route data or identity strings.
