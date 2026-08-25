# Mutation ledger

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [25/08/26] React component boundary review

- [x] Compute each scoped ledger projection once in its provider.
- [x] Keep imperative workspace reads synchronized with committed React state.
- [x] Report applied update fields immediately, including before a later mutation fails.

### [25/08/26] Persistence reconciliation

- [x] Preserve table-scoped drafts across table-view unmounts.
- [x] Block runtime exit while unresolved mutation state exists.
- [x] Apply updates before deletions as an explicit non-transactional sequence.
- [x] Report applied and failed entry identities after partial persistence.
- [x] Remove acknowledged entries so retries execute only unresolved mutations.
- [x] Reject draft and ledger commands while Apply owns the mutation state.
- [x] Keep execution commands outside the UI-facing ledger command surface.

### [25/08/26] Command surface

- [x] Expose intent commands instead of the domain reducer dispatch function.
- [x] Remove unused per-entry and per-deletion-target commands.
- [x] Remove mutation adapter state without production consumers.

## Open product work

### [25/08/26] Remote changes

- [ ] Define how staged drafts respond when live Jazz values change after the draft source snapshot.

## Work outside the foundation scope

### [25/08/26] Persistence transactions

- Database-level transactions or rollback across several Jazz mutations are not provided by this client ledger.
- Insert operations continue to persist outside the staged update and deletion ledger.

## Settled interaction decisions

### [25/08/26] Apply ownership

- Apply owns the staged mutation state until its persistence sequence completes or fails.
- A failed sequence retains the failed and unattempted entries for retry.
- Successfully acknowledged entries are not presented as staged changes.

## Open design decisions

### [25/08/26] Conflict policy

- [ ] Choose last-write-wins, conflict presentation, or draft rebasing for remote source changes.

## Validation checklist

### [25/08/26] Commands

- [x] Run focused mutation ledger tests.
- [x] Run changed-file lint.
- [x] Run the Inspector typecheck and build.
- [x] Run the Inspector test suite.
