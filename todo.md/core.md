# Core implementation

Rebuild the standalone Jazz admin workbench around headless inspection contracts and native Effect APIs. Keep Jazz as the database authority.

## Contents

Read scope, remaining work, and evidence limits together.

- [Scope](#scope)
- [Work](#work)
- [Evidence](#evidence)

## Scope

Deliver `packages/core` with Studio-owned workflows and Jazz-owned access, then integrate Studio without losing accepted inspection behavior.

Use Alchemy's modeling workflow, not its framework. Follow the [core boundary](../lat.md/architecture/boundaries.md#core-boundary). macOS, embedded inspection, backend inspection, batch Apply, and a second database state system are excluded.

## Work

The headless boundary is integrated. Evidence limits below remain separate from implementation acceptance.

- [x] [done] Complete write ownership and settlement acceptance.
  - Complete when: workspace-owned commands survive same-client view mounts; retired owners exit applying without becoming retryable; insert input cannot be lost during submission; late native verdicts remain visible after interruption and retirement.
  - Evidence: [write coordination](../packages/core/src/studio/write.ts), [regressions](../packages/core/tests/write.ts), workspace settlement, and independent source and assertion reviews. Local browser checks verify disabled input during a pending global write and one insertion after the local server resumes.
- [x] [done] Integrate Studio through public core exports.
  - Complete when: existing connection, schema, query, editing, export, and workspace behavior uses the headless boundary; affected checks, final browser acceptance, and independent review pass.
  - Evidence: Studio now consumes public core subpaths. Connection, metadata, session, query, draft, and write rules live in core. Presentation, routing, and browser storage remain adapters.
  - Validation: focused Node checks, core/Studio lint and compiler checks, core build and emitted-ESM imports, Studio build and Worker dry run, Lat checks, local browser acceptance, and independent implementation and assertion reviews pass.

## Evidence

Core is a private runtime package with focused Node assertion checks. It uses existing public Jazz fixtures without a new test-runner dependency.

Effect is pinned to `4.1.4`; Jazz uses the workspace catalogue's `2.0.0-beta.2`. Local real Jazz checks exercise privileged access, canonical subscriptions, same-handle wait recovery, global writes, rollback, and scoped client cleanup.

Compiler checks cover dependency declarations, core distribution, and the Studio consumer. Local browser checks cover connection entry, filtering, sorting, schema and permission display, row CRUD, and refresh with session retention.

Session and navigation fault-injection checks use named coordination ports; they do not prove Jazz storage guarantees. Real Jazz checks cover root JSON, structured arrays, SQL NULL, defaults, and sparse updates. Row-column and nested-JSON persistence remain unverified.

A missing-column fixture proves real canonical setup rejection, not native transport terminal delivery. The retirement banner has source and core-regression coverage, not a forced browser scenario. External providers, disk/restart persistence, and hosted WASM delivery remain unverified.
