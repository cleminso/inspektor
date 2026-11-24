# Table Explorer selection and pane behavior

This specification defines selection, focus, editing, and side-pane behavior in the Table Explorer.

The side-pane-only contract below is approved. Implementation and runtime acceptance remain tracked in
[the Row Editor ledger](../todo/rowEditor.md).

## Table of contents

This table of contents links to the document sections.

- [Purpose](#purpose)
- [Product boundary](#product-boundary)
- [Terminology](#terminology)
- [Behavior model](#behavior-model)
- [Row selection scenarios](#row-selection-scenarios)
- [Cell selection scenarios](#cell-selection-scenarios)
- [Editing surfaces](#editing-surfaces)
- [Side-pane behavior](#side-pane-behavior)
- [Mutation draft behavior](#mutation-draft-behavior)
- [Column selection and bulk editing](#column-selection-and-bulk-editing)
- [Row and field information](#row-and-field-information)
- [Visual behavior](#visual-behavior)
- [Side-pane layout](#side-pane-layout)
- [Foundation scope](#foundation-scope)
- [Recorded advanced behavior](#recorded-advanced-behavior)
- [Open decisions](#open-decisions)

## Purpose

This document specifies selection, focus, side-pane, and bulk-edit behavior for the Table Explorer. It is the focused behavior

specification for the data surface described in [[design-document#Inspektor design document|the main design document]].

The main design document owns product direction and architecture. This document owns detailed interaction scenarios and
acceptance rules so the main document does not accumulate every pointer, keyboard, selection, and pane transition.

## Product boundary

The reusable DataGrid owns record-oriented rendering; the application owns advanced selection and mutation workflows.

The foundation is a read-first `DataGrid` with TanStack Table cell-selection ranges. Opening complete multi-cell selections,
column selection, and bulk cell editing cross the product boundary into application behavior. The richer behavior may reuse
DataGrid rendering and schema-derived components without making the record-oriented DataGrid API ambiguous.

The Inspektor remains schema-driven. Selection behavior is generic and does not depend on generated table-specific code.

## Terminology

These terms distinguish row selection, cell selection, pane focus, drafts, and query position.

- **Checked row**: the single row selected through its checkbox.
- **Focused row**: the selected row represented in the side pane.
- **Selected cell**: a cell included in the cell-selection set.
- **Focused cell**: the anchor of the latest TanStack cell-range operation and the cell receiving the strongest focus treatment.
- **Row selection**: zero or one selected row ID; there is no checkbox-range anchor.
- **Cell selection**: ordered rectangular include and exclude operations resolved against the displayed rows and columns.
- **Pane target**: the checked row represented in the side pane.
- **Row draft**: the latest live source row plus dirty field overlays, raw input, parsed values, and validation state.
- **Save**: validation and global persistence of the current row's sparse dirty-field patch.
- **Query position**: a row's position in the active filtered and sorted result, not a stable row identity.

## Behavior model

Selection, the active row draft, and side-pane presentation are separate state.

- A cell can be focused without opening the side pane.
- Multiple cells can be selected before the user chooses an explicit copy or mutation operation.
- Row selection and cell-range corners use stable row IDs and column IDs rather than stored visual coordinates.
- Row and cell selections can coexist. Opening or closing the row pane does not silently destroy cell selection.
- While the application preserves cell-selection state, column reorder, visibility, and live data refreshes resolve range interiors
  against the displayed table while keeping each operation's corner IDs stable.

The side pane has these presentation modes:

- `closed`: no pane target
- `insert`: schema-driven row insertion
- `rows`: one selected row represented in the pane

Pane precedence is explicit:

- a row-checkbox interaction opens `rows`
- the insert action opens `insert`
- a single cell click changes cell focus without changing pane mode
- a double-click or Enter opens `rows` at the selected field: application fields and ID use Details; synthetic metadata uses Provenance

The side pane is the only write surface. Only one row is edited at a time. A dirty target change asks before discarding the current
row draft; canceling the transition keeps its target and raw input.

Selection belongs to the represented query result:

- changing the filter, sort, page, table, or schema clears row and cell selections
- reordering columns preserves range corners and recomputes the cells between them in displayed order
- hiding an interior column contracts a visible range, while hiding a corner suspends that range until the corner returns
- loading additional rows preserves cell-selection state; appended rows outside existing corner intervals remain unselected

Selection resets cannot silently discard dirty input. Resolve the dirty transition before changing its target or query scope.

## Row selection scenarios

These scenarios define single-row checkbox selection, pane focus, and guarded deselection.

### Select one row

Selecting one row checks it, focuses it, and opens its complete-row pane.

- **Given** no row is checked
- **When** the user clicks a row checkbox
- **Then** the row becomes checked
- **And** the row pane opens
- **And** the row becomes the focused row
- **And** the pane renders every schema field with its schema-derived field component

Clicking row content does not check the row. The checkbox and its complete table cell are the row-selection hit area.
An unchecked selectable row can also be checked from the context menu opened on any of its cells or on the row itself.

### Select rows individually

Selecting another checkbox replaces the current row rather than adding to a checked set.

- **Given** one row is checked
- **When** the user clicks another unchecked row checkbox
- **Then** that row replaces the selected row after any dirty-discard confirmation
- **And** it becomes the focused row
- **And** the pane header shows its position in the current results

Clicking the checked checkbox clears row selection and closes the pane after any dirty-discard confirmation.
Canceling the transition retains the selected row, pane, and raw input.

### Select a row range

Checkbox row ranges are not supported; row selection remains limited to one row.

Shift-click does not create a checked-row range. This restriction does not change Shift-based rectangular multi-cell selection.
Previous and next follow rows in the active filtered and sorted page and continue across page boundaries, not through a checked set.

## Cell selection scenarios

These scenarios define cell focus, editing, range composition, and multi-cell operations.

### Focus one cell

A single click makes one data cell the focused selection without changing the side pane.

- **Given** the user is browsing table data
- **When** the user single-clicks a data cell
- **Then** that cell becomes the sole cell selection and focused cell
- **And** the cell receives the focus border
- **But** the side pane does not open or change presentation

Interactive cell descendants such as relation links and checkbox controls retain their own behavior and do not select the data
cell.

Native text selection is disabled on the table surface. Pointer gestures select cells rather than glyphs; field controls in the
side pane remain the place for selecting and editing text.

### Edit one cell

A double-click or Enter opens the complete-row pane at the selected field in Details or Provenance.

- **Given** a data cell is focused
- **When** the user double-clicks that cell
- **Then** the pane opens Details for an application field or ID, or Provenance for synthetic metadata, and focuses that field
- **And** the cell remains focused
- **And** only that row can own the active edit draft

The Enter key offers an equivalent keyboard action when the table supports keyboard cell navigation. An unmodified double-click
inside a multi-cell selection replaces that selection with the target cell before opening the matching pane representation.

While the complete-row pane is open, activating a cell in its focused checked row moves focus to the matching pane field.
Activating another row selects its matching representation after any dirty-discard confirmation.

Field routing is schema-derived:

- writable fields use schema-derived controls inside Details
- structured values use the pane's structured editor
- generated, unsupported, binary, and other read-only values remain inspectable in Details without gaining write controls
- synthetic `$createdAt`, `$createdBy`, `$updatedAt`, and `$updatedBy` cells open the existing read-only Provenance representation and focus that metadata field; Details does not duplicate these fields

Cells do not open a separate inspection-only pane or hover card. Complete and alternate field representations remain available
through the complete-row pane.

### Select multiple cells

Modifier clicks compose rectangular include and exclude operations across visible rows and columns.

- **Given** one cell is focused
- **When** the user Command-clicks another data cell
- **Then** an inclusion starts when the target is outside the selection and an exclusion starts when it is inside
- **And** the interaction target becomes the anchor of the latest range operation
- **And** the side pane remains unchanged until the user starts an explicit operation

Control-click provides the equivalent modifier on platforms where Command is unavailable. Include and exclude operations compose
across rows and columns. Shift-click extends the latest range from its fixed anchor to the target across the displayed query rows
and data columns. Dragging across body cells moves the latest operation's focus corner.

### Operate on a multi-cell selection

Context-menu copy commands preserve an existing multi-cell selection without collapsing it.

- **Given** multiple cells are selected
- **When** the user right-clicks inside the selection
- **Then** the existing selection remains intact
- **And** the context menu offers copy operations for that selection

Right-clicking an unselected cell replaces the cell selection with that cell before opening the context menu.

Bulk editing is outside the approved row-editor scope. Cell ranges do not create another write surface or a batch Save workflow.

## Editing surfaces

The complete-row side pane is the only write surface; floating field editors and the pending-change widget are removed.

Checkbox selection opens the row pane. Double-click or Enter focuses the selected application field or ID in Details, including
read-only values. Synthetic metadata instead opens and focuses its field in Provenance.
The provider-owned draft retains parsing, validation, dirty tracking, and raw input.
The complete-row pane reveals field validation after focus leaves the complete field interaction context, not while focus moves
between controls within that field. Leaving NULL mode moves focus into the value control or opens the field's picker. While the
active row's Details representation owns invalid input, field errors render below their controls. Invalid input blocks Save and
remains recoverable when switching pane representations.

## Side-pane behavior

The side pane presents insert or checked-row content and owns the visible persistence actions.

### Row pane

The row pane shows one focused row and provides current-row Save and Cancel.

- The header shows the focused row's query position without a redundant edit heading.
- Previous and next replace the selected row with the adjacent filtered and sorted page row and continue across pages.
- The body renders all schema fields, including hidden table columns, using their field components.
- Clicking a cell in the focused checked row moves focus to that field's first available control and leaves the row pane open.
- Only the focused row is edited or deleted; checked-row selection does not imply a bulk mutation.
- Footer actions run left to right: `Delete row` / `Close` when clean, and `Save` / `Cancel` when dirty.
- `Cancel` discards the current row's valid and invalid edits and keeps the pane open.
- `Save` validates and globally persists only that row's sparse dirty values; success keeps the pane open and clean.
- Validation or persistence failure retains raw edits and exposes the error.
- Dirty Close, Escape, row switching, and previous/next navigation ask before discarding edits.
- Double-clicking an application field or ID opens Details there; synthetic metadata opens Provenance at that field. Another row uses the same guarded target transition.
- Unchecking the selected row closes the pane after any dirty-discard confirmation.

### Cell activation and pane routing

Cell activation opens Details for application fields and ID, or Provenance for synthetic metadata, with requested-field focus.

Read-only values remain inspectable. Activation does not persist a value. There is no floating field Save or spreadsheet
completion route. Controls inside Details retain their native keyboard behavior.

The footer `Close` action and Escape use the same row-pane dismissal behavior:

- with a row pane open, dismissal closes the pane and clears the single selected row
- row-pane dismissal returns focus to the checkbox for the focused row
- insert-pane dismissal returns focus to the persistent toolbar `Insert row` action
- without a pane open, Escape clears cell selection, semantic cell focus, and column focus while retaining DOM focus on the current grid cell

For a dirty row, dismissal runs only after discard confirmation. Keeping edits cancels dismissal and preserves raw input.
Nested controls can consume Escape before the pane handles it.

## Mutation draft behavior

The [[jazzAlignmentAndInspectorPolicies#Verified field representation contracts|verified Jazz field representation contracts]] define omission, SQL NULL, empty and invalid values, nested Row normalization, structured draft formatting, and verification scope.

The pane consumes one active row draft:

- The source row captured when editing starts is stored separately from sparse field overlays.
- Returning a field to that source value removes the field from the dirty set.
- Cancel resets all current-row overlays and invalid raw input to source values without closing the pane.
- Invalid input retains its raw form and validation error but cannot enter a mutation patch.
- Save is blocked by invalid input and sends only the current row's valid sparse fields, never a reconstructed row.
- Mutation failure preserves the draft.

After global write acknowledgement, Save reads the current row through Jazz's remote query API and replaces the pane's source snapshot.
The grid remains subscription-owned; there is no accepted-value cache or reconciliation layer. A failed refresh is reported as
already saved, clears the submitted draft, and does not offer Save again for that write.

Insert fields distinguish `omitted`, `null`, `valid`, and `invalid`. Omitted fields are absent from the payload so stored defaults
can apply. Explicit NULL remains a separate user choice. The insert pane persists a valid row directly through `Insert`; `Discard`
closes without persistence, and `Insert more` resets and keeps the form open after each successful insert.

`Duplicate row` reads the current row and opens a prefilled insert pane. It copies schema fields, including hidden columns, and excludes automatic identity
and provenance. It uses the existing direct `Insert`, `Discard`, and `Insert more` path, not a staged insertion. Replacing a dirty
row pane first asks before discarding its draft. The grid renders only Jazz query results; successful insertion appears at its
authoritative filtered and sorted position.

The internal ledger may remain as draft storage and lifecycle infrastructure. It does not expose multi-row staging, review,
Apply, operation Undo, or a pending-change widget. Save cannot persist hidden drafts from another row.

`Delete row` targets the single current row. Both pane and context-menu deletion require confirmation
and call the direct delete path. They never stage deletion or replace the checkbox with Undo. A rejected delete retains the row
and shows its error. Dirty edits cannot be silently lost through a context action.

## Column selection and bulk editing

Column selection is an advanced, explicit action; the mutation examples below are future directions, not approved row-editor behavior.

- **Given** the user right-clicks a data-column header
- **When** the header context menu opens
- **And** the user chooses a scoped column operation
- **Then** the application selects the cells in the command's declared scope
- **And** copy does not open a write surface

A normal header click remains available for column focus, dragging, resizing, and sorting behavior. The context action avoids an
accidental large selection.

Activating a column header clears cell focus and cell selection before the column receives its active treatment.

The command must state its scope. A column operation cannot silently mean both visible rows and every matching row.
Scoped command examples distinguish copy from a future, separately approved mutation:

- `Copy visible column cells`
- `Edit this column for matching rows…`

Visible cells are a table selection. Every matching row is a query-backed bulk operation that can include unloaded rows and
requires separate confirmation.

Same-column mutation and query-backed bulk editing remain outside this refactor. They cannot restore a batch Apply workflow or
another write surface without separate approval.

## Row and field information

Schema metadata and query state determine the field set and the row-position labels.

### Field information

Stored schema metadata provides the conceptual field set for every row:

- the synthetic `id` field
- every stored schema column
- column type and nullability
- relation metadata
- editability derived from supported serialization

The row pane derives fields from schema metadata rather than `Object.keys(row)`. Optional values may be absent from a returned
object while the schema field still exists.

The application can report total schema fields, visible fields, hidden fields, editable fields, and read-only fields.

### Row position

The application can report:

- position within loaded rows
- position within a page
- position within a filtered and sorted query when a page offset is known

The application cannot treat that position as stable identity or promise an exact table total without a count query. Live data,
sorting, and filtering can change query position. Row ID remains the stable identity.

Use labels such as `Row 8 in current results` or a page-offset position when that scope is known. Do not imply
that `Row 8` is an immutable database position.

## Visual behavior

Distinct visual states identify the selected row, selected cells, focused cells, validation, edits, and live updates.

- The selected row uses the selected-row background and a distinct blue focus edge.
- Selected cells use the selected-cell background.
- The focused cell receives the strongest blue focus border.
- Row selection, cell selection, row focus, cell focus, validation, dirty state, and live-update state remain visually distinct.
- Pointer focus and keyboard focus must remain perceivable without relying only on color.

Multi-cell operations follow visible table-column order and active query row order. The latest operation's anchor is focused.
Row IDs and column IDs identify range corners; displayed order determines each range interior.

## Side-pane layout

The side pane spans the complete Data Explorer workspace beside it:

- action and filter builder
- table viewport
- table footer or pagination

The pane does not align only to the table body. Its header remains aligned with the top of the data workspace, its body scrolls
independently, and its footer remains aligned with the table footer. Opening the filter builder changes the left workspace but
does not reposition the pane.

## Foundation scope

The foundation establishes:

- row checkbox selection independent from cell selection
- single-row checkbox selection with guarded replacement and deselection
- previous/next navigation through filtered and sorted page rows, including page boundaries
- single-click cell focus without pane activation
- double-click and Enter activation into Details for application fields and ID, or Provenance for synthetic metadata, with requested-field focus
- one current-row draft with pane Save, Cancel, and guarded discard transitions
- confirmed direct deletion and direct insertion, including prefilled duplication
- Command/Control additive multi-cell selection across rows and columns
- Shift rectangular cell-range selection across visible rows and data columns
- selection state independent from pane state
- stable row-ID and column-ID targets
- schema-derived row presentation and structured editing inside Details
- read-only field activation into the complete-row pane
- side-pane header, scrolling body, fixed footer, and accessible dismissal

## Recorded advanced behavior

These earlier advanced directions are outside this refactor and need separate approval before adding write surfaces or batch workflows:

- selected-cell context menus with explicit copy and mutation commands
- bulk-operation review and editing surfaces
- header context menu with scoped column-selection commands
- query-backed bulk editing across matching rows
- transactional or batched mutation semantics
- complete keyboard grid navigation

## Open decisions

These unresolved choices concern bulk-operation scope and partial-write recovery.

- The exact visible-page versus loaded-result scope of column-selection operations.
- The error and recovery presentation for partial bulk-write failure when atomic writes are unavailable.
