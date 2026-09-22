# Jazz alpha.57 upgrade

## Table of contents

- [Summary](#summary)
- [Nullable JSON blocker](#nullable-json-blocker)
- [Fixture impact](#fixture-impact)
- [Upstream tracking](#upstream-tracking)
- [References](#references)

## Summary

Jazz `2.0.0-alpha.56` still rejects some native writes to optional JSON columns. The blocker is tracked for alpha.57 and prevents complete fixture and Playwright acceptance.

## Nullable JSON blocker

The affected columns use `s.json().optional()`. Native writes can fail with:

```text
Protocol: value does not match type Internal(InternalValueType(StoredScalar(Json)))
```

Required JSON writes succeed. Omitting an optional JSON field succeeds. Explicit `null` inserts and updates that clear an optional JSON value fail.

The failure occurs at the native protocol and storage-value boundary. It is not caused by Inspektor JSON serialization. Converting JSON to strings would change the column type and is not a valid workaround.

## Fixture impact

During the alpha.56 investigation, an isolated fixture variant omitted populated values for these columns:

- `columnTypeShowcase.optionalJsonValue`
- `wideRecords.optionalJson`

Omitting those fields avoided the unsupported native write while preserving the schema and the rest of the deterministic fixture data. Required JSON columns remained populated. Shared-cloud seed data remained unchanged. The workaround was not retained in the repository.

## Upstream tracking

- [Jazz issue #2733: Native optional JSON columns reject explicit null inserts and clearing updates](https://github.com/garden-co/jazz/issues/2733)
- [Jazz PR #3007: Unify nullable JSON null semantics without changing stored encodings](https://github.com/garden-co/jazz/pull/3007)

Issue #2733 describes the nullable JSON native-protocol failure. PR #3007 proposes a storage-compatible fix and is associated with the `2.0.0-alpha.57` milestone. It was not part of the released alpha.56 build used by Inspektor.

## References

- [Inspektor Test fixture](../apps/inspektor-test/README.md)
- [Historical alpha.55 adoption note](./upgrade-0.55.md)
