# Row Editor

This ledger owns the approved side-pane-only refactor and its acceptance checks. Older dated blocks remain history, not proof of current runtime acceptance.

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[24/11/26]

- [x] [done] Record the approved pane-only contract in the [Table Explorer behavior specification](../lat.md/tableExplorerBehaviors.md) and [Jazz policy note](../lat.md/jazzAlignmentAndInspectorPolicies.md).
- [x] [done] Replace floating editors and pending-change review with current-row pane Save / Cancel, direct confirmed Delete, and Duplicate-to-Insert.
- [x] [done] Preserve raw failed-write drafts, refreshed row values, and guarded row/query transitions.
- [x] [done] Reset deletion confirmation on row changes and reveal requested fields through expanded-editor and loading boundaries.
- [x] [done] Use Save → remote row refresh instead of an accepted-value cache. The pane uses the returned semantic row; the grid stays subscription-owned.
- [x] [done] Focus synthetic metadata in the existing read-only Provenance view.
- Acceptance remains limited by the validation blockers below.

[21/09/26]

- [x] Move focus into the value control when a nullable field leaves NULL mode.
- [x] Validate a field after focus leaves its complete interaction context.
- [x] Present active Details validation below its field instead of in the mutation widget.
- [x] Retain global invalid-draft feedback when no complete-row editor owns the feedback.

## Open product work

[24/11/26]

This block supersedes the floating-editor, pending-widget, batch Apply, staged-delete, and staged-duplicate work in
[Inline editing](inlineEditing.md) and [Mutation ledger](mutationLedger.md). This is the canonical implementation checklist.

- The approved implementation is in place. Full acceptance is not established; remaining checks are owned below.

[21/09/26]

- None.

## Work outside the foundation scope

[24/11/26]

- No Effect rewrite, Jazz upgrade, batch workflow, transaction builder, or new conflict policy.
- Existing direct `Insert`, `Discard`, and `Insert more` behavior remains unchanged, except that Duplicate prefills the insert pane.
- Parsing, NULL, omission, unsupported-field, and sparse-write semantics remain unchanged.
- This block supersedes the older exclusions where they assume floating field-editor submission.

[21/09/26]

- Parsing rules and mutation-ledger validity remain unchanged.
- Field-editor widget submission behavior remains unchanged.

## Settled interaction decisions

[24/11/26]

- The side pane is the only write surface. Multiple checked rows do not imply batch editing, Save, or Delete.
- Cancel discards only current-row edits and retains the pane; successful Save also retains the pane.
- Footer order is `Delete row` then `Close` when clean, and `Save` then `Cancel` when dirty.
- Dirty Close, Escape, or target changes require consent before discard. A canceled transition retains raw edits and its current target.
- Delete confirmation persists directly. Duplicate is an editable prefilled insert draft, not a queued insertion.
- Internal ledger reuse is allowed for draft storage and lifecycle protection, not user-facing staging or Apply.
- Save refreshes the row after persistence; a refresh failure is not a failed write and cannot resubmit the cleared draft. Duplicate reads its source before opening Insert.
- Details keeps contextual validation and field focus behavior. Invalid raw input blocks Save, including when another pane representation is visible.
- Application fields and ID activate Details; synthetic metadata activates Provenance at the selected read-only value.
- These decisions supersede all older widget, Apply-blocking, and multi-row staging decisions below and in linked ledgers.

[21/09/26]

- Switching from NULL to Value does not expose validation feedback before the user leaves the field context.
- Focus movement between controls belonging to one field does not validate that field.
- Picker fields keep their picker-owned focus behavior when they leave NULL mode.
- Invalid drafts continue to block Apply even while their feedback is owned by the active row's Details representation.
- The mutation widget retains fallback feedback for invalid insertions, other rows, JSON, and Provenance.

## Open design decisions

[24/11/26]

- None for the approved refactor. Separate remote-conflict and payload-enum questions are not expanded by this work.

[21/09/26]

- None.

## Validation checklist

[24/11/26]

- [x] [done] Remove the Studio automated test suite and `apps/inspektor-test` before the Jazz upgrade.
- Earlier test and browser results below are historical. Re-establish Row Editor acceptance after the Jazz migration and a new validation plan.

[24/11/26]

The checks below were recorded before the requested test rollback. Test-file changes were reverted at the user's request; no checks were rerun afterward.

- Test-file changes and the added pane-editing test file are not retained.
- [x] [done] Verify production browser Save and reload, Cancel, dirty Escape, direct Delete and target reset, Duplicate-to-Insert, and real CodeMirror expanded-sibling focus and JSON persistence.
  - Evidence: a temporary in-memory app reused the Inspektor Test schema, permissions, and supported sample rows. Canonical fixture data was not changed.
- [x] [done] Inspect light and dark production screenshots, including a narrower viewport, with Save left and Cancel right and no floating widgets.
- [x] [done] Run Studio lint, typecheck, production build, and whitespace checks successfully.
- [ ] [blocked] Obtain a passing complete Studio suite.
  - Blocked by: the unchanged filter-focus test `focuses the last applied clause before removing clauses from the end`, which also fails in isolation. The full run passes 1,078 other tests.
- [ ] [blocked] Run canonical fixture-dependent Playwright acceptance.
  - Blocked by: the removed fixture's optional-JSON NULL seeding failure. The selected acceptance command failed before browser tests started.
- [ ] [blocked] Obtain a passing repository Lat check.
  - Blocked by: pre-existing links in `lat.md/query-subscriptions.md` and `lat.md/websiteBrand.md`; changed Lat sections introduce no reported errors.
- Further test and review work stopped at the user's request. Full acceptance is not claimed.

[21/09/26]

- [x] Cover nullable primitive and structured focus transfer.
- [x] Cover contextual validation and ARIA error association.
- [x] Cover mutation-widget feedback ownership without weakening Apply blocking.
- [x] Verify focus transfer and inline feedback in the assembled application.
