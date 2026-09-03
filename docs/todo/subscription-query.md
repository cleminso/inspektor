# Live queries

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[03/09/26]

- [x] Rename the product workspace from Queries to Live queries while preserving subscription terminology for server telemetry.

[03/09/26]

- [x] Summarize resolved schema versions with one reported hash and a compact additional-version control instead of a redundant resolved-source count.
- [x] Prioritize the Inspector-selected schema only when the query reports it, and deduplicate reported versions without changing their order.
- [x] Expose hidden schema hashes in a tooltip available from pointer hover and keyboard focus.

[03/09/26]

- [x] Preserve the visible filter option catalogue while query history is intentionally empty.
- [x] Explain cleared Live, paused, and refreshing states without restoring the initial loading surface.

[03/09/26]

- [x] Clear successful and failed query history without resetting filters or Live state.
- [x] Close selected query details when history is cleared and disable the action when history is empty.
- [x] Keep intentionally cleared history distinct from initial loading while preserving subsequent polling.

[03/09/26]

- [x] Keep the primary Live label legible while its pressed state communicates active polling.

[02/09/26]

- [x] Give active Live mode a primary treatment and paused mode a neutral ghost treatment.
- [x] Explain the Live toggle action with pause and resume tooltips.

[02/09/26]

- [x] Add a view-local Live toggle for pausing and resuming automatic query-subscription polling.
- [x] Keep manual refresh available while paused and prevent resumed polling from overlapping an active request.
- [x] Keep routine refreshes silent while preserving visible retained-history failures.

[02/09/26]

- [x] Add Table, Branch, and Propagation filters to the Queries left dock with the shared accordion and checkbox-group components.
- [x] Derive table and branch options from complete retained telemetry and keep unrestricted sections selected as options change.
- [x] Filter telemetry groups by table, intersecting branch, and propagation before timeline projection.
- [x] Preserve complete server snapshots and capture columns while showing a distinct empty filtered result.

[02/09/26]

- [x] Present schema-qualified query branches as one resolved source scope with environment, user branch, and schema versions.
- [x] Treat an empty resolved source list as unreported instead of claiming it covers every branch.

[02/09/26]

- [x] Keep the selected snapshot visible when the workspace-local details pane opens.
- [x] Give the selected snapshot a visible treatment distinct from active unselected snapshots.
- [x] Keep the details close action in the pane footer and support Escape with focus restoration.
- [x] Keep connection synchronization and query loading states visible instead of rendering blank content.

[02/09/26]

- [x] Align the query details header and timeline toolbar to one shared control height.

[02/09/26]

- [x] Retain the latest successful capture when repeated failures exceed the 60-capture history bound.
- [x] Recover after a successful retry without adding a second timeline column for the latest server marker.
- [x] Classify malformed JSON transport failures as invalid responses.
- [x] Reset query telemetry and selection through the keyed view when connection credentials change.
- [x] Clear selection when its capture is pruned and move focus to the persistent refresh action.
- [x] Move focus to the persistent refresh action when details close after their lane is collapsed.

[02/09/26]

- [x] Match the details header's query-group truncation to the timeline track label.
- [x] Explain that each lane suffix counts unique query groups observed for that table.

[02/09/26]

- [x] Keep Query JSON scrolling inside the Query accordion section without shifting the complete details pane.
- [x] Separate high-value table and subscription metadata from supporting observation context.
- [x] Expose JSON expansion and copy actions inside the scrolling Query section.

[02/09/26]

- [x] Keep query details inside the Queries workspace instead of mounting them as an application-shell dock.
- [x] Keep the bottom-controlled left dock unchanged when query details open or close.
- [x] Give the resizable query details pane a 240px minimum width.

[01/09/26]

- [x] Add a persistent toolbar above the query timeline with a manual refresh action.
- [x] Keep refreshing and retained-history feedback inside the toolbar so polling state changes do not shift the timeline.
- [x] Separate the toolbar from the timeline with one bottom border.

[01/09/26]

- [x] Project validated telemetry into fresh allowed-field records so retained history cannot preserve extra response fields or later source mutations.
- [x] Bound retained query-subscription history to 60 captures.
- [x] Keep confirmed empty snapshots distinct from refreshing and stale empty history.
- [x] Give timeline cells human-readable capture labels, support pressed-state toggling, and restore focus when details close.

[01/09/26]

- [x] Read active connection credentials from the Inspector session and collect server subscription telemetry without the Jazz runtime client.
- [x] Render retained captures through `SwimlaneTimeline` with tables as lanes, group keys as tracks, and present, absent, and unknown cells.
- [x] Keep lane expansion inside the presentational timeline component.
- [x] Store selection as capture ID plus group key and derive details from retained history.
- [x] Show selected observation metadata and parsed query JSON in a workspace-local details pane with existing design-system components.
- [x] Cover loading, successful emptiness, initial failure, refreshing, and retained stale-history states.

