# Timestamp Value

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks the reusable compact timestamp value component.

## Implemented foundation

[28/07/26]

- [x] Document the compact timestamp representation with an executable consumer example.
- [x] Register stable navigation and generated-props metadata.
- [x] Render browser-local date and time text while preserving the exact ISO instant in semantic markup.
- [x] Render invalid number or Date inputs without throwing.
- [x] Remove `TimestampDetails` after the inspection-only cell pane is removed.
- [x] Use browser-local date-time inputs for valid row mutation values and preserve malformed values as raw text.
- [x] Replace the browser-native `datetime-local` picker with an editable timestamp text field.

## Open product work

[27/07/26]

No open product work is recorded.

## Work outside the foundation scope

[27/07/26]

- [x] Keep alternate timestamp representations in the application-owned complete-row editing surface rather than the compact value component.

## Settled interaction decisions

[27/07/26]

- [x] Use `TimestampValue` only for compact read-only table presentation.

## Open design decisions

[27/07/26]

No open design decisions are recorded.

## Validation checklist

[28/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [x] Run the complete documentation test command after resolving the Tab View `closeLabel` and Relation Value `target` extractor assertions.
- [x] Run the `@inspector/ds` declaration build.
- [x] Re-run focused component, application, typecheck, build, changed-file lint, and browser validation after the visual polish.
- [x] Validate timestamp text editing and mutation parsing without the native picker.
