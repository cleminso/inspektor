# Mutation ledger

This ledger preserves mutation infrastructure history. The approved pane-only workflow and all refactor implementation and validation work are owned by [Row Editor](rowEditor.md).

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[24/11/26]

The older blocks below record the former batch workflow. Useful internal storage and lifecycle infrastructure can remain, but
these records do not establish acceptance of the approved current-row Save contract.

### [05/09/26] Mutation command ownership

- [x] Rename the direct Jazz command hook to `useTableMutationExecutor` so it cannot be confused with the staged mutation ledger.

### [27/08/26] Browser persistence coverage

- [x] Verify discarding a staged row edit restores the Jazz value and does not persist the draft.
- [x] Verify a staged Boolean edit persists through the real Jazz fixture and browser reload.

### [25/08/26] Integration review

- [x] Keep the active route unchanged while confirming closure of an inactive table's final view.
- [x] Remove duplicated tab-close state updates.
- [x] Remove callback memoization that was invalidated by the complete table-view state object.

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

[24/11/26]

- [x] [superseded] Replace user-facing batch mutation work with [Row Editor open work](rowEditor.md#open-product-work).
- The older remote-change question remains separate from this refactor; no new conflict policy is approved.

### [25/08/26] Remote changes

- [ ] Define how staged drafts respond when live Jazz values change after the draft source snapshot.

## Work outside the foundation scope

[24/11/26]

No Effect rewrite, Jazz upgrade, transaction builder, or user-facing batch workflow. Duplicate uses the direct Insert pane.
Internal ledger retention is limited to draft storage and lifecycle protection, not staged insertions or deletions.

### [25/08/26] Persistence transactions

- Database-level transactions or rollback across several Jazz mutations are not provided by this client ledger.
- Insert operations continue to persist outside the staged update and deletion ledger.

## Settled interaction decisions

[24/11/26]

Current-row Save replaces Apply. Cancel resets the current row and keeps the pane open. Confirmed Delete writes directly, and
Duplicate opens a prefilled insert pane. These decisions supersede the old user-facing Apply and pending-widget rules below.
See [Row Editor decisions](rowEditor.md#settled-interaction-decisions).

### [05/09/26] Pending mutation copy

- [x] Describe unapplied edits as pending changes, updates, and deletions.
- [x] Reserve Apply for persistence and Discard for removing pending edits.

### [25/08/26] Apply ownership

- Apply owns the staged mutation state until its persistence sequence completes or fails.
- A failed sequence retains the failed and unattempted entries for retry.
- Successfully acknowledged entries are not presented as staged changes.

## Open design decisions

[24/11/26]

The remote-conflict question below remains outside the approved refactor. It does not block removal of the batch UI.

### [25/08/26] Conflict policy

- [ ] Choose last-write-wins, conflict presentation, or draft rebasing for remote source changes.

## Validation checklist

[24/11/26]

Older checks below are historical evidence for the previous workflow, not acceptance of its replacement.
[Row Editor validation](rowEditor.md#validation-checklist) owns all refactor checks, including retained lifecycle protection.

### [25/08/26] Integration review commands

- [x] Run focused mutation-ledger and integration tests.
- [x] Run the Inspektor lint and typecheck.
- [x] Build the Inspektor application.
- [x] Run the Inspektor test suite.

### [25/08/26] Commands

- [x] Run focused mutation ledger tests.
- [x] Run changed-file lint.
- [x] Run the Inspektor typecheck and build.
- [x] Run the Inspektor test suite.
