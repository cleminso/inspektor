# Relation Value

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks the reusable relation preview and detail component.

## Implemented foundation

[28/07/26]

- [x] Document compact and detail relation presentations with an executable consumer example.
- [x] Generate separate package-authoritative prop sections for the public compact and detail interfaces.
- [x] Register stable navigation and generated-props metadata.
- [x] Split compact identifiers from target and resolution details into `RelationValue` and `RelationDetails`.
- [x] Use ordinary stable metadata IDs for both exported components.
- [x] Reuse `CopyButton` feedback so relation ID copy success and failure are announced.

- [x] Match compact relation typography to other data-grid values.
- [x] Present the stored ID and target navigation as one `InputGroup`.
- [x] Keep full-row relation navigation inside the editable value group and remove the detached Show action.
- [x] Remove the detail card treatment, visible target metadata, and resolution status.
- [x] Keep navigation attached to the stored ID and place the copy action beside the resolved display value.

## Open product work

[27/07/26]

No open product work is recorded.

## Work outside the foundation scope

[27/07/26]

- [x] Keep application-router composition out of the example.

## Settled interaction decisions

[27/07/26]

- [x] Demonstrate the constrained navigation API through `href` rather than `render`.
- [x] Keep resolution state and detail actions out of the compact relation API.

## Open design decisions

[28/07/26]

- [ ] Decide whether `Open target` should expose the target collection as supplementary tooltip text.

## Validation checklist

[28/07/26]

- [x] Verify prop generation is idempotent and `check:props` passes.
- [x] Run focused component tests, package typecheck, and changed-file lint.
- [x] Run documentation typecheck, lint, and build.
- [ ] Run the complete documentation test command without the unrelated Tab View `closeLabel` extractor assertion failure.
- [ ] Run the `@inspector/ds` declaration build without the workspace TypeScript `baseUrl` deprecation error.
- [x] Re-run focused component, application, typecheck, build, changed-file lint, and browser validation after the visual polish.
- [x] Validate the simplified relation detail presentation.
