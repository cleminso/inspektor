# Jazz alpha.58 update

## Table of contents

- [Summary](#summary)
- [Validated adoption](#validated-adoption)
- [Remaining blockers](#remaining-blockers)
- [References](#references)

## Summary

The workspace resolves Jazz `2.0.0-alpha.58`. Studio loads its matching production WASM from a content-addressed R2 object. Populated optional JSON writes work, but explicit SQL-NULL writes still block the full fixture and fixture-dependent browser acceptance.

## Validated adoption

- [x] [done] Publish the matching WASM object and verify its SHA-256 against the installed `jazz-wasm` binary, `application/wasm` response, Brotli delivery, and immutable caching. Update Studio's production URL and contract test.
- [x] [done] Verify populated optional JSON inserts round-trip and replace the obsolete rejection assertion. Isolate the remaining failure when clearing a populated value to SQL NULL.
- [x] [done] Run the complete isolated fixture and subscription-opening contracts without removing canonical null rows or hiding the sorted-page expected failure.

## Remaining blockers

- [ ] [blocked] Run the complete fixture successfully and unblock fixture-dependent Playwright acceptance.
  - Blocked by: Jazz issue #2733. Explicit SQL-NULL optional JSON inserts and updates from omitted or populated values to null still fail with `Protocol: value does not match type Internal(InternalValueType(StoredScalar(Json)))`. The canonical fixture includes explicit nulls and fails during seeding. Revalidate the fixture and browser suite when a released Jazz build supports these writes.
- [ ] [blocked] Confirm the sorted, limited, offset remote subscription opening returns the authoritative first page.
  - Blocked by: Jazz's incremental remote replay fulfilling the opening before all authoritative rows arrive. The isolated contract remains an expected failure.

## References

- [Jazz alpha.57 upgrade record](./upgrade-0.57.md)
- [Optional JSON contract](../apps/inspektor-test/optionalJson.contract.test.ts)
- [Inspektor Test fixture](../apps/inspektor-test/README.md)
- [Jazz issue #2733](https://github.com/garden-co/jazz/issues/2733)
- [Proposed Jazz fix, PR #3007](https://github.com/garden-co/jazz/pull/3007)
