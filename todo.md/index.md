# Implementation guide

Use this index to find durable open work. Ledgers record scope, completion conditions, and evidence limits.

## Contents

Follow the responsibility owners and work method below.

- [Document owners](#document-owners)
- [Open work](#open-work)
- [Work method](#work-method)

## Document owners

[Lat](../lat.md/lat.md) owns current contracts. [Ideas](../lat.md/ideas/ideas.md) owns proposals and deferred options. Ledgers own accepted work, not component history.

## Open work

Each ledger states its own next action. This list does not claim area readiness.

- [Tables](tables.md): scrolling investigation and pane-only acceptance.
- [Shared UI](sharedUi.md): JSON tree navigation and rendered accessibility checks.
- [Runtime](runtime.md): private diagnostics and production measurements.
- [Core](core.md): domain-first Effect rewrite and Studio integration.
- [Workbench structure](reshapeStructure.md): cohesive feature workflows and thinner Studio integration.

## Work method

Work by responsibility, not by component or package.

- **Scope:** the approved consumer outcome, including integration and verification.
- **Step:** a checkable part of that outcome.
- **Done:** the outcome meets its contract with evidence.

Verify source before acting on an item. A missing check is not a confirmed defect. Obtain approval before adding Studio test infrastructure or expanding implementation scope.
