# Accordion

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [09/09/26] Documentation playground

- [x] Replace the fixed example with one interactive playground and generated consumer source.
- [x] Expose layout, multiple expansion, root disabled, item disabled, and trigger suffix controls.
- [x] Remove wrapper styling reads of Base UI's deprecated orientation state.

### [17/08/26] Heading semantics

- [x] Provide constrained heading levels through `Accordion.Header`.
- [x] Replace product-level heading composition and lint suppressions with the semantic level API.

## Open product work

### [17/08/26] None

- [x] No additional product work belongs to this implementation.

## Work outside the foundation scope

### [09/09/26] Advanced properties

- [x] Keep heading level, render composition, mounted-panel behavior, native attributes, and event handlers out of the visual controls.
- [x] Leave the application shell behavior for fixed playgrounds unchanged.

### [17/08/26] Interaction treatment

- [x] Proximity hover, spring motion, persistent expanded-item surfaces, and density variants are excluded.
- [x] The `multiple` prop and array value model remain aligned with Base UI.

## Settled interaction decisions

### [09/09/26] Playground state

- [x] Let direct trigger interaction control the preview's expanded values.
- [x] Serialize the consumer example with `defaultValue` rather than documentation-only controlled state.
- [x] Reset configuration and expanded values together.

### [17/08/26] Public behavior

- [x] Consumers choose heading hierarchy through levels 2 through 6.
- [x] Advanced heading composition remains available through `render`.

## Open design decisions

### [17/08/26] None

- [x] No unresolved design decisions belong to this implementation.

## Validation checklist

### [09/09/26] Interactive documentation

- [ ] Run the focused Accordion package and playground tests.
- [ ] Run changed-file lint and affected package typechecks.
- [ ] Run the design-system package and documentation builds and suites.
- [ ] Verify controls, Reset, generated source, and content and fill layouts in the browser.
- [ ] Run `lat check`.

### [17/08/26] Package validation

- [x] Run the focused accordion test.
- [x] Run changed-file lint.
- [x] Run design-system package typecheck and build.
- [x] Run design-system documentation tests, metadata checks, typecheck, lint, and build.
- [x] Run the web application typecheck and build.
- [x] Verify semantic heading output in the documentation application.
