# Binary Value

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks the reusable binary preview and inspection component.

## Implemented foundation

[27/07/26]

- [x] Document compact and inspection presentations with an executable consumer example.
- [x] Register stable navigation and generated-props metadata.
- [x] Split byte-count display from callback-driven copy and download details.
- [x] Remove byte transformation, object URL creation, and download lifecycle from `@inspector/ds`.
- [x] Bound application-owned Hex and Base64 copying to 1 MiB before encoding begins.

## Open product work

[27/07/26]

No open product work is recorded.

## Work outside the foundation scope

[27/07/26]

- [x] Keep binary encoding and download lifecycle in the consuming application.

## Settled interaction decisions

[27/07/26]

- [x] Use `BinaryDetails` when copy and raw download actions are required.

## Open design decisions

[27/07/26]

No open design decisions are recorded.

## Validation checklist

[27/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [ ] Run the complete documentation test command without the unrelated Tab View `closeLabel` extractor assertion failure.
- [ ] Run the `@inspector/ds` declaration build without the workspace TypeScript `baseUrl` deprecation error.
