# Scroll Area recipe

## Table of contents

- [Purpose](#purpose)
- [Choose the scroll owner](#choose-the-scroll-owner)
- [Required architecture](#required-architecture)
- [Axis contracts](#axis-contracts)
- [Thumb geometry](#thumb-geometry)
- [Layout integration](#layout-integration)
- [State and styling](#state-and-styling)
- [Testing boundary](#testing-boundary)
- [Browser validation](#browser-validation)
- [Failure modes](#failure-modes)
- [Completion checklist](#completion-checklist)

## Purpose

Use this recipe when implementing or changing `packages/design-system/src/components/scrollArea`, applying it to a bounded layout, or debugging scrollbar gutters, misplaced thumbs, nested scrolling, sticky headers, or content-width shifts.

This recipe supplements the installed Base UI documentation. Confirm the installed `@base-ui/react` version, then read Base UI's current Scroll Area API, handbook guidance, and tagged source before changing the wrapper. Do not copy stale anatomy or state assumptions from this file when the installed primitive differs.

## Choose the scroll owner

Identify the element that must retain native scrolling before writing styles.

- Use Inspektor `ScrollArea` for bounded surfaces where visible scrollbar chrome must overlay content without changing its width or height.
- Keep native scrolling on controls whose behavior already owns the scroll element and cannot accept Scroll Area composition.
- Use `axis="none"` when the Scroll Area must preserve its viewport and content structure while a nested editor owns scrolling.
- Give each axis one scroll owner. Do not make both a parent and child independently scroll the same content.
- Do not replace native scrolling or scroll physics with JavaScript.

## Required architecture

Preserve Base UI's compound relationship:

1. `Root` establishes the relative, clipped layout boundary.
2. `Viewport` is the native scroll owner and public ref target.
3. `Content` contains consumer content and establishes intrinsic dimensions.
4. `Scrollbar` parts are siblings of `Viewport`, not children that consume viewport layout space.
5. Each `Thumb` remains inside its matching oriented `Scrollbar`.
6. `Corner` is present only when both tracks need it.

The root and viewport must fill their allocated size while remaining shrinkable inside flex and grid layouts. Preserve `minHeight: 0` and `minWidth: 0` through every constraining ancestor. Hiding native scrollbar chrome must not change which element owns scrolling.

## Axis contracts

- `vertical`: hide horizontal overflow, retain native vertical scrolling, render only the vertical overlay track, and keep content width constrained to the viewport.
- `both`: retain native scrolling on both axes, render both overlay tracks and the corner, and allow intrinsic content width.
- `none`: hide viewport overflow, render no tracks, and preserve the same viewport ref and content structure.

Use an Inspektor-owned union for these modes. Do not expose independent booleans that permit contradictory axis combinations.

## Thumb geometry

Base UI calculates thumb size and applies scroll-position translation along the track's travel axis. Inspektor styles must not add alignment along that axis.

- A vertical scrollbar uses the default row flex direction. Center its thumb horizontally with `justifyContent`. Do not set `alignItems: center`, because that centers the thumb vertically before Base UI translates it.
- A horizontal scrollbar centers its thumb vertically with `alignItems`. Do not set `justifyContent: center`, because that centers the thumb horizontally before Base UI translates it.
- Keep movement-axis padding on the track as the only start and end inset.
- Let Base UI own thumb dimensions and translation variables. Do not recalculate thumb position in React.

The invariant is simple: at minimum scroll position the thumb begins at the track's start padding, and at maximum scroll position it ends at the track's end padding.

## Layout integration

### Side panels and forms

Keep headers and action footers outside the viewport. Put content padding inside the scrolling content so the overlay track occupies existing visual padding without reducing field width.

### Fill accordions

Keep the Accordion root clipped and non-scrolling. Each expanded panel owns a nested Scroll Area. Reserve complete trigger height and inter-item spacing before distributing remaining height to panels. Parent flex shrinking must not reduce an item below its trigger chrome.

### Data grids

Preserve one semantic table, one `colgroup`, one sticky `thead`, and one `tbody` inside a single two-axis viewport. Do not split the header and body into independent tables or scroll containers.

When the vertical track must appear beside the body, offset the overlay track by a semantic header-height token through a narrow private composition prop. Do not expose arbitrary track offsets publicly.

### Nested editors

When an expanded editor owns scrolling, switch the containing Scroll Area to `axis="none"` rather than conditionally replacing its structure. Preserve semantic user state and avoid remounting the editor.

## State and styling

- Use Base UI Scrollbar state to distinguish orientation, axis overflow, hovering, and scrolling.
- Reveal a track only when its axis overflows.
- Keep hidden tracks non-interactive with `pointerEvents: none`.
- Reveal overflowing tracks for hover, active scrolling, and the package-owned focus-within policy.
- Use semantic scrollbar geometry and border tokens. Do not invent component-local dimensions or colors.
- Keep tracks absolutely positioned through Base UI. Do not reserve native gutters with `scrollbar-gutter` on bounded overlay surfaces.
- Do not expose `className`, `style`, arbitrary CSS values, or broad track slots.

## Testing boundary

Unit tests should prove Inspektor-owned structure and behavior:

- the public ref targets the native viewport
- each axis mode projects the intended native overflow behavior
- overlay tracks remain outside the viewport
- `axis="none"` removes tracks without replacing the viewport
- private semantic offsets map to the intended variant when that mapping contains Inspektor logic

Do not add tests that only assert StyleX class names, diagnostic `data-*` attributes, or Base UI's internal thumb calculations. JSDOM computed styles do not reliably prove StyleX geometry. Test Base UI behavior only where Inspektor transforms or constrains it.

## Browser validation

Use a real browser with both short and overflowing fixtures.

1. Confirm `offsetWidth - clientWidth` and `offsetHeight - clientHeight` do not reveal a native gutter on overlay surfaces.
2. Compare content width with and without overflow.
3. At minimum scroll position, measure the thumb's start edge against the track's start padding.
4. At maximum scroll position, measure the thumb's end edge against the track's end padding.
5. Repeat the geometry check for both orientations when both-axis mode changes.
6. Confirm only overflowing axes reveal tracks.
7. Resize constrained Accordion and Side Panel examples and confirm the correct nested viewport remains the scroll owner.
8. For Data Grid, confirm the vertical track begins at the sticky header boundary and table semantics remain intact.
9. Check browser console errors after a clean reload.

Record geometry values in the relevant `docs/todo` checklist rather than relying on screenshots alone.

## Failure modes

- Native gutter changes content width: the visible scrollbar still belongs to the viewport layout rather than an overlay sibling track.
- Thumb starts in the middle or travels beyond the track: flex alignment is centering it along the travel axis before Base UI translation.
- Accordion sections overlap: a fill item can shrink below its fixed trigger or the outer Accordion owns overflow.
- Two scrollbars move the same content: scroll ownership is duplicated across nested containers.
- Data Grid columns drift: header and body were split into independent layout contexts.
- Sticky header covers the track: the vertical overlay track lacks a semantic header offset.
- Short content leaves an empty strip: a stable native gutter or always-visible classic scrollbar is reserving space.
- Unit tests pass while geometry is wrong: the tests assert classes or DOM markers instead of browser layout.

## Completion checklist

- [ ] Installed Base UI version, Scroll Area API, handbook, and tagged source inspected.
- [ ] One native scroll owner identified for each axis.
- [ ] Root, viewport, content, tracks, thumbs, and optional corner preserve Base UI anatomy.
- [ ] Native gutter does not change bounded content geometry.
- [ ] Vertical and horizontal thumbs are centered only across their tracks.
- [ ] Nested flex and grid ancestors preserve `minHeight: 0` and `minWidth: 0` where required.
- [ ] Sticky or fixed regions remain outside scrolling content or receive a semantic track offset.
- [ ] Unit tests cover only Inspektor-owned contracts.
- [ ] Browser measurements prove start and end thumb geometry.
- [ ] Relevant component documentation and `docs/todo` checklist updated.
- [ ] Focused tests, lint, typecheck, and build pass.