[31/08/26]

- [x] Let each dock icon open, close, or switch the shared left dock from one state source.
- [x] Show the shared close shortcut on the active icon and each inactive icon's open shortcut.

[31/08/26]

- [x] Route the bottom-dock RSS control to the connection-scoped Queries route.
- [x] Reuse the shared side-panel content surface for the empty Queries workspace.
- [x] Keep the workspace dock icons and empty left panel mounted across Tables and Queries.
- [x] Keep one connection-owned side-panel layout provider mounted while switching workspaces.

## Open product work

No open product work is recorded for the implemented foundation.

## Work outside the foundation scope

[01/09/26]

- Strict rejection of malformed raw `generatedAt` and `queries` values requires a change to `fetchServerSubscriptions`, which currently coerces them before returning to Inspector.

[01/09/26]

- Overlay `Db` trace collection and `JazzInspectorHost` integration remain outside the standalone web application scope.
- Query result rows, result counts, row deltas, synchronization progress, settlement, query latency, and source-code attribution are unavailable from the introspection response.
- Query and result diffs, replacement inference, persisted history, interval controls, zoom, timeline virtualization, and general query-to-Table-Explorer translation remain separate work.

[31/08/26]

- Query editors, query results, result loading states, and result error states remain separate product work.

## Settled interaction decisions

[03/09/26]

- Schema-qualified query details use the schema-version pill and `+N` control as the version summary instead of repeating a resolved-source count.

[03/09/26]

- Query details never inject the Inspector-selected schema into telemetry that did not report it.
- One reported schema renders without an additional-version control; multiple schemas keep hidden hashes discoverable through the `+N` control.

[03/09/26]

- Intentionally cleared history keeps the last-known filter catalogue visible until a completed capture replaces it.
- Cleared-state feedback uses the persistent empty surface rather than animation or a transient notification.

[03/09/26]

- Clear history removes temporary captures immediately without confirmation.
- Clearing history preserves filters and Live state; polling adds the next completed capture only while active.

[02/09/26]

- Live uses the selected-control accent rather than success green because it controls a polling mode instead of reporting a successful outcome.
- The Live tooltip describes the action clicking will perform without adding a separate paused-status message.

[02/09/26]

- Live is pressed while automatic polling is active and unpressed while polling is paused.
- Pausing lets an active request settle without scheduling another; resuming requests a fresh snapshot before polling continues.
- Manual refresh remains independent from Live state and does not resume automatic polling.

[02/09/26]

- Query filters remain route-local presentation state and never change `fetchServerSubscriptions` requests or retained telemetry.
- A section with every available option checked is unrestricted; “Only” creates a restriction and “Check all” removes it.
- New telemetry options are checked automatically while a section is unrestricted and remain unchecked while an explicit restriction persists across temporarily unavailable options.

[02/09/26]

- Schema-qualified telemetry branches are compatibility sources for one effective query view, not independent application branches.
- Query details label these values as resolved sources and collapse a shared environment and user branch into one scope.

[02/09/26]

- Query details keep the resizable split-pane model; opening the pane scrolls the selected snapshot into the nearest visible position instead of converting details to an overlay.
- Escape and the footer close action both restore focus to the selected snapshot, or to Refresh when that snapshot is unavailable.

[02/09/26]

- Retain at most 60 captures while reserving room for the latest successful capture and subsequent failed attempt.

[02/09/26]

- Observation remains content-sized while Query owns the remaining details-pane height and vertical scrolling.
- Table and subscription count form the observation summary; snapshot, propagation, and resolved source scope remain supporting metadata.

[02/09/26]

- Query selection controls a workspace-local details pane and does not control either application-shell dock.
- Dragging the query details separator stops at 240px; closing remains an explicit cell or close-button action.

[01/09/26]

- The Queries feature observes standalone server telemetry through `fetchServerSubscriptions`; it does not inspect its own Jazz client or subscription store.
- One successful response is a sampled snapshot, not a query result, sync result, lifecycle event, or server history entry.
- Inspector retains bounded session-local history and does not persist serialized queries across reloads.
- One table owns one lane, one observed `groupKey` owns one track, and each capture projects to present, absent, or unknown.
- A present segment means the group was observed in that snapshot; segment length does not measure query execution duration.
- The latest successful snapshot remains available after refresh failure while the failed capture remains an explicit unknown interval.
- Query diffs and result diffs are excluded from the foundation.

[31/08/26]

- At most one left-dock icon is active; both are inactive while the dock is closed.
- `Mod+B` toggles the left dock, `Alt+T` opens Tables, and `Alt+Q` opens Queries.

[31/08/26]

- The RSS dock control opens the Queries route for the active connection.
- The Tables and Queries dock controls remain visible and show the active workspace with the established blue icon treatment.

