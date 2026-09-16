# Jazz alpha.55 adoption

## Table of contents

- [Summary](#summary)
- [Release behavior](#release-behavior)
- [Implemented adoption](#implemented-adoption)
- [Known blocker](#known-blocker)
- [Remaining finalization](#remaining-finalization)
- [Validation](#validation)
- [References](#references)

## Summary

The workspace resolves Jazz `2.0.0-alpha.55`. Table subscriptions use remote authority settlement,
and production WASM loading references the matching content-addressed artifact. The complete fixture
and browser gates remain blocked by native top-level JSON writes.

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

## Known blocker

Jazz alpha.55 rejects native writes to top-level `s.json()` fixture columns. Keep the fixture and its
coverage intact rather than removing JSON fields or skipping assertions.

This blocks:

- the complete `inspektor-test` suite
- Playwright acceptance, whose setup seeds the same fixture

The blocker is resolved when a compatible Jazz build accepts the existing deterministic JSON writes.

## Remaining finalization

- [ ] Upgrade to a Jazz build that fixes native top-level `s.json()` writes.
- [ ] Run the complete Inspektor Test suite and Playwright acceptance after that fix.
- [x] Run the final repository validation and diff review, recording the upstream JSON blocker.

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
- [ ] Run the complete Inspektor Test suite after the JSON blocker is resolved.
- [ ] Run Playwright acceptance after the JSON blocker is resolved.

## References

- [Jazz alpha.54 migration](./upgrade-0.54.md)
- [Table row query lifecycle](../lat.md/tableRowsQueryLifecycle.md#authority-settled-openings)
- [Jazz live-query and subscription telemetry](../lat.md/query-subscriptions.md)
- [Inspektor Test](../apps/inspektor-test/README.md)
