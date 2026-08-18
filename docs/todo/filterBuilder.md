# Filter Builder

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### Jazz query contract

[18/08/26]

- [x] Derive filter operators and operator types from the public `jazz-tools` API.
- [x] Ignore URL and telemetry clauses that cannot target the selected runtime table.
- [x] Reject malformed URL clauses with unknown operators or missing values.
- [x] Preserve repeated predicates so client-only clause identity does not change query semantics.
- [x] Cover URL parsing and schema-backed query filtering at their application boundaries.

## Open product work

### Visible filter interfaces

[18/08/26]

- [ ] Implement the workspace `DataGridFilterBuilder` interface.
- [ ] Implement the Tables navigator `DataGridFilterControl` interface.
- [ ] Synchronize both interfaces over the URL-backed applied clause model.
- [ ] Connect cell context actions and Query Subscription links through the shared filter actions.

## Work outside the foundation scope

### Advanced query shapes

[18/08/26]

- [ ] Keep grouped predicates, `OR`, nested relations, facets, aggregates, and table-wide counts outside the flat filter model.

## Settled interaction decisions

### Filter state

[18/08/26]

- [x] Applied clauses remain URL-backed and combine as a flat `AND`.
- [x] Draft column, operator, raw value, completion stage, and validation issue remain transient UI state.
- [x] Filter changes reset pagination and clear table selection state.

## Open design decisions

### Value entry

[18/08/26]

- [ ] Decide how structured `in` values are entered without ambiguous comma parsing.
- [ ] Decide whether binary columns are selectable when byte entry is not exposed by the visible UI.

## Validation checklist

### Filter foundation

[18/08/26]

- [x] Run affected table query, prefetch, and routing tests.
- [x] Run changed-file lint.
- [x] Run the Inspector package test pass.
- [x] Run the Inspector package typecheck and build.
