# Data Grid style model

This document defines how Data Grid geometry, selection, active targets, focus, resizing, and dragging use separate visual channels.

## Table of contents

The sections cover state vocabulary, rendering and edge ownership, visual precedence, interaction states, tokens, implementation, and validation.

- [Purpose](#purpose)
- [Interaction vocabulary](#interaction-vocabulary)
- [Visual examples](#visual-examples)
- [Rendering model](#rendering-model)
- [Edge ownership](#edge-ownership)
- [Visual channels](#visual-channels)
- [State presentation](#state-presentation)
- [State composition](#state-composition)
- [Resize presentation](#resize-presentation)
- [Focus and keyboard interaction](#focus-and-keyboard-interaction)
- [Selection presentation](#selection-presentation)
- [Drag presentation](#drag-presentation)
- [Table boundaries and spanning content](#table-boundaries-and-spanning-content)
- [Tokens](#tokens)
- [Accessibility](#accessibility)
- [TanStack Table boundary](#tanstack-table-boundary)
- [Implementation guidelines](#implementation-guidelines)
- [Validation scenarios](#validation-scenarios)
- [References](#references)

## Purpose

This note defines the visual model for Data Grid gridlines, state fills, focus rings, active-cell rings, resize indicators, and drag presentation.

The goal is to keep borders crisp and continuous while active, selected, focused, resizing, and dragging states combine. The model applies to default and compact densities, sticky headers, reordered columns, light and dark themes, and spanning message or expanded rows.

The central rule is:

> Structural borders describe table geometry. Backgrounds describe membership. State rings describe the current target and cover shared seams. Outlines describe keyboard focus. A resize indicator describes the boundary being manipulated.

These responsibilities must remain separate even when their colors are similar.

## Interaction vocabulary

The visual states have distinct meanings:

- **Active column:** the column selected as a product scope. It includes the header and visible body cells.
- **Focused header:** the header that owns DOM focus and receives keyboard commands.
- **Reorder target:** the focused header moved with Shift+ArrowLeft or Shift+ArrowRight.
- **Selected cell:** a member of the resolved TanStack cell-range selection.
- **Active cell:** the anchor of the latest TanStack range operation. An exclusion anchor can be active without being selected.
- **Selected row:** a row selected through TanStack row-selection state.
- **Active row:** the current row-level product target.
- **Staged-update cell:** a cell whose valid sparse field overlay will be included in Apply.
- **Staged-deletion row:** a complete row whose deletion will be included in Apply.
- **Resize target:** the column boundary under resize hover, keyboard focus, or active resizing.
- **Drag source:** the column represented by the source cells and detached drag overlay.

Active, selected, and focused are not synonyms. Selection can contain several cells, but only one cell is active. A column can be active without its header being focused. Keyboard focus must remain visible even when it overlaps another active state.

## Visual examples

These examples show how the visual channels combine without changing structural grid geometry.

### Active header with keyboard focus

An active header used for Shift+Arrow column movement combines two states:

- Active-column fill communicates column scope.
- A one-pixel seam-aligned perimeter communicates the active header.
- A complete two-pixel seam-aligned focus ring communicates the keyboard target.

The full focus ring is required because the keyboard command acts on the header cell itself. It upgrades the active perimeter through the same outline channel rather than stacking another stroke.

After a keyboard reorder, focus follows the same column identity at its new visual position. The ring must not remain on the previous position.

### Active cell in the grid

The active cell combines:

- Selection fill when it belongs to the selection.
- A complete seam-aligned active ring identifying the current cell and selection anchor.
- A focus-visible outline when the cell owns keyboard focus.

Other selected cells use fill without complete rings. This prevents a selected range from becoming a matrix of heavy blue rectangles.

### Active column

An active column combines:

- A stronger header fill.
- A complete one-pixel seam-aligned header perimeter.
- A subtle body-cell fill across visible rows.

The perimeter supplies a clean top and inline-start edge without changing structural border ownership. Body cells retain neutral structural gridlines. The column state does not turn every body-cell edge blue.

## Rendering model

The table uses semantic table markup with `border-collapse: separate`, zero border spacing, fixed layout, and sticky header cells.

This is the preferred foundation because each cell can own deterministic edges. Collapsed borders are not appropriate for interactive state coloring because browser border-conflict resolution would decide which adjacent border wins.

The rendering model has five layers:

1. Cell background.
2. Permanent structural gridlines.
3. Cell-local active or selection decoration.
4. Cell content and interactive controls.
5. Focus, resize, and drag emphasis.

No table-wide measured gridline overlay is needed. Cell-local rendering naturally follows scrolling, sticky positioning, column sizing, and drag transforms.

## Edge ownership

Every shared edge must have one permanent owner:

- A cell owns its inline-end vertical gridline.
- A cell owns its block-end horizontal gridline.
- The header cells own the header-to-body separator.
- A table frame, when present, belongs to the table or viewport rather than an active cell.
- Spanning cells own the boundary of their complete span.

An adjacent cell must not paint the same neutral edge. State changes may recolor an owned edge, but they must not transfer edge ownership to a child or neighbor.

The active header owns and recolors its structural top border because an outward outline can be clipped at the table viewport. Its inline-start stroke remains state decoration painted above the neighboring seam. Its own block-end and inline-end border widths remain reserved, but their neutral colors become transparent while the perimeter is active.

Active headers and cells receive a local stacking layer so their state rings cover the neighboring inline-end or block-end border. This changes paint order without transferring structural ownership.

Border width remains constant across all states. Adding, removing, or widening a structural border can alter table geometry and produce alignment changes.

Use logical edge properties when directionality matters. The ownership rule is inline-end rather than always physical right.

## Visual channels

Each channel communicates one kind of information.

| Channel           | Meaning                             | Examples                                                    |
| ----------------- | ----------------------------------- | ----------------------------------------------------------- |
| Structural border | Table geometry                      | Header and body gridlines                                   |
| Background        | Membership, scope, or staged intent | Active column, selected row, selected cells, staged updates |
| State ring        | Current product target              | Active header and cell                                      |
| Focus outline     | Current keyboard target             | Focused header or cell                                      |
| Emphasized edge   | Direct boundary manipulation        | Resize hover and resizing                                   |
| Detached frame    | Moving representation               | Column drag overlay                                         |

States should combine across channels instead of overriding unrelated properties. Competition should occur only between states using the same channel.

## State presentation

The matrix assigns each grid state a background, structural-border treatment, active ring, and focus outline.

| State                | Background              | Structural border                              | Active ring                       | Focus outline              |
| -------------------- | ----------------------- | ---------------------------------------------- | --------------------------------- | -------------------------- |
| Default header       | Neutral header          | Neutral bottom and inline-end                  | None                              | None                       |
| Active-column header | Active header           | Active bottom, neutral inline-end              | One-pixel seam-aligned perimeter  | Two pixels when focused    |
| Focused header       | Preserve state fill     | Preserve geometry                              | None                              | Complete seam-aligned ring |
| Resize-hover header  | Preserve state fill     | Active inline-end                              | None                              | Preserve header focus      |
| Default cell         | Page surface            | Neutral bottom and inline-end                  | None                              | None                       |
| Active-column cell   | Subtle column fill      | Neutral                                        | None                              | When focused               |
| Selected-row cell    | Selected-row fill       | Neutral                                        | None                              | When focused               |
| Selected cell        | Selected-cell fill      | Neutral                                        | None                              | When focused               |
| Staged-update cell   | Warm amber pending fill | Neutral                                        | Non-layout-shifting staged marker | Preserve cell focus        |
| Active cell          | Active-cell fill        | Owned bottom and inline-end colors transparent | Complete seam-aligned ring        | Two pixels when focused    |
| Active row           | Row-level emphasis      | Neutral                                        | No cell rings by default          | Per focused cell           |
| Staged-deletion row  | Danger row fill         | Preserve geometry                              | Danger leading marker             | Per focused Undo action    |

The active cell may visually subsume selected-cell, selected-row, and active-column backgrounds. It must not remove structural gridlines or keyboard focus.

## State composition

Background precedence is:

1. Staged deletion for the complete row.
2. Active cell.
3. Selected cell.
4. Staged-update cell.
5. Selected row.
6. Active column.
7. Default surface.

The staged-update marker is independent from background precedence and remains visible when active or
selected presentation replaces the warm pending fill. A row cannot render staged-update and
staged-deletion presentation simultaneously.

Stroke precedence is:

1. Focus-visible for the actual focused element.
2. Active-cell ring.
3. Row-level emphasis.
4. No semantic stroke.

Resize emphasis is a separate edge channel:

1. Active resizing.
2. Resize-handle focus.
3. Resize-handle hover.
4. Neutral gridline.

Drag presentation may suppress resize emphasis, but it must preserve structural geometry.

When active and focus strokes use the same color and geometry, they must resolve to one visible ring rather than two coincident strokes. Focus remains the semantic owner of that visible ring while the element is focus-visible.

An active-column header or cell uses a one-pixel seam-aligned outline. Focus-visible upgrades that same outline to two pixels. Active elements paint above adjacent cells, preserve structural border widths, and make their owned bottom and inline-end border colors transparent so the ring remains a single clean stroke.

## Resize presentation

The header cell permanently owns its inline-end border.

The resize handle owns:

- The larger pointer and touch hit area.
- The resize cursor.
- Mouse and touch event forwarding.
- Keyboard focus when keyboard resizing is supported.

The resize handle does not own the visible one-pixel table edge. On hover or active resizing, the header cell recolors its existing inline-end border from neutral to active. This lets the active vertical edge meet the header bottom border through native border-corner painting.

An active header normally keeps its owned inline-end border transparent beneath the one-pixel perimeter. Resize hover, resize focus, or active resizing recolors that border blue, creating a deliberate stronger manipulation edge without adding a child-painted line.

Do not make the header border transparent and replace it with a child inset shadow. The child and parent occupy different paint boxes, so their vertical and horizontal strokes can leave a gap at the corner.

If the design requires a resize line wider than the structural border, use a header-owned decoration layer. Keep it cell-local and align it deliberately with the header separator. Do not position a full-column guide from TanStack offsets unless rendered widths are guaranteed to equal TanStack column sizes.

## Focus and keyboard interaction

Focus styling belongs to the element that owns DOM focus.

- A focused active header receives a complete seam-aligned focus ring.
- A focused active cell receives a complete seam-aligned focus ring.
- A focused resize handle receives its own visible focus treatment.
- Interactive descendants do not rely on the parent cell's focus ring.

The full header ring is retained during Shift+Arrow column reordering because it identifies the keyboard command target. Active-column fill remains visible beneath it.

The focus ring must remain visible against active and selected backgrounds. It must also survive forced-colors mode; do not rely only on `box-shadow` for keyboard focus.

Active focus rings straddle shared seams and use an explicit stacking layer so adjacent cells do not cover them. Viewport and table-edge clipping remain validation requirements.

## Selection presentation

Selection uses fill to communicate membership:

- Selected rows paint the background of their cells.
- Selected cells paint their own selection background.
- An active column paints the header and represented body cells, then adds one seam-aligned header perimeter.
- The active cell adds one complete ring over its fill.

An arbitrary or rectangular multi-cell selection does not add a full ring to every selected cell. If a spreadsheet-style range perimeter is introduced, perimeter edges are derived from visible adjacency:

- Paint a top edge only when the selected cell above is absent.
- Paint an inline-end edge only when the next selected cell is absent.
- Paint a bottom edge only when the selected cell below is absent.
- Paint an inline-start edge only when the previous selected cell is absent.

Hidden and reordered columns affect visual adjacency. Row and column IDs remain the identity source.

## Drag presentation

Column drag presentation has separate source and overlay responsibilities:

- The source remains structurally present so table geometry does not shift.
- Source content may be subdued.
- Resize emphasis is suppressed during dragging.
- Structural gridlines remain stable.
- The detached overlay uses a deliberate complete frame or a deliberate header underline.
- The overlay has an explicit drag stacking layer above sticky headers.

The overlay must not accidentally inherit a partial combination of active-header and resize styles.

## Table boundaries and spanning content

The final column and final row follow an explicit table-frame policy. The implementation must not depend on a neighboring cell to complete an outer edge.

Loading, empty, and expanded rows use spanning cells. These cells represent one region and therefore do not reproduce internal vertical column gridlines. Their outer boundaries align with the table frame and the rows around them.

Grouped sticky headers require explicit block offsets per header row. All grouped rows must not share the same sticky offset.

## Tokens

Semantic tokens express intent rather than individual component mechanics.

The token model should distinguish:

- Neutral header gridline.
- Neutral body gridline.
- Active-column header surface.
- Active-column body surface.
- Selected-row surface.
- Selected-cell surface.
- Active-cell surface.
- `stagedChangeColors` background and marker roles linked through staged-update cell roles.
- Staged-deletion row surface and marker.
- Active-column edge.
- Active-cell ring.
- Keyboard-focus ring.
- Resize edge.

Different semantic states may intentionally share values, but they remain separate roles. If active column, selected row, selected cell, and active cell all use the same surface value, their non-fill indicators must preserve the hierarchy.

Line widths remain constrained semantic or value tokens. Interactive states must not introduce arbitrary fractional hairlines.

## Accessibility

Accessibility depends on visible focus, non-color cues, forced-color support, operable resize controls, and preserved table semantics.

- Keyboard focus is visible independently from selection and active state.
- Focus and active strokes maintain sufficient contrast against their immediate backgrounds.
- Critical distinctions do not rely on color alone.
- Staged updates use review and context-menu semantics in addition to their warm color treatment.
- Forced-colors presentation retains focus and active state through borders or outlines because box shadows can be removed.
- The resize button needs a visible focus state and a keyboard resizing contract before it is considered fully keyboard operable.
- Native table semantics remain unless the component implements the complete keyboard and ARIA contract of an interactive grid.

Visual state attributes do not replace semantic state. Row selection remains exposed through the appropriate selection semantics, and interactive controls retain accessible names.

## TanStack Table boundary

TanStack Table owns the logical table models and interaction state. [[packages/design-system/src/components/dataGrid/dataGrid.tsx#DataGrid]] owns their reusable presentation.

TanStack Table owns:

- Row, cell, header, and header-group models.
- Column size state and constraints.
- Resize gesture state and event handlers.
- Column order, column pinning, and sorting state.
- Logical column offsets and total sizes.

The Data Grid owns:

- Semantic markup.
- Rendered widths and table layout.
- Gridline ownership.
- Active, selected, focused, resizing, and dragging presentation.
- Sticky positioning and stacking.
- Pinned-region stacking and logical sticky offsets.
- Resize and drag hit areas.
- Region-constrained column reorder gestures that update TanStack column-order or column-pinning state.

TanStack state identifies what is happening; it does not define how borders should be painted.

The table can stretch beyond the sum of TanStack column sizes. A detached guide based on `column.getStart()` or `table.getTotalSize()` is safe only when those logical values match rendered geometry. Cell-owned borders avoid this synchronization requirement.

## Implementation guidelines

These rules preserve edge ownership and make overlapping interaction states resolve predictably.

1. Preserve one permanent owner for every structural edge.
2. Keep structural border width stable in every state.
3. Recolor an owned edge instead of replacing it with a child-painted edge.
4. Use backgrounds for selected sets and active scope.
5. Use a one-pixel seam-aligned perimeter for an active-column header without adding structural top or inline-start borders.
6. Use one seam-aligned ring for the active cell.
7. Use an outline for the actual focus-visible element.
8. Upgrade the active-header perimeter through the same outline channel when it becomes focus-visible.
9. Prevent active and focus rings from stacking into an unintended thicker stroke.
10. Keep resize hit-area geometry independent from resize-line geometry.
11. Keep drag decoration independent from structural borders.
12. Use cell-local decorations rather than measured table-wide overlays.
13. Derive range perimeter edges from visible adjacency when range outlines are required.
14. Use semantic tokens and explicit state precedence.
15. Use logical edge properties where directionality matters.
16. Preserve native table semantics and valid table descendants.
17. Raise active headers and cells above adjacent cells so state rings cover neutral shared seams.
18. Preserve border widths but make active elements' owned bottom and inline-end border colors transparent beneath the state ring.
19. Recolor the active header's owned inline-end border only for resize hover, resize focus, or active resizing.
20. Keep the active header's structural top border blue so viewport clipping cannot remove the top edge.
21. Paint pinned headers and body cells above scrolling active or selected cells while keeping portalled popups and drag overlays above the pinned region.

## Validation scenarios

Validation combines header, cell, layout, and rendering-environment scenarios.

### Header states

Header scenarios cover neutral, active, focused, resizing, reordered, and dragged columns.

- Default header between two neutral columns.
- Active-column header without DOM focus.
- Active-column header with keyboard focus.
- Focused header moved through Shift+ArrowLeft and Shift+ArrowRight.
- Active header with resize hover.
- Focused active header with resize hover.
- Header while actively resizing.
- Last-column resize hover.
- Drag source, drop target, and detached overlay.

### Cell and selection states

Cell scenarios combine active, selected, focused, row, and column states.

- Active cell between neutral cells.
- Active cell inside an active column.
- Active cell inside a selected row.
- Active cell inside a multi-cell selection.
- Selected cells without an active ring.
- Focused cell that is not the controlled active cell.
- Active row combined with selected cells.

### Layout states

Layout scenarios cover density, scrolling, boundaries, spanning rows, visibility, and grouped headers.

- Default and compact density.
- Sticky header during horizontal and vertical scrolling.
- Final row and final column boundaries.
- Loading and empty spanning cells.
- Expanded spanning rows.
- Reordered and hidden columns.
- Grouped headers when supported.

### Rendering environments

Rendering checks cover themes, zoom, forced colors, and supported text directions.

- Light and dark themes.
- Browser zoom with fractional device-pixel mapping.
- Forced-colors mode.
- Left-to-right and right-to-left direction when supported.

Visual regression coverage should include border corners and intersections. Behavioral tests should separately verify state attributes, focus transfer, resize state, and column identity after keyboard or pointer reordering.

## References

These source files and TanStack guides define the implementation and upstream behavior referenced by this model.

- [[packages/design-system/src/components/dataGrid/dataGrid.tsx#DataGrid]]
- `packages/design-system/src/components/dataGrid/dataGrid.styles.ts`
- `packages/design-system/src/components/dataGrid/dataGridReorder.tsx`
- `packages/design-system/src/tokens/semantics.stylex.ts`
- [[apps/web/src/features/tables/grid/useTableGrid.ts#useTableGrid]]
- [TanStack Table data guide](https://tanstack.com/table/latest/docs/guide/data)
- [TanStack Table column sizing guide](https://tanstack.com/table/latest/docs/guide/column-sizing)
- [TanStack Table column sizing API](https://tanstack.com/table/latest/docs/api/features/column-sizing)
- [TanStack Table column ordering guide](https://tanstack.com/table/latest/docs/guide/column-ordering)
- [TanStack Table column pinning guide](https://tanstack.com/table/latest/docs/framework/react/guide/column-pinning)

The product interaction model is documented in [[lat.md/tableExplorerBehaviors#Table Explorer selection and pane behavior]].
