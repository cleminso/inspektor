# Runtime implementation

Define private application diagnostics and verify production loading without collecting inspected data or credentials.

## Contents

Read the work and evidence limits together.

- [Scope](#scope)
- [Work](#work)
- [Evidence](#evidence)

## Scope

Cover connection startup and built-asset delivery. Keep speculative caching changes in [runtime ideas](../lat.md/ideas/runtimeOptimizations.md).

## Work

Use measurements to separate application work from Jazz startup and transport.

- [ ] [ready] Define the application diagnostics policy before adding error or availability reporting.
  - Complete when: the runtime contract defines allowed fields, redaction, retention, and failure reporting; credentials, inspected rows, and raw Jazz responses are excluded.
  - Evidence: [Worker configuration](../apps/studio/wrangler.jsonc) enables platform logs and sampled traces. This does not define application payload policy.
- [ ] [ready] Capture private production loading and cache evidence.
  - Complete when: record cold and warm asset transfers and connection phases through first rows; verify the deployed WASM response and warm font, JavaScript, CSS, worker, and WASM caching. Keep credentials and inspected values out of artifacts.
  - Compare startup with and without [WASM preparation](../apps/studio/src/app/runtime/jazzWasmPreparation.ts) before changing its policy.
  - Evidence: [runtime startup](../apps/studio/src/app/runtime/useInspectorRuntime.tsx) and [WASM preparation](../apps/studio/src/app/runtime/jazzWasmPreparation.ts) own the exercised boundaries.
- [ ] [deferred] Smoke-test deployed Studio after the Jazz upgrade.
  - Trigger: Studio deployment.
  - Complete when: connection, reads, writes, reconnect, and connection switching pass.
  - Evidence limit: deployed Studio behavior remains unverified.

## Evidence

Cold/warm startup measurements remain unverified.
