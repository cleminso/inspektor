# Accordion

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [17/08/26] Heading semantics

- [x] Provide constrained heading levels through `Accordion.Header`.
- [x] Replace product-level heading composition and lint suppressions with the semantic level API.

## Open product work

### [17/08/26] None

- [x] No additional product work belongs to this implementation.

## Work outside the foundation scope

### [17/08/26] Interaction treatment

- [x] Proximity hover, spring motion, persistent expanded-item surfaces, and density variants are excluded.
- [x] The `multiple` prop and array value model remain aligned with Base UI.

## Settled interaction decisions

### [17/08/26] Public behavior

- [x] Consumers choose heading hierarchy through levels 2 through 6.
- [x] Advanced heading composition remains available through `render`.

## Open design decisions

### [17/08/26] None

- [x] No unresolved design decisions belong to this implementation.

## Validation checklist

### [17/08/26] Package validation

- [x] Run the focused accordion test.
- [x] Run changed-file lint.
- [x] Run design-system package typecheck and build.
- [x] Run design-system documentation tests, metadata checks, typecheck, lint, and build.
- [x] Run the web application typecheck and build.
- [x] Verify semantic heading output in the documentation application.
