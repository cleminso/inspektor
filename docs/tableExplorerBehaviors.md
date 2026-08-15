# Table Explorer selection and pane behavior

## Table of contents

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
specification for the data surface described in [the main design document](./design-document.md).

The main design document owns product direction and architecture. This document owns detailed interaction scenarios and
acceptance rules so the main document does not accumulate every pointer, keyboard, selection, and pane transition.

## Product boundary

The foundation is a read-first `DataGrid` with TanStack Table cell-selection ranges. Opening complete multi-cell selections,
column selection, and bulk cell editing cross the product boundary into application behavior. The richer behavior may reuse
DataGrid rendering and schema-derived components without making the record-oriented DataGrid API ambiguous.

The Inspector remains schema-driven. Selection behavior is generic and does not depend on generated table-specific code.

## Terminology

- **Checked row**: a row included through its checkbox. Checked rows form the row-selection set.
- **Focused row**: the checked row represented in the side pane. Only one checked row is focused.
- **Selected cell**: a cell included in the cell-selection set.
- **Focused cell**: the anchor of the latest TanStack cell-range operation and the cell receiving the strongest focus treatment.
- **Row selection**: checked row IDs plus the focused row ID and checkbox-range anchor.
- **Cell selection**: ordered rectangular include and exclude operations resolved against the displayed rows and columns.
- **Pane target**: the checked row represented in the side pane.
- **Row draft**: the latest live source row plus dirty field overlays, raw input, parsed values, and validation state.
- **Query position**: a row's position in the active filtered and sorted result, not a stable row identity.

## Behavior model

Selection, inline editing, and side-pane presentation are separate state.

- A cell can be focused without opening the side pane.
- Multiple cells can be selected before the user chooses an explicit copy or mutation operation.
- Row selection and cell-range corners use stable row IDs and column IDs rather than stored visual coordinates.
- Row and cell selections can coexist. Opening or closing the row pane does not silently destroy cell selection.
- While the application preserves cell-selection state, column reorder, visibility, and live data refreshes resolve range interiors
  against the displayed table while keeping each operation's corner IDs stable.

The side pane has these presentation modes:

- `closed`: no pane target
- `insert`: schema-driven row insertion
- `rows`: checked row IDs plus one focused row

Pane precedence is explicit:

- a row-checkbox interaction opens `rows`
- the insert action opens `insert`
- a single cell click changes cell focus without changing pane mode
- a double-click starts schema-appropriate inline editing or routes relation and binary fields to `rows`

Pane and inline editing consume the same provider-owned row controller but are not shown simultaneously. Moving from inline editing
to the complete-row pane preserves pending values and does not require a persistence decision.

Selection belongs to the represented query result:

- changing the filter, sort, page, table, or schema clears row and cell selections
- reordering columns preserves range corners and recomputes the cells between them in displayed order
- hiding an interior column contracts a visible range, while hiding a corner suspends that range until the corner returns
- loading additional rows preserves cell-selection state; appended rows outside existing corner intervals remain unselected

## Row selection scenarios

### Select one row

- **Given** no row is checked
- **When** the user clicks a row checkbox
- **Then** the row becomes checked
- **And** the row pane opens
- **And** the row becomes the focused row
- **And** the pane renders every schema field with its schema-derived field component

Clicking row content does not check the row. The checkbox and its complete table cell are the row-selection hit area.

### Select rows individually

- **Given** one or more rows are checked
- **When** the user clicks another unchecked row checkbox without a range modifier
- **Then** that row is added to the checked-row set
- **And** it becomes the focused row
- **And** the pane header shows its position within the ordered selection

Clicking a checked checkbox removes that row. If the focused row is removed, focus moves to the nearest remaining checked row.
Removing the final checked row closes the row pane.

### Select a row range

- **Given** a prior checkbox interaction established a row-selection anchor
- **When** the user Shift-clicks another row checkbox
- **Then** every visible row between the anchor and target becomes checked
- **And** the target becomes the focused row
- **And** the pane header shows the target's position within the ordered selection, such as `2 / 4`

The selected-row order follows the active query order rather than click order. This keeps previous and next navigation
predictable. Range selection applies only to rows represented by the active table result.

## Cell selection scenarios

### Focus one cell

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

- **Given** a data cell is focused and the complete-row pane is closed
- **When** the user double-clicks that cell
- **Then** the schema-appropriate inline editor opens when the field supports inline editing
- **And** the cell remains focused
- **And** the row remains unchecked unless the user selected its checkbox separately

