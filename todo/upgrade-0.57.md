# Jazz alpha.57 upgrade

## Table of contents

- [Summary](#summary)
- [Nullable JSON blocker](#nullable-json-blocker)
- [Fixture impact](#fixture-impact)
- [Upgrade validation](#upgrade-validation)
- [Upstream tracking](#upstream-tracking)
- [References](#references)

## Summary

The workspace resolves Jazz `2.0.0-alpha.57`. Studio uses the matching content-addressed production WASM binary and waits at global durability for row mutations. Native writes to optional JSON columns still block complete fixture and fixture-dependent Playwright acceptance.

## Nullable JSON blocker

The affected columns use `s.json().optional()`. The complete alpha.57 fixture suite still fails during seeding with:

```text
Protocol: value does not match type Internal(InternalValueType(StoredScalar(Json)))
```

The direct alpha.57 contract uses a separate in-memory Jazz app, not the Inspektor Test seed helper. Required JSON inserts and omitted optional JSON values round-trip. Populated optional JSON object inserts, explicit SQL-NULL inserts, and updates from an omitted optional JSON value to SQL NULL fail at the native boundary. Clearing an already populated optional JSON value cannot be isolated through this public write path while populated inserts fail; it remains part of the upstream issue and needs verification with a fixed Jazz build.

The failure occurs at the native protocol and storage-value boundary. It is not caused by Inspektor JSON serialization. Converting JSON to strings would change the column type and is not a valid workaround.

## Fixture impact

During the alpha.56 investigation, an isolated fixture variant omitted populated values for these columns:

- `columnTypeShowcase.optionalJsonValue`
- `wideRecords.optionalJson`

Omitting those fields avoided the unsupported native write while preserving the schema and the rest of the deterministic fixture data. Required JSON columns remained populated. Shared-cloud seed data remained unchanged. The workaround was not retained in the repository.

## Upgrade validation

- [x] Publish the alpha.57 WASM binary at its SHA-256-addressed R2 key and confirm the public response matches the installed package bytes, uses `application/wasm`, supports Brotli, and has immutable caching.
- [x] Replace deprecated `edge` write waits with `global` in Studio and the isolated contracts.
- [x] Verify remote subscription contracts against alpha.57; the sorted, limited, offset opening remains an expected failure.
- [x] Add a focused isolated Jazz contract to root tests with required/omitted controls and exact protocol-error assertions for populated and SQL-NULL optional JSON writes.
- [ ] Run the complete fixture successfully and unblock fixture-dependent Playwright acceptance when Jazz supports the optional JSON writes.

## Upstream tracking

- [Jazz issue #2733: Native optional JSON columns reject explicit null inserts and clearing updates](https://github.com/garden-co/jazz/issues/2733)
- [Jazz PR #3007: Unify nullable JSON null semantics without changing stored encodings](https://github.com/garden-co/jazz/pull/3007)

Issue #2733 describes the nullable JSON native-protocol failure and is open under the `2.0 stable` milestone. PR #3007 proposes a storage-compatible fix but is a draft and has not merged. Its former alpha.57 milestone assignment did not make the fix part of the published package. Use a released Jazz build and the direct contract, complete fixture, and Playwright suites to establish resolution rather than relying on milestone status.

## References

- [Inspektor Test fixture](../apps/inspektor-test/README.md)
- [Historical alpha.55 adoption note](./upgrade-0.55.md)
