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

[28/08/26]

- [x] Normalize timestamp dates, numbers, and accepted text through one Date-range rule before mutation, filtering, equality, field, or grid projection.
- [x] Preserve caller-specific trust boundaries: runtime cells accept Date or number while text forms may parse date text.
- [x] Reject out-of-range and empty nested timestamps, canonicalize fractional milliseconds, and keep malformed values unequal during rebasing.

[21/08/26]

- [x] Reuse `TimestampValue` for valid row-editor timestamp triggers so table cells and form fields share one browser-local visible representation and exact ISO semantics.
- [x] Keep Jazz mutation values normalized to epoch milliseconds while preserving timestamp milliseconds through calendar edits.
- [x] Fall back to raw text editing for malformed timestamp values.

[05/08/26]

- [x] Render compact timestamp values in monospace typography while preserving tabular numerals and semantic time markup.

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

[21/08/26]

- [x] Treat Jazz `Timestamp` as the product contract because Jazz does not expose PostgreSQL `timestamp` and `timestamptz` as distinct schema types.
- [x] Share visible timestamp formatting across read-only cells and editable field triggers without coupling presentation to mutation serialization.

[27/07/26]

- [x] Use `TimestampValue` only for compact read-only table presentation.

## Open design decisions

[27/07/26]

No open design decisions are recorded.

## Validation checklist

[28/08/26]

- [x] Cover shared Date-range normalization across mutation, nested mutation, dirty equality, filters, field parsing, and compact grid presentation.
- [x] Verify Inspector formatting, lint, typecheck, production build, package-wide tests, and the isolated browser suite.

[21/08/26]

- [x] Verify focused timestamp presentation and row-editor tests, changed-file lint, application typecheck and build, and all application test assertions.
- [ ] Verify the shared timestamp representation in a browser session connected to a dataset containing a Jazz `Timestamp` column.

[05/08/26]

- [x] Verify focused component tests, package typecheck, changed-file lint, and package and documentation builds.

[28/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [x] Run the complete documentation test command after resolving the Tab View `closeLabel` and Relation Value `target` extractor assertions.
- [x] Run the `@inspector/ds` declaration build.
- [x] Re-run focused component, application, typecheck, build, changed-file lint, and browser validation after the visual polish.
- [x] Validate timestamp text editing and mutation parsing without the native picker.
