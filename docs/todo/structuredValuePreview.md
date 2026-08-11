# Structured Value Preview

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks the reusable compact structured-value preview component.

## Implemented foundation

[11/08/26]

- [x] Mark structured technical previews as non-translatable content.

[05/08/26]

- [x] Split structural counts from bounded payload text and place counts in a fixed leading rail.
- [x] Preserve one accessible preview label while rendering marker and payload as separate visual elements.

[05/08/26]

- [x] Render compact structured-value markers and previews in monospace typography.

[27/07/26]

- [x] Document typed and untyped bounded summaries with an executable consumer example.
- [x] Register stable navigation and generated-props metadata.
- [x] Replace raw object input with exported normalized array, object, and scalar preview models.
- [x] Require explicit continuation state and expose a meaningful typed JSON marker label.

## Open product work

[27/07/26]

No open product work is recorded.

## Work outside the foundation scope

[27/07/26]

- [x] Keep expanded structured inspection in the JSON View documentation.

## Settled interaction decisions

[27/07/26]

- [x] Use `variant="typedJson"` only for values backed by a schema-defined JSON type.

## Open design decisions

[27/07/26]

No open design decisions are recorded.

## Validation checklist

[05/08/26]

- [x] Verify marker and payload separation, accessible labels, shared rail width, focused tests, typechecks, lint, builds, and browser rendering.

[05/08/26]

- [x] Verify focused component tests, package typecheck, changed-file lint, package and documentation builds, and computed mono typography in the browser.

[27/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [ ] Run the complete documentation test command without the unrelated Tab View `closeLabel` extractor assertion failure.
- [ ] Run the `@inspector/ds` declaration build without the workspace TypeScript `baseUrl` deprecation error.
