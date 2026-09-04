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

[05/08/26]

- [x] Keep byte-count values compact by joining the number and unit without a space in grid and inspection presentations.

[05/08/26]

- [x] Render compact byte-count values in monospace typography while keeping inspection controls proportional.

[28/07/26]

- [x] Document compact and inspection presentations with an executable consumer example.
- [x] Register stable navigation and generated-props metadata.
- [x] Split byte-count display from callback-driven copy and download details.
- [x] Remove byte transformation, object URL creation, and download lifecycle from `@inspektor/ds`.
- [x] Bound application-owned Hex and Base64 copying to 1 MiB before encoding begins.

- [x] Integrate the copy menu trigger with `InputGroup` styling instead of nesting a standalone menu button treatment.
- [x] Show success and error toasts while preserving polite assistive feedback.
- [x] Reuse `BinaryDetails` for existing read-only binary values in the row editor.

## Open product work

[27/07/26]

No open product work is recorded.

## Work outside the foundation scope

[27/07/26]

- [x] Keep binary encoding and download lifecycle in the consuming application.

## Settled interaction decisions

[05/08/26]

- [x] Format binary sizes as compact values such as `27B` and `3.5KB`.

[27/07/26]

- [x] Use `BinaryDetails` when copy and raw download actions are required.

## Open design decisions

[27/07/26]

No open design decisions are recorded.

## Validation checklist

[05/08/26]

- [x] Verify compact unit formatting and monospace inspection values through focused tests, typechecks, builds, and browser rendering.

[05/08/26]

- [x] Verify focused component tests, package typecheck, changed-file lint, and package and documentation builds.

[28/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [ ] Run the complete documentation test command without the unrelated Tab View `closeLabel` extractor assertion failure.
- [ ] Run the `@inspektor/ds` declaration build without the workspace TypeScript `baseUrl` deprecation error.
- [x] Re-run focused component, application, typecheck, build, changed-file lint, and browser validation after the visual polish.
- [x] Validate binary copy formats in both inspection and row-editing surfaces.
