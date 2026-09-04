# Live queries interface

## Table of contents

- [Purpose](#purpose)
- [Data source](#data-source)
- [Timeline model](#timeline-model)
- [Interface structure](#interface-structure)
- [Interaction](#interaction)
- [Polling and history](#polling-and-history)
- [States](#states)
- [Required scope](#required-scope)
- [Out of scope](#out-of-scope)

## Purpose

The Live queries view helps an app developer inspect the lifecycle of active, server-visible Jazz subscriptions.

I don't think a data-grid is the right representation for the query interface, since it does not capture the query lifecycle (when groups appear; remain active; or disappear).

I think a swimlane timeline is a better representation, since it shows when groups appear, remain active, or disappear.

The interface therefore uses a swimlane timeline built from Inspektor-owned snapshots.

Retaining a small snapshot history helps with:

- detecting subscription churn
- finding subscriptions that remain unexpectedly active
- seeing group counts grow or shrink
- observing query shapes created by changing filters or pagination
- understanding when a table gained or lost server-visible subscriptions

The telemetry does not expose returned rows, result changes, execution duration, or synchronization latency.

## Data source

Inspektor fetches the current server snapshot with:

`fetchServerSubscriptions(serverUrl, { appId, adminSecret })`

The response contains:

| Field         | Meaning                             |
| ------------- | ----------------------------------- |
| `appId`       | App represented by the snapshot     |
| `generatedAt` | Server-generated snapshot marker    |
| `queries`     | Active grouped server subscriptions |

Each query group contains:

| Field         | Meaning                                                     |
| ------------- | ----------------------------------------------------------- |
| `groupKey`    | Opaque server-defined identity for the grouped subscription |
| `count`       | Number of active subscriptions represented by the group     |
| `table`       | Target table                                                |
| `query`       | Serialized query JSON                                       |
| `branches`    | Branch context                                              |
| `propagation` | `full` or `local-only`                                      |

Equivalent subscriptions are grouped by query, branches, and propagation. `groupKey` identifies that group across retained snapshots. Inspektor must not parse it or treat it as user-authored content.

The endpoint returns a current snapshot, not lifecycle events or historical telemetry.

## Timeline model

- The horizontal axis is a sequence of sampled snapshots.
- The latest successful snapshot stays anchored on the right.
- One lane represents one table.
- Each lane contains one track per observed `groupKey`.
- A green segment means the group was present in that successful snapshot.
- An empty segment means the group was confirmed absent in that successful snapshot.
- Adjacent present segments may join visually, but snapshot boundaries remain visible.
- Bar length means the group remained observable across sampled snapshots. It does not represent query execution duration.

A failed request does not prove that a group was absent. If failed attempts are represented in the timeline, the entire interval uses an unknown-state treatment. The time header remains a time label; it must not be replaced with the word “Unavailable.” The failure message belongs in the status UI or interval tooltip.

## Interface structure

The timeline is one shared grid. Tables are lane header rows inside that grid rather than a separate table column.

The first grid column is the lane label column:

- The timeline header labels it `Tables / queries`.
- A table lane header shows its chevron, table name, and track count.
- A query track shows its truncated `groupKey`.
- Snapshot columns begin after the label column.

The component composition should follow the visible structure:

- Timeline: owns the shared columns, ruler, selection, and horizontal scrolling.
- Table lane: renders a full-width table header row and its query tracks.
- Query track: renders its label cell and snapshot segments.
- Details pane: renders metadata for the selected track and snapshot.

All lane and track rows use the same snapshot column definition so labels, segments, and ruler ticks remain aligned.

## Interaction

- A table chevron expands or collapses its query tracks.
- Clicking the table name may use the same expand or collapse action.
- Collapsing a lane only changes its presentation. Polling and history collection continue for that table.
- Selecting a `groupKey` label or one of its segments opens the details pane.
- The selected segment remains visibly distinct from ordinary active segments.

The details pane initially needs only:

- complete `groupKey`
- table
- count at the selected snapshot
- propagation
- branches
- serialized query

The pane can be refined separately. Query-group metadata should not be repeated inside timeline segments.

## Polling and history

- Poll the endpoint every 20 seconds.
- Provide manual refresh.
- Do not overlap requests.
- Store a bounded, session-local history sufficient to render the timeline.
- Do not persist snapshots across reloads.
- Keep the last successful history visible when a refresh fails and mark it as stale.
- Use `generatedAt` for successful snapshot placement and identity.

Snapshot history belongs to Inspektor. It must not be described as server logs or a real-time event stream.

## States

The interface must distinguish:

- initial loading
- a successful snapshot with no active server-visible subscriptions
- populated history
- refresh in progress
- failed initial load
- failed refresh with stale history retained
- unknown intervals caused by failed polling attempts

An empty successful snapshot does not prove that the app performed no reads. Local-only subscriptions that never reached the server and short-lived reads between polls are not observable through this endpoint.

## Required scope

- Fetch standalone server subscription telemetry.
- Build bounded history from successful snapshots and failed attempts.
- Group tracks into table lanes.
- Keep the latest snapshot on the right.
- Expand and collapse table lanes without changing collection.
- Select a track segment and show its metadata and raw query in the side pane.
- Preserve and clearly label stale history after a refresh failure.

## Out of scope

- returned or changed result rows
- execution duration or query performance
- synchronization progress
- persisted telemetry history
- query or result diffs
- zoom and timeline range controls
- inferring why one group replaced another
- distinguishing one-shot reads from live subscriptions
- tracing subscriptions to source files
- final side-pane information design
