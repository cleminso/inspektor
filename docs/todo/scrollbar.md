# Scrollbar implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[05/08/26]

- [x] Support content-sized private Scroll Areas that grow to a semantic viewport limit.
- [x] Move Multi Select option scrolling onto Base UI overflow measurement and overlay tracks.

[05/08/26]

- [x] Define one package-owned scrollbar recipe using semantic border, spacing, and radius tokens.
- [x] Keep the thumb and track transparent while a scroll container is inactive.
- [x] Reveal the thumb when the scroll container is hovered or contains focus.
- [x] Avoid reserved gutters and custom WebKit dimensions so non-overflowing regions do not gain an empty inline strip.
- [x] Apply the standard recipe automatically to scrollable `Box` instances.
- [x] Apply the standard recipe to Data Grid, Side Panel, Combobox, Select, Multi Select, Menu, Context Menu, Textarea, and Code Editor scroll owners.
- [x] Move popup overscroll containment onto the elements that own scrolling.
- [x] Bound Menu, Context Menu, and Multi Select popups by Base UI available height.
- [x] Remove the documentation application's duplicate scrollbar appearance rules.
- [x] Add a Base UI Scroll Area wrapper that keeps native scrolling while rendering token-backed tracks outside viewport layout.
- [x] Move Row Editor Details and JSON scrolling onto overlay tracks so form content width stays unchanged when vertical overflow appears.
- [x] Move Side Panel, constrained Accordion, and Data Grid scrolling onto overlay tracks.
- [x] Keep complete Accordion triggers above shrinking panels at constrained heights.
- [x] Align the Data Grid vertical track with the body below its sticky header while preserving one semantic table and one two-axis viewport.
- [x] Keep Tab View scrollable without visible scrollbar chrome across standard and WebKit scrollbar APIs.
- [x] Center overlay thumbs only across their track so Base UI owns the complete start-to-end travel range.

## Open product work

[04/08/26]

- None.

## Work outside the foundation scope

[04/08/26]

- Replacing the native viewport or scroll physics with JavaScript scrolling.
- Adding scroll-edge fades to product surfaces.
- Virtualizing large table or popup collections.
- Restoring nested feature scroll positions through routing.

## Settled interaction decisions

[05/08/26]

- [x] Native scrolling remains the behavior layer; Base UI overlay tracks mirror and control the same native viewport.
- [x] Scrollbar appearance is attached to each actual scroll owner rather than a universal selector.
- [x] Bounded layout surfaces use absolutely positioned overlay tracks instead of native gutters when scrollbar appearance must not change content geometry.
- [x] Standard native scrollbars remain available for controls that cannot use a composed Scroll Area.
- [x] Hover and `focus-within` are the two activation signals.
- [x] Generic application scroll areas receive the recipe through `Box` overflow props without scrollbar-specific public props.
- [x] Constrained accordions keep overflow within nested Scroll Areas so opening a section does not create an outer list scrollbar.
- [x] Tab View remains the explicit hidden-scrollbar exception.
- [x] Track layout must not align a thumb along its travel axis because Base UI applies the scroll-position translation.

## Open design decisions

[04/08/26]

- None.

## Validation checklist

[05/08/26]

- [x] Focused Scroll Area and Multi Select tests pass.
- [x] Package typecheck, build, and changed-file lint pass.
- [x] Browser verification confirms short Multi Select collections have no visible track and long collections remain scrollable.

[05/08/26]

- [x] Scrollbar contract regression tests pass.
- [x] Design-system package tests pass.
- [x] Design-system package typecheck passes.
- [x] Changed Scroll Area files pass focused lint.
- [x] Design-system package build passes.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [x] Inspektor application scrollbar-focused tests, typecheck, and build pass.
- [x] Inspektor application full tests pass after aligning Dock icons with their extra-small semantic size.
- [ ] Inspektor application full lint retains an unrelated Row Editor `autoFocus` warning.
- [x] Browser verification confirms no reserved Context Switcher strip, opaque sticky Data Grid headers, platform WebKit geometry, and hidden Tab View scrollbar chrome.
- [x] Browser verification confirms constrained Accordion panels own overflow without changing the Accordion root or trigger width.
- [x] Browser verification confirms overflowing and short Scroll Area content keep the same 320px viewport and content width with a zero-width native gutter.
- [x] Browser verification confirms constrained Accordion items preserve complete 26px triggers without overlap at 96px and 60px container heights.
- [x] Browser verification confirms the compact Data Grid vertical track starts 28px below the viewport at the sticky header boundary and native gutter width remains zero.
- [x] Browser verification confirms a vertical thumb starts and ends at the track's 2px block padding instead of receiving an additional flex-centering offset.
