# Swimlane Timeline

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

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

- [ ] Show the complete group key in the product-owned side pane when the Queries surface is integrated.

### [31/08/26] Product integration

- [ ] Compose the component in a product-owned Queries surface when its data model and collection behavior are defined.

## Work outside the foundation scope

### [31/08/26] Data ownership

- [x] Exclude Jazz polling, query construction, snapshot collection, and Queries-page composition.
- [x] Exclude timeline virtualization until measured product data requires it.

## Settled interaction decisions

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

### [31/08/26] Component and documentation

- [x] Run the focused component test.
- [x] Run changed-file StyleX and oxlint checks.
- [x] Run the design-system package test suite, typecheck, and build.
- [x] Generate and check prop metadata.
- [x] Run documentation lint, typecheck, and build.
- [x] Verify light and dark rendering, collapse, and keyboard activation in the built documentation app.
- [ ] Run the documentation test suite. Blocked by the existing Tooltip provider default metadata mismatch.