The Enter key offers an equivalent keyboard action when the table supports keyboard cell navigation. An unmodified double-click
inside a multi-cell selection replaces that selection with the target cell before editing.

While the complete-row pane is open, activating a cell in its focused checked row moves focus to the matching pane field.
Double-clicking another row does not select it, add it to pane navigation, or open an inline editor.

Field routing is schema-derived:

- primitive scalar and enum values use constrained inline controls
- JSON, Array, and Row values use the Floating widget's expanded code editor with Save and Cancel actions
- relation and binary values open the complete-row pane focused on their field
- timestamps use an inline calendar when that control is available
- generated, unsupported, and otherwise read-only values remain read-only in the grid

Cells do not open a separate inspection-only pane or hover card. Complete and alternate field representations remain available
through the complete-row pane.

### Select multiple cells

- **Given** one cell is focused
- **When** the user Command-clicks another data cell
- **Then** an inclusion starts when the target is outside the selection and an exclusion starts when it is inside
- **And** the interaction target becomes the anchor of the latest range operation
- **And** the side pane remains unchanged until the user starts an explicit operation

Control-click provides the equivalent modifier on platforms where Command is unavailable. Include and exclude operations compose
across rows and columns. Shift-click extends the latest range from its fixed anchor to the target across the displayed query rows
and data columns. Dragging across body cells moves the latest operation's focus corner.

### Operate on a multi-cell selection

- **Given** multiple cells are selected
- **When** the user right-clicks inside the selection
- **Then** the existing selection remains intact
- **And** the context menu offers copy or supported mutation operations for that selection

Right-clicking an unselected cell replaces the cell selection with that cell before opening the context menu.

Bulk editing is a separate explicit workflow rather than a read-only cell-inspection pane. A same-column selection can expose one
shared schema-derived editor for an explicit bulk operation. Large selections use summaries and incremental rendering rather than
mounting one expanded control per cell.

## Editing surfaces

Pane and inline editing use the same mutation model but are not presented simultaneously. Row checkbox selection opens the
complete-row pane. With the pane closed, cell double-click or Enter starts inline editing without requiring row checkbox selection
when the schema-derived field interaction supports it.
Relation and binary fields route to the complete-row pane, and unsupported read-only fields remain read-only in the grid.

Both surfaces consume the same provider-owned per-row draft, parsing, validation, dirty tracking, Apply, and Discard rules.

## Side-pane behavior

### Row pane

- The header identifies the focused row.
- Multiple checked rows show the focused row's position and total selection, such as `2 / 4`.
- Previous and next actions move focus through checked rows in active query order.
- The body renders all schema fields, including hidden table columns, using their field components.
- Clicking a cell in the focused checked row moves focus to that field's first available control and leaves the row pane open.
- Only the focused row is edited. A row action is not treated as a bulk action unless its label explicitly says so.
- Valid changed fields automatically enter the table's staged-change ledger without field or form confirmation.
- The pane has no per-row persistence action; `Apply changes` persists the normalized table ledger.
- Closing the pane preserves its valid pending fields and recoverable invalid input.
- Double-clicking a field in the focused row keeps the pane open and focuses that field. Double-clicking another row does nothing.
- If the final checked row is unchecked, the row pane closes.
- If checked rows remain, the nearest checked row becomes focused and remains represented in the pane.

### Cell activation and pane routing

- Double-click or Enter opens the Floating field editor for scalar and structured fields when the pane is closed, independently
  from row checkbox selection.
- Scalar Enter completes and moves down; Tab and Shift+Tab complete and move horizontally with row wrapping.
- Structured Enter inserts a newline, Tab and Shift+Tab indent or outdent, Cmd/Ctrl+Enter completes, and Escape closes.
- Completion and closure restore semantic grid focus without automatically opening another editor or discarding input.
- Relation and binary activation opens the complete-row pane and focuses the corresponding field.
- Generated and unsupported read-only fields do not open a mutation surface.

Pressing Escape follows progressive dismissal:

- with a row pane open, Escape closes the pane and unchecks its active row while preserving other checked rows
- clearing the final checked row closes selection-only widget state; staged changes keep the mutation widget available
- without a pane open, Escape clears cell selection, cell focus, and column focus

After the row pane closes, each remaining checked row stays individually toggleable through its own checkbox. The header checkbox is the
bulk clear control; it is not the only route to unchecking rows.

