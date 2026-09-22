# Jazz alpha.55 adoption (historical)

## Table of contents

- [Summary](#summary)
- [Release behavior](#release-behavior)
- [Implemented adoption](#implemented-adoption)
- [Remaining finalization](#remaining-finalization)
- [Validation](#validation)
- [References](#references)

## Summary

This document records the historical alpha.55 adoption. The workspace now resolves Jazz
`2.0.0-alpha.56`; its explicit relationship migration and current validation are recorded in the
current schema, package, and Inspektor Test documentation.

## Release behavior

- Physical supporting-set snapshots and reduced maintained-query work improve Jazz cold loads and writes.
- Subscription startup, browser reconnect, catalogue replacement, ownership-protected deletion, and React Native delivery defects are fixed.
- IndexedDB page reclamation is fixed for subsequent writes, and declared indexes rebuild automatically while preserving rows and pending writes.
- Inspektor has not established a product-level performance improvement.

## Implemented adoption

- [x] Upgrade workspace Jazz packages and the lockfile to alpha.55.
- [x] Verify populated remote, empty remote, and local-first openings against an isolated server.
- [x] Use the remote tier for table and selected-row subscriptions.
- [x] Upload and verify the matching WASM artifact, then update its production URL and digest.
- [x] Recheck the admin-client, subscription-store, query-option, and shutdown APIs used by Inspektor.
- [x] Update current-state Jazz lifecycle documentation.

The nullable JSON blocker and its upstream tracking are recorded in
[the alpha.57 upgrade note](./upgrade-0.57.md).

## Remaining finalization

- [ ] Upgrade to a Jazz build that fixes the nullable JSON blocker recorded in the [alpha.57 upgrade note](./upgrade-0.57.md).
- [x] Run the final repository validation and diff review.

## Validation

- [x] Run the focused alpha.55 subscription contract tests.
- [x] Verify live insert, update, final-row deletion, reconnect, and client replacement behavior with remote subscriptions.
- [x] Verify connection and schema switching, retry, filtering, sorting, pagination, and the `pageSize + 1` probe through existing Inspektor tests.
- [x] Run web and Inspektor Test lint and typechecks.
- [x] Run the complete web unit suite.
- [x] Build the web application.
- [x] Verify the hosted WASM digest, MIME type, immutable caching, and compressed delivery.
- [x] Run the production dependency audit.
- [x] Run `lat check`.

## References

- [Jazz alpha.54 migration](./upgrade-0.54.md)
- [Jazz alpha.57 JSON blocker](./upgrade-0.57.md)
- [Table row query lifecycle](../lat.md/tableRowsQueryLifecycle.md#authority-settled-openings)
- [Jazz live-query and subscription telemetry](../lat.md/query-subscriptions.md)
- [Inspektor Test](../apps/inspektor-test/README.md)
