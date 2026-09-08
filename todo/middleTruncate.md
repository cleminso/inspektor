# Middle Truncate

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist tracks responsive middle truncation for identity-bearing strings.

## Implemented foundation

[24/08/26]

- [x] Replace resize and font measurement with a CSS-owned leading ellipsis and trailing viewport.
- [x] Split values at a grapheme boundary once during render while keeping the complete accessible value.

[21/08/26]

- [x] Reduce preview state to one rendered string and share one measurement invalidation path for resize and font changes.
- [x] Keep native end ellipsis as a safety fallback until the measured middle preview is available.

[21/08/26]

- [x] Supersede balanced CSS clipping with measured leading and trailing grapheme segments around an explicit ellipsis.
- [x] Share one resize observer across instances and remeasure after the active document fonts resolve.

[06/08/26]

- [x] Replace per-instance resize observation and synchronous text measurement with balanced CSS clipping.
- [x] Render the complete accessible value on the first paint without waiting for width or font measurements.

[05/08/26]

- [x] Preserve balanced leading and trailing grapheme clusters around one ellipsis.
- [x] Recalculate the preview from the rendered width and inherited typography.
- [x] Keep the complete value available to assistive technology when the visible preview is truncated.

## Open product work

[05/08/26]

No open product work is recorded.

## Work outside the foundation scope

[05/08/26]

- [x] Keep the low-level truncation utility out of the design-system documentation navigation; demonstrate it through components that use it.

[05/08/26]

- [x] Keep tooltips and copy actions owned by the surface presenting the value.

## Settled interaction decisions

[24/08/26]

- [x] Supersede rendered-width measurement with browser-owned clipping so large grids do not synchronously measure every identity value.
- [x] Accept browser clipping at arbitrary glyph boundaries; the grapheme-safe split only protects the fixed midpoint.
- [x] Keep the browser-clipped preview at widths narrower than an ellipsis instead of measuring and hiding it.

[21/08/26]

- [x] Retain rendered-width measurement because truncation must never expose part of a grapheme.
- [x] Hide the visual preview when the available width cannot contain the ellipsis; keep the complete accessible value.

[21/08/26]

- [x] Omit a boundary grapheme completely when its rendered width does not fit; never expose a partial glyph beside the ellipsis.

[05/08/26]

- [x] Keep end truncation for prefix-oriented structured previews; reserve middle truncation for identity-bearing values.

[05/08/26]

- [x] Use end truncation for ordinary labels and prose.
- [x] Keep fixed actions and navigation indicators outside the truncation boundary.

## Open design decisions

[05/08/26]

No open design decisions are recorded.

## Validation checklist

[24/08/26]

- [x] Cover complete accessible output, grapheme-safe midpoint splitting, and the absence of layout measurement with focused tests.
- [x] Verify constrained clipping and complete accessible output in the production documentation build.
- [x] Verify design-system lint, typecheck, build, package tests, and generated documentation metadata.

[21/08/26]

- [x] Replace observer-lifecycle implementation tests with focused fit, complete-grapheme, minimum-width, font-change, resize, and accessible-value behavior coverage.

[21/08/26]

- [x] Supersede the observer-free clipping check with coverage for fitting values, measured grapheme retention, explicit ellipsis rendering, and resize recovery.

[06/08/26]

- [x] Verify balanced clipping at a constrained width without creating a `ResizeObserver`.
- [x] Verify relation-value composition and table row-ID rendering retain the complete accessible value.

[05/08/26]

- [x] Verify focused component tests, package checks, documentation generation, and browser resizing.
