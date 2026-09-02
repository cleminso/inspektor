# Swimlane Timeline

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [02/09/26] Compact snapshot columns

- [x] Render timeline header capture times without redundant day-period labels while retaining them in details.
- [x] Reduce snapshot header and body cells to 100px while keeping them aligned.

### [02/09/26] Sticky timeline header

- [x] Keep the complete timeline header sticky at the vertical scroll start while lane and track content scrolls below it.

### [02/09/26] Structural border ownership

- [x] Keep `bodyCell` responsible only for inline column dividers.
- [x] Keep horizontal dividers on header, lane-heading, and track cell treatments so row structure does not depend on populated snapshot cells.
- [x] Add a flexible presentational continuation column so horizontal dividers fill short timelines while fixed snapshot columns remain 100px.
- [x] Use the subtle surface color across lane-heading rows.

### [01/09/26] Timeline column geometry

- [x] Keep table and group label columns fixed at 240px and sticky at the horizontal scroll start.
- [x] Keep lane headings fixed at the horizontal scroll start and continue their bottom divider across snapshot columns.
- [x] Keep every snapshot header and body cell fixed at 100px.
- [x] Size the timeline from its columns so short timelines remain left-aligned instead of stretching across the viewport.
- [x] Let the root fill its workspace while the intrinsic table remains left-aligned, without outer top or inline borders.

### [31/08/26] Spanning lane heading

- [x] Render each lane heading as one cell spanning the complete table row.
- [x] Keep one uninterrupted bottom border and no internal vertical dividers in lane heading rows.

### [31/08/26] Lane heading divider

- [x] Keep the lane heading cell borderless on its inline end while preserving snapshot-cell dividers.

### [31/08/26] Lane-row grid continuity

- [x] Keep borders on table cells rather than disclosure or activity triggers.

### [31/08/26] Border and track-label revision

- [x] Put the left and right borders on the table root.
- [x] Put the top and bottom borders on header cells and one shared bottom border on body cells.
- [x] Show up to 12 track-label characters with an ellipsis while preserving the complete string in the accessible name and tooltip.
- [x] Use SHA-256-shaped example group keys without validating or depending on their format in the generic component.

### [31/08/26] Visual treatment revision

- [x] Place the disclosure indicator immediately after the lane label while keeping suffix metadata at the trailing edge.
- [x] Keep selected state semantic without adding Data Grid selection fill or border styling.
- [x] Treat every snapshot column consistently without a special final-column label or surface.
- [x] Keep unknown state semantic without rendering a gray activity segment.
- [x] Use a private Swimlane Timeline activity-indicator color role instead of a global interface semantic.

### [31/08/26] Semantic composition

- [x] Keep one native table, column group, header, and lane row groups inside one horizontal Scroll Area.
- [x] Compose headings, lanes, tracks, and snapshot cells without timeline data configuration or Jazz types.

### [31/08/26] Interaction

- [x] Support controlled and uncontrolled lane expansion.
- [x] Hide track rows without hiding the lane heading row.
- [x] Use native buttons for lane disclosure and active-cell activation.

## Open product work

### [31/08/26] Track details

- [x] Show the complete group key in the product-owned side pane when the Queries surface is integrated.

### [31/08/26] Product integration

- [x] Compose the component in a product-owned Queries surface when its data model and collection behavior are defined.

## Work outside the foundation scope

### [31/08/26] Data ownership

- [x] Exclude Jazz polling, query construction, snapshot collection, and Queries-page composition.
- [x] Exclude timeline virtualization until measured product data requires it.

## Settled interaction decisions

### [02/09/26] Short timeline continuation

- [x] Fill unused inline space with an accessibility-hidden continuation column instead of stretching label or snapshot columns.

### [01/09/26] Sticky lane headings

- [x] Split populated lane headings into a sticky 240px row-group header and a presentational continuation cell so the label remains fixed while the bottom divider spans the timeline.

### [31/08/26] Uniform snapshot columns

- [x] Express snapshot recency through heading content rather than a dedicated latest state.

### [31/08/26] Table and disclosure semantics

- [x] Keep lane headings and tracks in one native `tbody` per lane so every row shares the same table columns.
- [x] Do not compose the existing Accordion around lane rows because its item and panel wrappers cannot preserve valid table children.
- [x] Allow selection and activation only on active cells.

## Open design decisions

### [31/08/26] None

- [x] No unresolved foundation decisions.

## Validation checklist

### [02/09/26] Vertical header scrolling

- [x] Confirm the header remains aligned to the Scroll Area viewport start after 160px of vertical scrolling through a 992px timeline.

### [02/09/26] Structural borders

- [x] Confirm header and track rows render a continuation cell even without snapshots.
- [x] Confirm the 1112px documentation surface keeps one 240px label column, three 100px snapshot columns, and one 572px continuation column.
- [x] Confirm each visible row divider spans the complete surface and `bodyCell` contributes only inline borders.
- [x] Run the focused component test, changed-file lint, design-system typecheck, build, and package test suite.

### [01/09/26] Column sizing and sticky labels

- [x] Confirm a three-snapshot timeline renders a 540px intrinsic surface with one 240px label column and three 100px snapshot columns inside a 412px root.
- [x] Confirm header, lane, and track labels remain aligned to the 41px viewport start after 160px of horizontal scrolling.
- [x] Confirm lane headings retain a 240px sticky label and a same-height continuation cell with matching 1px bottom borders after horizontal scrolling.
- [x] Confirm the table has no inline borders and its header has no top border.
- [x] Run the focused component test and changed-file StyleX lint.
- [x] Run the design-system package test suite, lint, typecheck, and build.
- [x] Verify the intrinsic surface, sticky labels, lane divider, and clean console in light and dark browser rendering.

### [31/08/26] Component and documentation

- [x] Run the focused component test.
- [x] Run changed-file StyleX and oxlint checks.
- [x] Run the design-system package test suite, typecheck, and build.
- [x] Generate and check prop metadata.
- [x] Run documentation lint, typecheck, and build.
- [x] Verify light and dark rendering, collapse, and keyboard activation in the built documentation app.
- [ ] Run the documentation test suite. Blocked by the existing Tooltip provider default metadata mismatch.
