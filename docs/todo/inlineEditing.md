# Inline editing

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Mutation-boundary correctness](#mutation-boundary-correctness)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[28/08/26]

### Interaction-owned structured editor loading

- [x] Remove table-schema-driven CodeMirror preparation and begin loading only when a rendered structured editor needs the engine.
- [x] Preserve immediate textarea editing, focus handoff, and Floating Panel geometry while the production CodeMirror chunk is blocked.

[28/08/26]

### Shared field semantics

- [x] Pass canonical `MutationFieldInput` values through pane and Floating field editors without parallel nullable and omitted booleans.
- [x] Share pure field-mode and text transitions while retaining local Floating editor input until Save.
- [x] Leave required Boolean inserts unselected until the user chooses a valid value.
- [x] Collapse scalar and structured edit routing into one field-editor route; the shared field renderer owns control selection.
- [x] Resolve staged-over-source values through one helper for compact cells and cell actions.

[28/08/26]

### Enum NULL validation

- [x] Open the Enum selector when leaving NULL mode.
- [x] Delay empty Enum validation until save and explain how to resolve it without exposing parser output.

[28/08/26]

### Enum NULL presentation

- [x] Keep nullable Enum selection and explicit NULL intent in one compound input row.
- [x] Disable only the Enum value trigger while NULL is active so the inline NULL control remains available.

[28/08/26]

### Structured editor preload

- [x] Start loading CodeMirror when a table with structured columns mounts rather than after inline edit activation.
- [x] Keep the long cold fallback footprint equal to the final capped CodeMirror footprint.

[28/08/26]

### Compact structured non-value modes

- [x] Present structured NULL and default values with the standard read-only input height instead of a padded editor-like surface.

[28/08/26]

### Immediate structured field editor

- [x] Load the lightweight inline field-editor composition with the table view instead of exposing a blank deferred boundary after edit activation.
- [x] Keep CodeMirror deferred while preserving the expanded editor structure and geometry through its usable textarea fallback.
- [x] Initialize the imperative CodeMirror view before paint and reuse the resolved implementation on later mounts.

[26/08/26]

### Operation review rendering

- [x] Keep the mutation ledger's complete review projection independent from viewport presentation.
- [x] Bound each expanded operation list to 50 rendered rows and expose further operations in explicit batches.
- [x] Preserve complete list position and size semantics for assistive technology while rendering a partial batch.

[26/08/26]

### Deletion Apply presentation

- [x] Keep staged deletion rows visible while Apply is unresolved.
- [x] Remove a successfully deleted row and its widget operation in the same resolved presentation.
- [x] Retain failed deletions with their staged treatment for review and retry.

[26/08/26]

### Shared draft lifecycle simplification

- [x] Rebase staged drafts from loaded live rows even while their editor surfaces are unmounted.
- [x] Preserve staged fields during rebasing, update untouched fields, and remove overlays that become equal to live values.
- [x] Disable complete-row mutation controls and an open deletion confirmation while Apply owns the ledger.
- [x] Require provider-owned controllers for edit forms and remove the unused form-local save path.

[26/08/26]

### Apply lifecycle hardening

- [x] Complete ledger acknowledgement and execution state after the initiating table surface unmounts without invoking stale presentation callbacks.
- [x] Block inline field-editor activation and edit affordances while Apply is running.

[26/08/26]

- [x] Keep the active field target and its source-row snapshot under one table-state owner until completion or cancellation.
- [x] Make the table mutation provider's schema projection authoritative for every row mutation controller.
- [x] Preserve local uncommitted field input through transient query-row resets while explicit Close and Escape still discard it.
- [x] Supersede earlier field-preservation wording: only saved provider state survives explicit field-editor dismissal.
- [x] Supersede complete-state Apply failure wording with entry-level acknowledgement and unresolved-only retry.

[25/08/26]

- [x] Share schema-owned field editability policy between inline routing and mutation parsing.

[17/08/26]

### Operation review and grid recovery implementation

- [x] Preserve confirmed deletion batches as review operations while deriving deterministic row deletions for Apply.
- [x] Expose field, row, deletion-target, operation, and complete-ledger recovery scopes.
- [x] Project applicable staged fields into Data Grid cells with deletion precedence.
- [x] Connect semantic grid targets to one shared context menu with focus restoration.
- [x] Render plain-language operation summaries with operation and affected-row counts.
- [x] Keep review controls fixed while bounding independently scrolling operation lists.
- [x] Preserve invalid raw input and clear stale Apply failures after recovery.

[17/08/26]

- [x] Show the staged mutation count in the leading position of the Floating widget trigger.
- [x] Replace final-table-tab warning feedback with an Alert Dialog that offers `Keep editing` and `Discard and close`.
- [x] Clear the affected table ledger before completing a confirmed destructive tab close.

[17/08/26]

- [x] Move mutation ownership above the active table route into an in-memory workspace registry keyed by complete table scope.
- [x] Restore staged updates, deletions, invalid drafts, and Apply execution state when a table view remounts.
- [x] Register unresolved table ledgers with runtime-scope exit protection and the browser unload warning.
- [x] Keep a table's final workspace tab open until its ledger is applied or discarded.

[15/08/26]

### Stable row-pane deletion

- [x] Keep contextual deletion initiation and confirmation in the complete-row pane rather than the Floating widget.
- [x] Label one checked target `Delete row` and multiple checked targets `Delete N checked rows`.
- [x] Snapshot checked rows for confirmation, stage delete-over-update normalization, close the pane, and uncheck affected rows.
- [x] Keep the Floating widget focused on staged review, Discard, Apply changes, and execution status.

[15/08/26]

### Widget disclosure and Escape dismissal

- [x] Place the widget dock-trigger and staged-content disclosure chevrons after their labels.
- [x] Make Escape close the row pane and uncheck its active row while preserving other checked rows and staged changes.
- [x] Close selection-only widget state when Escape clears its final checked row.

[15/08/26]

### Widget undo, review sections, and direct cell editing

- [x] Reset the provider-owned row draft when its staged update is removed from the widget so an open form returns to live source values.
- [x] Present Updates and Deletions as independently collapsible accordion sections with a scrollable list in each expanded panel.
- [x] Allow double-click and Enter to open supported inline cell editors without requiring the row checkbox to be selected.
- [x] Complete inline cell editing through `Save`, return grid focus according to spreadsheet navigation, and expose the saved value in the shared staged queue.
- [x] Keep pane and inline editing on the same provider-owned draft without presenting both editing surfaces simultaneously.

[15/08/26]

### Unified staged edit and delete flow

This block supersedes the earlier pending-copy, immediate-delete, and review-suppression decisions below.

- [x] Stage every valid pane field automatically without a field-level or form-level confirmation.
- [x] Keep malformed field input recoverable and outside the staged ledger until corrected.
- [x] Confirm selected-row deletion before adding it to the same table ledger used by updates.
- [x] Keep `Apply changes` as the only Jazz persistence boundary for staged updates and deletions.
- [x] Keep affected-row review available while the complete-row pane remains open.
- [x] Clear row selection, close the row pane, and remove the widget after successful Apply.
- [x] Keep Table and Query Subscriptions controls grouped in the `dock left` group.
- [x] Use upward and rightward chevrons for expanded and collapsed widget disclosure.

[15/08/26]

### Pane and Floating-panel ownership

- [x] Restore direct insert-pane persistence with `Insert`, `Discard`, and `Insert more` actions.
- [x] Keep insert drafts outside the pending ledger and prevent insert typing from opening the Floating widget.
- [x] Remove semantically reverted edit fields from provider drafts and pending updates immediately.
- [x] Make table-scoped Discard reset pending entries, valid pane overlays, invalid raw input, and stale execution state together.
- [x] Keep one centered application-dock trigger mounted while Floating content is expanded or collapsed.
- [x] Place affected-row review above the persistent bottom summary and use the summary text as its disclosure control.

[14/08/26]

### Unified mutation UI cleanup

- [x] Remove per-row persistence controls, transition-decision UI, immediate deletion confirmation, and old global form coupling.
- [x] Use `Staged changes`, `Review changes`, `Apply changes`, and `Discard` across active product surfaces.
- [x] Align the Table Explorer behavior and architecture documentation with provider-owned multi-row drafts and one table-ledger Apply flow.

[14/08/26]

### Structured and routed field editing

- [x] Route JSON, Array, and Row fields to the Floating widget's expanded Code Editor.
- [x] Keep the optional field editor behind a deferred module so the base table and pending widget do not load row-editor controls.
- [x] Keep Enter and Tab editor-native, complete valid structured values with Cmd/Ctrl+Enter, and close without discarding through Escape.
- [x] Add a semantic Code Editor mount-focus contract that transfers focus from its loading fallback to CodeMirror.
- [x] Route relation and binary fields to the complete-row pane and focus the requested field after the pane renders.
- [x] Keep generated and unsupported fields read-only instead of opening a mutation surface.
- [x] Reuse the provider-owned row controller so structured, scalar, and pane edits share ledger identity and validation.

[14/08/26]

### Scalar inline editing

- [x] Add distinct Data Grid edit requests for double-click and Enter without changing single-click or Space activation.
- [x] Add semantic Data Grid focus requests that survive cell remounts and virtual rendering.
- [x] Route supported scalar schema fields to an explicit Floating field-editor composition.
- [x] Reuse the provider-owned row controller so pane and scalar edits merge into one row-ledger entry.
- [x] Keep invalid raw input recoverable with colocated feedback and outside mutation payloads.
- [x] Preserve the provider-owned field draft when Close or Escape dismisses the editor.
- [x] Complete with spreadsheet navigation: Enter moves down, Tab and Shift+Tab move horizontally and wrap across rows, and table boundaries retain the originating cell.
- [x] Verify Data Grid double-click and Enter behavior at a narrow dark viewport with no browser console errors.

[14/08/26]

### Ledger-owned transition policy

- [x] Remove the edit-form Save-and-continue, Discard-and-continue, and Keep-editing controls.
- [x] Remove global row-form submission coupling and the single-draft transition guard.
- [x] Let pane and inline-editor dismissal preserve provider-owned pending changes without a prompt.
- [x] Reset table-local staged state when the mounted table identity changes.

[14/08/26]

### Unified pending deletion

- [x] Present deletion as a selection action in the Floating widget rather than a row-form action.
- [x] Add every selected row id to the table ledger through delete-over-update normalization.
- [x] Keep checkbox selection independent from pending deletion lifetime.
- [x] Remove immediate deletion, the row-form confirmation state, and deletion-specific failure controls.
- [x] Use the shared affected-row review and `Apply changes` action as the only deletion confirmation and persistence path.

[14/08/26]

### Table-ledger Apply orchestration

- [x] Execute normalized updates and deletions through the generic Jazz mutation boundary.
- [x] Prevent duplicate Apply synchronously and retain the complete client state after failure.
- [x] Keep only idle, applying, and failed execution state in the table-local provider.
- [x] Show applying and failure feedback within the pending widget.

[14/08/26]

### Apply execution policy

- [x] Keep the initial Apply path on direct generic writes without promising atomicity or rollback.
- [x] Execute updates, then deletions, and stop on the first rejection.
- [x] Clear client state only after complete success and retain it after failure.

[14/08/26]

### Pending summary and affected-row review

- [x] Add explicit selection and pending-change widget compositions over `FloatingPanel` parts.
- [x] Show exact normalized totals and update and deletion groups without value-level diffs.
- [x] Show shortened row identities, update field breadth, entry removal, and table-scoped discard.
- [x] Keep collapse state local to the widget and distinguish pending changes from editor input that needs attention.
- [x] Keep `Apply changes` unavailable until the execution policy and orchestrator are implemented.

[14/08/26]

### Floating panel presentation

- [x] Add the constrained `FloatingPanel` compound component with Root, Content, Summary, and Actions parts.
- [x] Keep the shell non-modal, portalled to a stable document-body target, and transparent to interaction outside its visible surface.
- [x] Add a semantic floating layer below popups and tooltips so nested controls remain visible.
- [x] Document the public compound API with generated prop metadata and executable compact, review, editor, failure, collapsed, and narrow-width states.
- [x] Verify dark and light themes, keyboard disclosure semantics, outside interaction, and reflow at narrow workspace widths.

[14/08/26]

### Table-scoped provider and pane ownership

- [x] Mount one `TableMutationLedgerProvider` around one table view.
- [x] Keep edit-pane and inline drafts in one provider-owned record per row.
- [x] Derive valid sparse updates and invalid state from each raw draft.
- [x] Preserve pane drafts independently from checkbox selection, filtering, sorting, pagination, and pane visibility.

[14/08/26]

### Table mutation ledger domain

- [x] Key the provider boundary with the table view's existing complete identity.
- [x] Model raw row drafts and deduplicated deletion IDs as the canonical state.
- [x] Derive grouped counts, affected rows, changed-field breadth, and Apply eligibility without rendering value diffs.
- [x] Normalize field reversion, delete-over-update, duplicate deletion, restoration, entry removal, and discard as pure logic.
- [x] Derive normalized mutation payloads while retaining invalid editor input in the canonical draft.

[14/08/26]

### Controlled row-draft controller

- [x] Move draft creation, field updates, semantic dirty state, validation, and submission construction behind `useRowDraftController`.
- [x] Support externally bound draft state through the controller's `state`, `actions`, and `meta` contract.
- [x] Allow edit forms to consume an externally owned controller without changing the pane field model.
- [x] Preserve externally owned edit values across form remounts.

[14/08/26]

### Floating mutation widget characterization

- [x] Characterize invalid raw-input retention and exclusion from edit submissions.
- [x] Characterize explicit NULL as a sparse update value.
- [x] Characterize edit draft retention across mutation failures and retries.
- [x] Confirm the retained-draft tests fail when mutation failure handling is intentionally changed to reset the draft.

[28/07/26]

### Shared row mutation model

- [x] Keep Jazz schema and persistence semantics behind `ColumnDescriptor`, `ColumnType`, dynamic table proxies, and Jazz database mutations.
- [x] Keep mutation rules independent from the editing surface in `rowMutationDraft.ts` and `mutationParsing.ts`.
- [x] Represent update drafts as sparse dirty-field overlays over the latest live Jazz row.
- [x] Represent insert fields as value, explicit NULL, or omitted default intent.
- [x] Build updates from dirty fields only so untouched live values never enter the patch.
- [x] Preserve staged fields across live updates while continuing to update untouched fields.
- [x] Remove a staged field when its parsed value becomes semantically equal to the latest source value.
- [x] Preserve invalid raw input without allowing it into a Jazz mutation.
- [x] Keep binary fields read-only where a generic editor cannot preserve byte intent.

### Mutation and transition boundaries

- [x] Send generic inserts, sparse updates, and deletes through `useTableMutations` and Jazz's edge-acknowledged mutation API.
- [x] Protect one active dirty draft through clean, dirty, and saving lifecycle states.
- [x] Support Save and continue, Discard and continue, Keep editing, and explicit form Cancel.
- [x] Guard row-target, query-scope, pane, relation, and route transitions without putting field state in the guard.

### Pane proof of the shared model

- [x] Use the shared mutation model for pane insert and pane edit forms.
- [x] Keep form-only concerns such as expanded editors, focus, and duplicate-submit protection in `useRowEditorFields`.
- [x] Confirm that Details and JSON pane representations do not own or reset the row draft.

### Grid foundation

- [x] Keep cell identity based on semantic row and column IDs.
- [x] Keep cell selection separate from inspection and editing.
- [x] Keep row checkbox selection separate from the one row whose draft is active.
- [x] Keep table cells schema-driven without embedding Jazz mutation rules in cell renderers.

## Open product work

[14/08/26]

The older blocks below record the superseded single-row draft design and are retained as implementation history. They are not
active product requirements. Current work follows the implemented update-and-deletion ledger model above and the focused Floating
mutation widget specification.

[28/07/26]

### Draft ownership

- [ ] Add one row-level inline draft owner above individual table cells, at the data-grid or `TableView` orchestration level.
- [ ] Preserve that draft when focus moves between editable cells in the same row.
- [ ] Keep the draft mounted when a cell renderer unmounts because of pagination, column visibility, or table rendering changes.
- [ ] Key the draft by semantic row identity so changing rows never retargets an existing draft.
- [ ] Expose field state and actions to cells without making each cell its own draft owner.
- [ ] Submit the complete sparse patch for the active row, including changes made in several inline cells.

### Editing surfaces and field routing

- [ ] Make pane and inline editing simultaneously available without a workspace mode preference.
- [ ] Define the inline suitability matrix from Jazz column descriptors and product constraints.
- [ ] Use constrained inline controls for primitive scalar and enum fields.
- [ ] Use an expanded code editor in an anchored inline dialog for JSON, Array, and Row fields.
- [ ] Add an expand action to the structured inline editor that opens the complete-row pane focused on that field.
- [ ] Open the complete-row pane focused on relation and binary fields.
- [ ] Use an inline calendar for timestamp fields when that control is implemented.
- [ ] Keep generated, unsupported, and otherwise read-only fields read-only in the grid.
- [ ] Do not transfer an existing dirty draft between pane and inline surfaces without an explicit Save, Discard, or Keep editing decision.

### Activation, focus, and keyboard behavior

- [ ] Start inline editing for a supported selected cell through double-click or Enter.
- [ ] Keep single click as selection rather than mutation.
- [ ] Define Enter, Escape, Tab, Shift+Tab, and pointer behavior while an inline editor is active.
- [ ] Restore grid focus to a predictable cell after save, discard, or failed validation.
- [ ] Keep selection and focus stable when validation prevents leaving a field.
- [ ] Ensure screen readers receive the field label, type, dirty state, validation error, and save failure.

### Inline controls

- [ ] Add constrained inline controls for supported scalar fields without duplicating parsing or validation.
- [ ] Add a bounded anchored inline dialog with explicit Save, Cancel, and expand actions for structured values.
- [ ] Reuse the shared NULL semantics where the inline layout can express them clearly.
- [ ] Reuse enum and boolean choices without recreating Base UI interaction behavior.
- [ ] Use the existing timestamp conversion rules for inline timestamp input.
- [ ] Focus the requested field when relation, binary, or structured expansion opens the complete-row pane.

### Guard and mutation integration

- [ ] Report semantic inline dirty state to `useDraftTransitionGuard`.
- [ ] Guard row changes, sorting, filtering, table changes, relation navigation, pane replacement, and route navigation.
- [ ] Close a clean row pane before starting inline editing on a double-clicked cell.
- [ ] Block that transition with `The current row has staged changes.` when the row pane draft is dirty.
- [ ] Keep the inline draft after validation or Jazz mutation failure.
- [ ] Let successful live-row reconciliation clear saved overlays without reconstructing the row.
- [ ] Skip normal inline post-save focus behavior when Save and continue proceeds to another destination.

### User-flow coverage

- [ ] Cover editing several cells in one row and saving one sparse patch.
- [ ] Cover restoring all changed cells to source values and returning the draft to clean.
- [ ] Cover a live source update to untouched and dirty fields while inline editing.
- [ ] Cover row change with Save, Discard, and Keep editing decisions.
- [ ] Cover structured inline expansion and relation or binary routing to the complete-row pane.
- [ ] Cover clean row-pane dismissal before inline editing and dirty row-pane transition protection.
- [ ] Cover validation and Jazz mutation failure without losing the draft.
- [ ] Cover keyboard activation, traversal, save, and cancel as complete user flows.

## Work outside the foundation scope

[28/07/26]

- [ ] Inline insertion through a temporary grid row is not part of the current inline editing scope; insertion remains pane-based.
- [ ] Several simultaneously dirty row drafts are not supported; the first inline implementation owns one active row draft.
- [ ] Batch save, partial retry, and cross-row transaction behavior are not part of the first inline implementation.
- [ ] Binary text editing is not added until the product defines an explicit byte encoding and round-trip contract.
- [ ] Cell hover cards are not introduced as part of inline editing.

## Settled interaction decisions

[28/08/26]

- A structured edit starts CodeMirror loading from the rendered editor rather than from table mount. This supersedes the structured-table preload decision below.
- The textarea fallback remains the primary cold-interaction safeguard and must preserve editing, focus, and external panel geometry through the CodeMirror handoff.

[28/08/26]

- Structured tables preload the deferred CodeMirror chunk in the background before the first edit.
- An interaction that wins the preload race still opens the usable textarea fallback without changing the panel's capped geometry.

[28/08/26]

- Structured NULL and default modes use the same control height as ordinary field inputs; only an editable structured value opens the code editor surface.

[28/08/26]

- The inline field-editor composition is part of the primary table interaction and loads with the table view.
- CodeMirror remains deferred, but loading must not introduce an empty editor frame or change the floating panel's external geometry.
- Loading-state height changes are fixed at their source rather than animated by the Floating Panel.

[17/08/26]

- [x] Treat staged deletion as a complete-row state and staged update as a sparse cell state.
- [x] Preserve the row checkbox for staged updates; only staged deletion replaces it with an Undo action.
- [x] Use a dedicated warm amber staged-update role rather than success or warning semantics.
- [x] Keep individual cell and row recovery in grid context menus while retaining operation Undo and complete-ledger Discard.
- [x] Describe structured-value updates by row and column identity without serializing JSON or claiming an undefined path diff.
- [x] Keep `Apply changes` as the only staged-update and staged-deletion persistence boundary.

[17/08/26]

- [x] Preserve staged changes across table and workspace-tab navigation without displaying a notification.
- [x] Confirm final-table-tab data loss with an Alert Dialog rather than a toast or browser unload prompt.
- [x] Keep refresh and browser-close protection on `beforeunload`; the browser owns prompt availability and copy.

[17/08/26]

- [x] Treat staged mutations as table-scoped workspace state keyed by connection, branch, schema hash, and table name.
- [x] Preserve staged updates, deletions, invalid drafts, and Apply failures across table and workspace-tab navigation.
- [x] Clear a table ledger only through successful Apply or explicit Discard before runtime-scope exit.
- [x] Prevent closing a table's final workspace tab from silently discarding unresolved mutation state.
- [x] Keep ledgers in memory only and warn before browser unload while unresolved state exists.

[15/08/26]

- [x] Complete-row inserts persist directly and do not enter the table mutation ledger.
- [x] `Insert more` changes only whether a successful insert resets and retains the insert pane.
- [x] Pane edits continue publishing valid sparse updates to the pending ledger.
- [x] Double-click focuses a field only for the active row pane; it does nothing for another row while that pane is open.
- [x] Inline field editing requires a closed complete-row pane but does not require a checked row.
- [x] Selection presentation is replaced by pending presentation after the first edit and returns when all pending edits are discarded.
- [x] Whole-panel disclosure belongs to the centered dock trigger; review disclosure belongs to the summary text.

[28/07/26]

- [x] Jazz owns schema, mutation conversion, permissions, persistence, and synchronization.
- [x] Inspektor owns draft input, validation presentation, dirty tracking, and transition protection.
- [x] One active inline row draft is owned above cell renderers.
- [x] Moving between fields in the same row preserves the row draft.
- [x] Moving to another row is a guarded target change when the current draft is dirty.
- [x] Saving from any inline cell submits every dirty field in that row's sparse patch.
- [x] Pane and inline editing consume the same parsing, NULL, validation, reconciliation, patch, and mutation rules.
- [x] Pane and inline editing are simultaneously available rather than selected through a workspace preference.
- [x] JSON, Array, and Row fields use an expanded code editor in an anchored inline dialog with an explicit path to the complete-row pane.
- [x] Relation and binary fields open the complete-row pane focused on their field.
- [x] Generated, unsupported, and otherwise read-only fields remain read-only in the grid.
- [x] Selection, inspection, and editing remain separate interactions.
- [x] A draft does not move between editing surfaces implicitly.
- [x] A clean row pane closes before a cell begins inline editing; a dirty row pane invokes the mutation draft guard.
- [x] Inline editing applies to existing rows; row insertion remains in the pane.

## Open design decisions

[17/08/26]

- [x] Supersede the pending-cell presentation question with a warm amber staged-cell treatment that remains distinct from selection and focus.
- [x] Supersede row-level Save and Cancel placement with grid context-menu recovery and the table-ledger Apply boundary.

[14/08/26]

The older completion, row-level persistence, and dirty-transition questions below are settled by the table-ledger model. Remaining
product decisions concern timestamp interaction, pending-cell presentation, hidden pending columns, and pagination presentation.

[28/07/26]

- [ ] Decide whether Enter saves the row, advances to another cell, or does both based on modifier keys.
- [ ] Decide whether leaving an inline cell stages only, attempts save, or requires an explicit row-level save action.
- [ ] Decide how dirty cells and the active dirty row are indicated without competing with selection styles.
- [ ] Decide where row-level Save and Cancel actions appear while several cells in one row are staged.
- [ ] Decide whether validation keeps focus in the active cell or moves to the first invalid field in the row.
- [ ] Decide the exact inline calendar interaction for timestamp fields.
- [ ] Decide how column hiding behaves when the hidden column has a dirty staged value.
- [ ] Decide how pagination requests behave when the active dirty row would leave the loaded window.

## Mutation-boundary correctness

[28/07/26]

- [x] Restrict writable BigInt values to JavaScript's safe integer range because the installed Jazz boundary uses `Number`.
- [x] Encode JSON scalar strings for Jazz and reject JSON null because Jazz reads it back indistinguishably from SQL NULL.
- [x] Add direct contract tests that pass parsed values through the installed Jazz mutation converter and reader.
- [x] Remove update overlays for columns that disappear from the live schema so obsolete fields cannot keep a draft dirty.

## Validation checklist

[28/08/26]

- [x] Verify a structured cell opens, edits, saves, and reopens its staged value through the production CodeMirror boundary in the isolated browser fixture.

[28/08/26]

- [x] Cover canonical field input, route collapse, staged value resolution, Boolean empty state, Enum NULL recovery, and input transitions with focused tests.
- [x] Verify Inspektor formatting, lint, typecheck, production build, package-wide tests, and the isolated browser suite.

[28/08/26]

- [x] Verify nullable Enum validation timing, recovery guidance, and selector opening with a focused widget test.

[28/08/26]

- [x] Verify nullable Enum value and NULL modes with focused mutation-field and browser tests.

[28/08/26]

- [x] Cover the structured NULL presentation with the standard input-size contract.
- [ ] Verify the compact structured NULL mode in the inline field editor.

[28/08/26]

- [ ] Verify the cold structured editor opens with stable geometry in the production browser flow.
- [x] Run focused Code Editor and Table View tests, changed-file lint, affected-package typechecks, builds, and package-wide tests.

[26/08/26]

- [x] Cover 50-row operation batches and explicit access to the next batch while preserving independent list scrolling.
- [x] Verify focused tests, changed-file lint, application typecheck and build, and package-wide tests.

[25/08/26]

- [x] Cover inline routing and mutation parsing against the shared field editability policy.
- [x] Verify application formatting, lint, typecheck, build, and package tests.

[28/07/26]

- [ ] Run focused inline user-flow tests.
- [ ] Run shared row mutation draft and parsing tests.
- [ ] Run `pnpm --filter inspektor typecheck`.
- [ ] Run `pnpm --filter inspektor lint`.
- [ ] Run `pnpm --filter inspektor build`.
- [ ] Inspect the production bundle when inline controls add or move deferred dependencies.
- [ ] Verify keyboard editing with focus outlines and screen-reader labels.
- [ ] Verify dirty transitions through row, filter, sort, table, relation, and route changes.
