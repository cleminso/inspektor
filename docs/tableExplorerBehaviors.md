# Table Explorer selection and pane behavior

## Table of contents

- [Purpose](#purpose)
- [Product boundary](#product-boundary)
- [Terminology](#terminology)
- [Behavior model](#behavior-model)
- [Row selection scenarios](#row-selection-scenarios)
- [Cell selection scenarios](#cell-selection-scenarios)
- [Editing preference and surfaces](#editing-preference-and-surfaces)
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

The foundation is a read-first `DataTable` with controlled cell-selection primitives. Opening complete multi-cell selections,
column selection, and bulk cell editing cross the product boundary into `DataGrid` behavior. The richer behavior may reuse
DataTable rendering and schema-derived components without making the record-oriented DataTable API ambiguous.

The Inspector remains schema-driven. Selection behavior is generic and does not depend on generated table-specific code.

## Terminology

- **Checked row**: a row included through its checkbox. Checked rows form the row-selection set.
- **Focused row**: the checked row represented in the side pane. Only one checked row is focused.
- **Selected cell**: a cell included in the cell-selection set.
- **Focused cell**: the cell that receives the strongest focus treatment and acts as the cell-selection anchor.
- **Row selection**: checked row IDs plus the focused row ID and checkbox-range anchor.
- **Cell selection**: selected row/column targets plus the focused cell. A selection can contain cells from several columns.
- **Pane target**: the explicit row or cell selection presented in the side pane.
- **Editing preference**: the workspace-level user setting that selects pane or inline editing.
- **Row draft**: the latest live source row plus dirty field overlays, raw input, parsed values, and validation state.
- **Query position**: a row's position in the active filtered and sorted result, not a stable row identity.

## Behavior model

Selection and side-pane presentation are separate state.

- A cell can be focused without opening the side pane.
- Multiple cells can be selected before the user chooses `Open selection`.
- Row selection and cell selection use stable row IDs and column IDs rather than visual coordinates.
- Row and cell selections can coexist. Opening one selection changes the pane presentation without silently destroying the
  other selection.
- Column reorder, visibility, sorting, filtering, and pagination must not reinterpret stored coordinates as different cells.

The side pane has these presentation modes:

- `closed`: no pane target
- `insert`: schema-driven row insertion
- `rows`: checked row IDs plus one focused row
- `cells`: one or more selected cells from one or more columns

Pane precedence is explicit:

- a row-checkbox interaction opens `rows`
- a cell double-click opens `cells`
- `Open selection` opens `cells`
- the insert action opens `insert`
- a single cell click changes cell focus without changing pane mode

Opening one pane mode does not destroy the stored row or cell selection owned by another mode.

Selection belongs to the represented query result:

- changing the filter, sort, page, table, or schema clears row and cell selections
- reordering columns preserves selected cells because selection uses column IDs
- hiding a selected column removes its cells from the selection
- loading additional rows does not implicitly add their cells to an existing selection

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

### Open one cell

- **Given** one cell is focused
- **When** the user double-clicks that cell
- **Then** the cell pane opens
- **And** the pane renders the schema-derived component for that cell
- **And** the cell remains focused

The Enter key should offer an equivalent keyboard action when the table supports keyboard cell navigation.

In pane mode, double-click or Enter opens the cell or row editing flow in the side pane. In inline mode, the same actions start
inline editing when the field supports it and otherwise open the pane fallback. Neither mode adds a hover card.

An unmodified double-click inside a multi-cell selection replaces that selection with the target cell and opens only that cell.
Opening the complete multi-cell set requires the explicit `Open selection` action.
Double-clicking the same cell while its cell pane is open closes the pane, clears the cell selection, and removes cell focus.
Double-clicking a different cell retargets the open pane to that cell.

### Select multiple cells

- **Given** one cell is focused
- **When** the user Command-clicks another data cell
- **Then** the target cell is added to or removed from the cell-selection set
- **And** the last included cell becomes focused
- **And** the side pane remains unchanged until the user explicitly opens the selection

Control-click provides the equivalent modifier on platforms where Command is unavailable. Additive selection works across rows
and columns like selecting several objects on a canvas. Shift-click selects the rectangular range between the anchor and target
across the visible query rows and data columns.

### Open a multi-cell selection

- **Given** multiple cells are selected
- **When** the user right-clicks inside the selection
- **Then** the existing selection remains intact
- **And** the context menu offers `Open selection`
- **When** the user chooses `Open selection`
- **Then** the cells pane opens with the complete selected-cell set

Right-clicking an unselected cell replaces the cell selection with that cell before opening the context menu.

The pane groups selected cells by column. Each column section identifies its schema field and contains the selected cells for
that field in active query row order. Each cell identifies its row, such as `Row 8 · room_id`; numeric coordinates may appear as
secondary information but are not treated as identity.

Large selections use column summaries and render cell controls incrementally rather than mounting every expanded control. A
same-column group can expose one shared schema-derived editor for an explicit bulk operation.

## Editing preference and surfaces

The Inspector workspace has one persisted user editing preference:

- `pane`: every editable row or cell uses the side pane.
- `inline`: supported writable cells edit in place; unsuitable fields use the side pane.

The preference is not scoped to a table, schema, branch, or connection. It is user interface state and is initially persisted in
localStorage. It changes the editing presentation but not mutation semantics.

Inline suitability is schema-derived. Structured, binary, generated, unsupported, and other fields without a safe compact editor
fall back to the pane. Selection remains separate from editing in both modes. Full inspection remains available through stable
pane and command interactions; cells do not expose details through hover cards.

Changing the preference cannot move a dirty draft between surfaces. The user must Save, Discard and continue, or keep the existing
preference and draft.

## Side-pane behavior

### Row pane

- The header identifies the focused row.
- Multiple checked rows show the focused row's position and total selection, such as `2 / 4`.
- Previous and next actions move focus through checked rows in active query order.
- The body renders all schema fields, including hidden table columns, using their field components.
- Clicking a cell in the focused checked row moves focus to that field's first available control and leaves the row pane open.
- Only the focused row is edited. A row action is not treated as a bulk action unless its label explicitly says so.
- The footer contains mutation and dismissal actions appropriate to the focused row.
- Save persists only the focused row's dirty-field patch.
- Cancel discards the focused row draft and unchecks that row.
- If Cancel removes the only checked row, the row pane closes.
- If checked rows remain, the nearest checked row becomes focused and remains represented in the pane.

### Cell pane

- One selected cell renders one schema-derived field section.
- Multiple selected cells render column sections containing their ordered cell controls.
- Cell sections reuse the existing schema-derived field rendering and type components without redesigning how individual field
  types look.
- Opening one cell focuses its first available schema-derived control, including read-only representations.
- The foundation cell pane is inspection-only and exposes reading, copy, relation-navigation, and dismissal actions.
- Cell editing, staged changes, review, confirmation, and save actions belong to the mutation behavior slice.

A clean cell pane follows additive or subtractive cell-selection changes. Closing a row or cell pane preserves its table
selection. A dirty pane does not silently retarget staged values to a different selection.

Pressing Escape follows progressive dismissal:

- with a pane open, Escape closes the pane and preserves its table selection
- without a pane open, Escape clears cell selection, cell focus, and column focus
- Escape does not uncheck rows; checked-row selection changes only through its checkbox controls

After the row pane closes, each checked row remains individually toggleable through its own checkbox. The header checkbox is the
bulk clear control; it is not the only route to unchecking rows.

Pane dismissal and pane Cancel are different actions. The close control and Escape dismiss a clean pane while preserving table
selection. Cancel discards the focused draft and removes its row from checkbox selection.

## Mutation draft behavior

Pane and inline editors consume the same per-row mutation model:

- The latest live source row is stored separately from dirty field overlays.
- Untouched fields follow live source changes.
- Dirty fields preserve staged values when their source fields change.
- Returning a field to its latest source value removes that field from the dirty set.
- Invalid input retains its raw form and validation error but cannot enter a mutation patch.
- Save sends valid dirty fields only rather than reconstructing the complete row.
- Mutation failure preserves the draft.
- A remote change to a dirty field may be reported without blocking save or replacing the staged value.

Insert fields distinguish `omitted`, `null`, `valid`, and `invalid`. Omitted fields are absent from the payload so stored defaults
can apply. Explicit NULL remains a separate user choice.

The active draft survives movement between fields in one row and switching between editable Details and read-only JSON
representations. Changing the focused row, query scope, table, schema, route, or editing preference requires Save, Discard, or
remaining on the active target when the draft is dirty. Relation navigation follows the same rule.

Inline editing stages cells into the containing row draft. Saving persists that row's complete dirty-field patch. Supporting more
than one retained row draft is an orchestration decision and does not change the per-row parsing or patch rules.

## Column selection and bulk editing

Column selection is an advanced, explicit action rather than the result of a normal header click.

- **Given** the user right-clicks a data-column header
- **When** the header context menu opens
- **And** the user chooses `Open column selection`
- **Then** the application selects the cells in the command's declared scope
- **And** the cells pane opens with that column selection

A normal header click remains available for column focus, dragging, resizing, and sorting behavior. The context action avoids an
accidental large selection.

Activating a column header clears cell focus and cell selection. If a cell pane is open, column activation closes it before the
column receives its active treatment.

The command must state its scope. `Open column selection` cannot silently mean both visible rows and every matching row.
Appropriate scoped commands include:

- `Open visible column cells`
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

Column sections in the cell pane follow visible table-column order. Cells inside each section follow active query row order. The
most recently selected cell is focused. Row IDs and column IDs remain authoritative; displayed positions are supporting metadata.

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
- double-click cell pane activation
- same-cell double-click dismissal with cell selection and focus clearing
- Command/Control additive multi-cell selection across rows and columns
- Shift rectangular cell-range selection across visible rows and data columns
- selection state independent from pane state
- stable row-ID and column-ID targets
- schema-derived row and cell presentation
- reuse of the existing schema-derived cell-type rendering without a field-component redesign
- inspection-only cell panes; row editing continues through the existing row editor
- side-pane header, scrolling body, fixed footer, and accessible dismissal

## Recorded advanced behavior

The following behavior is part of the product direction but is outside the foundation slice:

- selected-cell context menu with `Open selection`
- pane sections grouped by column with selected cells inside each section
- header context menu with scoped column-selection commands
- query-backed bulk editing across matching rows
- transactional or batched mutation semantics
- complete keyboard grid navigation
- inline editing controls and pane fallback activation

## Open decisions

- Whether pane and inline orchestration retain drafts for more than one row.
- The exact Save, Discard and continue, and remain-on-target presentation used when a dirty transition is requested.
- The inline field commit and cancellation triggers for Enter, Escape, blur, and pointer selection.
- The exact visible-page versus loaded-result scope of `Open column selection`.
- The error and recovery presentation for partial bulk-write failure when atomic writes are unavailable.
