# Design system documentation

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[10/09/26]

- [x] Keep highlighted source and its line-number gutter in the same horizontal scroll surface.

[10/09/26]

- [x] Restore the resizable `ShellLayout.LeftDock` and its collapse control on wider viewports.
- [x] Compose dock navigation with public `SidePanel` while `Tree` remains the sole scroll owner.
- [x] Keep full-width toggled navigation on narrow viewports without restoring the right details dock.
- [x] Keep the central shell view unpadded and apply `4xl` horizontal and `2xl` vertical padding to page surfaces.
- [x] Render content-height component previews with `2xl` padding and a source disclosure directly below.

[10/09/26]

- [x] Replace the prop-inspector page model with authored MDX documentation.
- [x] Keep React, Vite, TanStack Router, StyleX, and public `@inspektor/ds` source consumption.
- [x] Put documentation under `src/content` and routes under the default `src/routes` directory.
- [x] Migrate all 52 component routes to authored MDX pages and strict TSX scenarios.
- [x] Pair every executable scenario with its exact Vite `?raw` source.
- [x] Preserve meaningful staged examples without retaining inspector controls or source serializers.
- [x] Add constrained MDX element mappings and shared `ComponentPage` and `ComponentDemo` renderers.
- [x] Keep Colors and Typography as authored foundation pages.
- [x] Add a catalog contract test that requires every component to have a route, MDX page, and executable demo.

## Open product work

[10/09/26]

- [ ] Add an on-page table of contents if longer component pages demonstrate a navigation need.
- [ ] Add exhaustive generated API tables only if maintainers need a separate reference product.

## Work outside the foundation scope

[10/09/26]

- [x] Do not migrate the documentation application to Astro.
- [x] Do not add empty Anatomy, Accessibility, or Best practices sections.
- [x] Do not add generic property controls or regenerate examples from control state.
- [x] Do not hand-edit the generated TanStack route tree.

## Settled interaction decisions

[10/09/26]

- [x] Horizontal source scrolling moves line numbers and code together while the copy action remains visible.
- [x] The keyboard-scrollable source region shows a visible inset focus ring.
- [x] Keep vertical source scrolling on the page instead of introducing a nested code-block scrollbar.

[10/09/26]

- [x] Component source is collapsed by default and revealed directly below its preview.
- [x] The left navigation dock is resizable and collapsible on wider viewports.

[10/09/26]

- [x] Component pages are authored narratives with named scenarios, not generic prop inspectors.
- [x] MDX owns prose and ordering; strict TSX owns executable behavior and StyleX.
- [x] Pages may contain several examples when each teaches a distinct accepted usage.
- [x] Scenario source is copied from the executable TSX file.
- [x] Long source is keyboard-scrollable without widening the documentation page.
- [x] Source displays line numbers on wider viewports and hides the gutter on narrow viewports.
- [x] Navigation is hidden by default on narrow viewports and persistent beside content on wider viewports.
- [x] Narrow navigation returns focus to its toggle after route selection.
- [x] Generated API tables remain outside the maintainer-focused documentation model.

## Open design decisions

[10/09/26]

- None.

## Validation checklist

[10/09/26]

- [x] Cover shared horizontal scroll ownership with a focused structural test.
- [x] Verify pointer and keyboard scrolling on a wide viewport and contained overflow on a narrow viewport.
- [x] Verify highlighted source in both color schemes.
- [x] Verify the source region's focus indicator is visible and unclipped.

[10/09/26]

- [x] Catalog and focused interaction tests pass.
- [ ] Complete documentation app tests pass.
- [x] Documentation app formatting, lint, typecheck, and production build pass.
- [x] Generated TanStack routes include every registered component page.
- [x] Data Grid and DatePicker are verified on wide viewports in both color schemes.
- [x] Workspace Tabs and navigation behavior are verified on a narrow viewport.
- [x] Component pages render without inspector controls or generated API-reference blocks.