Pane dismissal preserves valid staged fields and recoverable invalid input while clearing the active checked row. Staged changes
are removed only through entry removal or the table-scoped `Discard` action.

## Mutation draft behavior

Pane and inline editors consume the same per-row mutation model:

- The source row captured when editing starts is stored separately from sparse field overlays.
- Returning a field to that source value removes the field from the dirty set.
- Removing a staged update from affected-row review resets the corresponding provider-owned row draft, including mounted pane
  fields, to the captured source.
- Invalid input retains its raw form and validation error but cannot enter a mutation patch.
- Apply sends valid sparse fields only rather than reconstructing the complete row.
- Mutation failure preserves the draft.

Insert fields distinguish `omitted`, `null`, `valid`, and `invalid`. Omitted fields are absent from the payload so stored defaults
can apply. Explicit NULL remains a separate user choice. The insert pane persists a valid row directly through `Insert`; `Discard`
closes without persistence, and `Insert more` resets and keeps the form open after each successful insert. Insert drafts do not
enter the pending ledger.

Provider-owned edit drafts survive movement between fields and pane dismissal within one mounted table view. Several rows can retain
isolated staged updates and deletions. Review remains available while the pane is open. Delete requires confirmation before selected
rows enter the staged state. `Apply changes` is the persistence boundary for staged updates and deletions; complete-row inserts
persist directly from the insert pane. A successful Apply clears selection, closes the pane, and removes the widget.

Affected-row review presents each mutation kind as an accordion trigger. Every expanded operation section contains a semantic list
with its own scroll area, while the staged summary and Apply controls remain fixed below the review.

## Column selection and bulk editing

Column selection is an advanced, explicit action rather than the result of a normal header click.

- **Given** the user right-clicks a data-column header
- **When** the header context menu opens
- **And** the user chooses a scoped column operation
- **Then** the application selects the cells in the command's declared scope
- **And** the selected operation opens its own review or editing surface when required

A normal header click remains available for column focus, dragging, resizing, and sorting behavior. The context action avoids an
accidental large selection.

Activating a column header clears cell focus and cell selection before the column receives its active treatment.

The command must state its scope. A column operation cannot silently mean both visible rows and every matching row.
Appropriate scoped commands include:

- `Copy visible column cells`
- `Edit this column for matching rows…`

Visible cells are a table selection. Every matching row is a query-backed bulk operation that can include unloaded rows and
requires separate confirmation.

Same-column selection enables one schema-derived editor with an `Apply to N selected cells` action. Each write remains a partial
row patch for that field. An all-or-nothing operation requires verification of the installed Jazz transaction API and the
generic dynamic table proxy before the UI promises atomic behavior.

## Row and field information

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
- position within checked rows
- position within a page
- position within a filtered and sorted query when a page offset is known

The application cannot treat that position as stable identity or promise an exact table total without a count query. Live data,
sorting, and filtering can change query position. Row ID remains the stable identity.

Use labels such as `2 / 4 selected`, `Row 8 in current results`, or a page-offset position when that scope is known. Do not imply
that `Row 8` is an immutable database position.

## Visual behavior

- Checked rows use the selected-row background.
- The focused checked row adds a distinct blue focus edge; adjacent checked rows retain only the selected background.
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
- individual row selection and Shift range selection
- one focused row within checked rows
- single-click cell focus without pane activation
- double-click inline editing activation
- pane and inline editing over one provider-owned update controller without simultaneous edit surfaces
- table-scoped pending updates and deletions with one Apply action, plus direct complete-row insertion
- Command/Control additive multi-cell selection across rows and columns
- Shift rectangular cell-range selection across visible rows and data columns
- selection state independent from pane state
- stable row-ID and column-ID targets
- schema-derived row and inline editor presentation
- structured editing in the Floating widget's expanded code editor
- relation and binary activation into the complete-row pane
- side-pane header, scrolling body, fixed footer, and accessible dismissal

## Recorded advanced behavior

The following behavior is part of the product direction but is outside the foundation slice:

- selected-cell context menus with explicit copy and mutation commands
- bulk-operation review and editing surfaces
- header context menu with scoped column-selection commands
- query-backed bulk editing across matching rows
- transactional or batched mutation semantics
- complete keyboard grid navigation

## Open decisions

- The exact visible-page versus loaded-result scope of column-selection operations.
- The error and recovery presentation for partial bulk-write failure when atomic writes are unavailable.
