# Live queries interface

The standalone Live queries feature is removed. Tables retain live data subscriptions, and the design system retains the reusable `SwimlaneTimeline` components.

## Table of contents

This page records the current product boundary and the reason for removal.

- [Current state](#current-state)
- [Server capability](#server-capability)
- [Retained timeline guidance](#retained-timeline-guidance)
- [Scope](#scope)

## Current state

Tables is the remaining resource navigator. Live queries has no navigation item, `Alt+Q` shortcut, telemetry polling, snapshot history, filters, or query-details pane.

The legacy `/conn/$connectionId/live-queries` route only redirects to Tables in `beforeLoad`. It preserves `connectionId` and schema search state and replaces the history entry. It does not mount a feature view.

This decision supersedes the Live queries proposals in [[design-document#Inspektor design document#User interface#Live queries telemetry]]. Those proposals remain historical context, not the current product contract.

## Server capability

Jazz beta.1 returns an empty telemetry response rather than active subscription groups.

At release commit `c73bed9a4e868071f10de490ae3f753f3081772f`, `crates/jazz-server/src/server/routes/http.rs:211-239` always sets `queries: Vec::new()`. The test at `crates/jazz-server/src/server/routes/mod.rs:1285-1319` requires an empty response until core telemetry exists.

An earlier deployed server returned populated groups. That observation does not establish a beta.1 capability. Keeping a standalone timeline would imply subscription visibility that this release does not provide. Query API research and the historical transport shape remain in [[query-subscriptions#Jazz live-query and subscription telemetry]].

## Retained timeline guidance

`SwimlaneTimeline` remains a reusable presentation component with its documentation, examples, and tests. Its retention does not require an active Live queries consumer.

Shared snapshot columns keep the ruler, lane headers, track labels, and segments aligned. Lane expansion changes presentation only. Selection remains distinct from an unselected segment.

For sampled data, distinguish observed presence, confirmed absence, and unknown capture failure. Segment length must not imply query execution duration or synchronization latency.

Component work remains owned by [Swimlane timeline implementation checklist](../todo/swimlaneTimeline.md), not the retired feature ledger.

## Scope

Removal affects only standalone Live queries product behavior and its application integration.

Table row subscriptions remain governed by [[tableRowsQueryLifecycle]]. The removal does not change Jazz versions, introduce an Effect rewrite, or remove design-system components or documentation-app examples.

The [Live queries ledger](../todo/subscription-query.md) preserves implementation history and marks earlier unfinished feature work as superseded.