## Open design decisions

[01/09/26]

- [ ] Decide whether Queries history should remain route-owned or move to a connection-owned lifetime only if developers need collection to continue while another workspace is active.

## Validation checklist

[03/09/26]

- [x] Focused Queries view coverage verifies selected-schema prioritization, absent selected schemas, deduplication, one and multiple versions, and tooltip access from hover and keyboard focus.
- [x] Inspector formatting, lint, typecheck, and affected tests pass.

[03/09/26]

- [x] Focused hook and view coverage verifies retained filter controls and cleared-state feedback.
- [x] Inspector formatting, lint, typecheck, build, package tests, and browser acceptance pass.

[03/09/26]

- [x] Focused hook and view coverage verifies clear-history state, selection, filters, Live state, and polling behavior.
- [x] Inspector formatting, lint, typecheck, build, package tests, and browser acceptance pass.

[03/09/26]

- [x] Focused Button and Queries view coverage verifies primary Live contrast and toggle behavior.
- [x] Design-system and Inspector formatting, lint, typecheck, build, and package tests pass.

[02/09/26]

- [x] Focused view coverage verifies active and paused Live treatments and dynamic action guidance.
- [x] Inspector formatting, lint, typecheck, build, and package tests pass.

[02/09/26]

- [x] Focused hook coverage verifies active and paused states, in-flight pausing, paused manual refresh, resumed snapshots, and overlap prevention.
- [x] Focused view coverage verifies Live toggle semantics, Refresh availability, retained-history failures, and silent routine refreshes.
- [x] Inspector formatting, lint, typecheck, build, and package tests pass.

[02/09/26]

- [x] Focused model coverage verifies unique option derivation and combined table, branch, and propagation filtering.
- [x] Focused view coverage verifies “Only,” “Check all,” changing telemetry options, and empty filtered results.
- [x] Verify QueryFilter in the isolated browser fixture.
- [x] Run Inspector formatting, lint, typecheck, build, and package tests.

[02/09/26]

- [x] Focused view coverage verifies schema-source decomposition and the unreported empty state.
- [x] Browser acceptance verifies the resolved-source summary with multiple schema versions.
- [x] Inspector formatting, lint, typecheck, build, and package tests pass.

[02/09/26]

- [x] Focused view coverage verifies selected-snapshot visibility, close actions, and focus restoration.
- [x] Focused runtime coverage verifies visible connection synchronization feedback.
- [x] Browser acceptance verifies selected treatment, details-pane horizontal context, and footer close behavior.
- [x] Inspector and design-system formatting, lint, typecheck, build, and affected package tests pass.

[02/09/26]

- [x] Focused view coverage verifies the truncated query-group label.
- [x] Browser acceptance verifies matching toolbar and details-header heights.

[02/09/26]

- [x] Focused model coverage verifies retained-success pruning, same-marker recovery, and malformed JSON classification.
- [x] Focused hook coverage verifies the 60-capture bound, discriminated states, and recovery after failure.
- [x] Focused view coverage verifies keyed replacement when connection credentials change.
- [x] Focused view coverage verifies selection invalidation and focus restoration after pruning.
- [x] Browser acceptance verifies focus recovery when details close after their lane is collapsed.

[02/09/26]

- [x] Focused Queries view coverage verifies Query section scroll ownership.
- [x] Browser acceptance verifies the left dock remains visible, Query owns the only details scroll area, and JSON expansion toggles.
- [x] Inspector package tests, lint, typecheck, build, and browser acceptance pass.

[02/09/26]

- [x] Focused Queries view coverage confirms details stay outside the shell right dock and enforce a 240px minimum width.
- [x] Inspector lint, typecheck, build, package tests, and browser acceptance suite pass.

[01/09/26]

- [x] Run focused model, hook, and view tests for the hardened implementation.
- [x] Run application formatting, lint, typecheck, build, and the complete web test suite.
- [x] Run the isolated browser acceptance suite.

[01/09/26]

- [x] Run focused view integration tests for loading, empty, failure, refreshing, retained history, timeline mapping, and details selection.
- [x] Run focused hook tests for polling, refresh, connection replacement, stale completion, and cleanup.
- [x] Run focused model tests for validation, reduction, parsing, and timeline projection.
- [x] Run changed-file lint and application typecheck.

[01/09/26]

- [ ] Verify the feature against a configured deployed server without exposing credentials in output or artifacts.

[31/08/26]

- [x] Verify open, close, and switch behavior against the isolated browser fixture.
- [x] Verify active and inactive tooltip labels and shortcut hints with focused dock tests.

[31/08/26]

- [x] Verify the resize handle remains visible across Tables and Queries in the isolated browser fixture.

[31/08/26]

- [x] Verify RSS dock navigation with the focused dock test.
- [x] Verify formatting, lint, typecheck, build, and package tests for the Inspector application.
