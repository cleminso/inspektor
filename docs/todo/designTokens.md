# Design token implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[04/08/26]

- [x] Move scrollbar appearance into one token-backed design-system recipe without reserving empty gutter space.

[01/08/26]

- [x] Express typography, spacing, scalable dimensions, and radii relative to the root font size.
- [x] Preserve nominal component geometry when the root font size is `16px`.
- [x] Scale controls, icons, popup dimensions, content measures, and component spacing with `rem` tokens.
- [x] Replace package-owned raw scalable lengths with semantic or primitive tokens.
- [x] Keep component-specific relationships, including switch thumb endpoints and inner control dimensions, valid while borders remain fixed.
- [x] Keep the shared focus-ring width fixed at `2px` while scalable dimensions use `rem`.
- [x] Define global breakpoint values and media queries in one breakpoint token module.
- [x] Keep application color, typography, radius, shadow, and tracking values out of consumer stylesheets.
- [x] Load Geist Sans and Geist Mono as application assets while the design system owns their semantic use.
- [x] Reduce the product type scale to `12px`, `13px`, `16px`, and `20px` roles.
- [x] Remove unused letter-spacing tokens and inherited application tracking.
- [x] Export an optional design-system baseline that consumers import once to normalize browser layout without defining theme values.
- [x] Document why the baseline exists and where its responsibility ends.
- [x] Normalize native links, lists, form controls, and implicit border widths that were previously covered by Tailwind Preflight.
- [x] Pair `12px` compact text with an explicit `1rem` line height.
- [x] Pair `13px` interface text with an explicit `1.125rem` line height.

## Open product work

[01/08/26]

- [ ] Add automated browser coverage for default and enlarged root font sizes when a visual-regression workflow exists.

## Work outside the foundation scope

[01/08/26]

- Runtime Data Grid column widths produced by TanStack Table.
- One-pixel borders, separators, clipping boxes, and panel handles.
- Focus-ring thickness and offsets.
- Shadow geometry.
- Application-specific documentation layout styles.
- Component-local container and viewport thresholds that describe component behavior rather than device categories.

## Settled interaction decisions

[01/08/26]

- [x] Do not force the document root to `16px`; user root-font preferences remain effective.
- [x] Use `rem` for the typographic and interactive scale.
- [x] Use `px` for physical hairlines and focus geometry.
- [x] Preserve the default-density design at a `16px` root.
- [x] Allow controls and popup content to expand proportionally at larger root font sizes.
- [x] Keep global viewport breakpoints centralized while component-specific thresholds remain local and named.
- [x] Consumer applications do not define design-system color or typography values.
- [x] Use one `20px` heading role until a larger product hierarchy has a concrete use case.

## Open design decisions

[01/08/26]

- None.

## Validation checklist

[01/08/26]

- [x] Design-system package tests pass.
- [x] Design-system package typecheck passes.
- [x] Design-system package lint passes for changed files.
- [x] Primitive token unit-policy tests pass.
- [x] Design-system package build passes.
- [x] Documentation props generation and check pass.
- [x] Documentation tests, typecheck, lint, and build pass.
- [x] Browser verification preserves nominal geometry at a `16px` root.
- [x] Browser verification scales representative components at a `20px` root while retaining one-pixel boundaries.
- [x] Inspektor application tests, typecheck, lint, and build pass without Tailwind.
- [x] Geist Sans and Geist Mono load from built application assets.
- [x] Browser verification confirms Geist rendering in light and dark color schemes.
- [x] Browser verification confirms zero body margin and border-box sizing without Tailwind Preflight.
- [x] Browser verification confirms normalized links, lists, buttons, implicit borders, and an `18px` interface line box.
