# Tree

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Component audit](#component-audit)
- [Validation checklist](#validation-checklist)

## Implemented foundation

### [08/09/26] Scrollbar rail

- [x] Give the overlay scrollbar thumb an opaque rail so row backgrounds do not change its visual substrate.
- [x] Add subtle inline separators that visually distinguish the rail without changing its outer width.
- [x] Preserve full-width rows and geometry-neutral overlay scrolling instead of reserving an inline gutter.

### [06/09/26] Indicator layout synchronization

- [x] Reposition the current-item indicator when nested branch content changes its layout.

### [06/09/26] Navigation state polish

- [x] Match the current-item indicator width to the branch line.
- [x] Align the current-item indicator directly over the branch line.
- [x] Use a subtle selection-blue hover treatment while preserving the current-item background on hover.
- [x] Apply the same subtle selection-blue hover treatment to section triggers.
- [x] Keep the redundant scroll viewport out of the tab order and suppress its container focus ring.
- [x] Keep one section-owned indicator so it tracks navigation between sibling items.
- [x] Disable indicator and row-color transitions when reduced motion is requested.

### [06/09/26] Documentation navigation integration

- [x] Replace the documentation application's left-dock navigation with Tree.
- [x] Keep the dock layout boundary while moving scrolling, navigation semantics, disclosure, and link presentation into Tree.

### [06/09/26] Navigation tree component

- [x] Provide a scroll-owning navigation root with nested list semantics.
- [x] Provide repeatable and recursively nestable collapsible sections.
- [x] Provide folder triggers with Base UI disclosure behavior.
- [x] Provide router-composable leaf links with current-page styling.
- [x] Use semantic colors, focus treatment, density, and branch lines without row icons.
- [x] Place the current-item indicator on its corresponding branch-line segment instead of inside the item surface.

## Work outside the foundation scope

### [06/09/26] Interaction model

- [x] Drag-and-drop, renaming, context actions, and file-system mutation are excluded.
- [x] ARIA tree roles, roving focus, and arrow-key navigation are excluded in favor of native navigation and disclosure semantics.
- [x] Panel-height animation is excluded so folder disclosure remains immediate.

## Settled interaction decisions

### [08/09/26] Scrollbar rail

- [x] Use the Scroll Area private semantic treatment rather than Tree-owned scrollbar styling.
- [x] Reveal and hide the rail through the shared Scroll Area overflow and activation states.

### [06/09/26] Navigation state transitions

- [x] Animate the current-item indicator only when navigation moves within the same section.
- [x] Move the indicator with a transform while switching row colors independently.
- [x] Do not introduce cross-section indicator motion.

### [06/09/26] Documentation routing

- [x] Keep static component route files for literal route typing, route-level splitting, and router-owned not-found behavior.
- [x] Do not add virtual routes or a dynamic component-page loader.

### [06/09/26] Navigation behavior

- [x] Folder rows only expand and collapse.
- [x] Consumers choose initially open sections through `defaultOpen`.
- [x] Only the current leaf link receives persistent selection styling.
- [x] Tree structure is composed with `Tree.Root`, `Tree.Section`, `Tree.Trigger`, `Tree.Content`, and `Tree.Item`.

## Open design decisions

### [06/09/26] None

- [x] No unresolved design decisions belong to the component foundation.

## Component audit

### [06/09/26] Base UI Collapsible

- Installed primitive: `@base-ui/react@1.8.0` Collapsible.
- Sources: official Collapsible API, styling and composition handbooks, and tagged root, trigger, and panel source.
- `Tree.Section` preserves controlled and uncontrolled state, change details, disabled state, DOM props, and the Base UI root ref.
- `Tree.Trigger` preserves trigger DOM props and its button ref while fixing native button semantics and presentation.
- `Tree.Content` preserves panel DOM props, mount options, generated disclosure relationships, state attributes, CSS variables, and its panel ref.
- `Tree.Item` is an Inspektor navigation endpoint built with `useRender`; it preserves anchor props and composes onto router links.
- Consumer `className` and `style` are omitted from every public part. Base UI `render` is intentionally omitted from structural Collapsible parts.

## Validation checklist

### [08/09/26] Scrollbar rail validation

- [x] Verify the rail over default, hover, current, current-hover, and keyboard-focused rows in both supported color schemes.
- [x] Verify the bordered rail matches the reference treatment while short content remains clear and overflowing content preserves Tree width and thumb travel.
- [x] Run focused Tree and Scroll Area tests, changed-file lint, typecheck, build, and the design-system package suite.

### [06/09/26] Navigation state polish validation

- [x] Verify the section retains one indicator as the current sibling item changes.
- [x] Verify hover, current-hover, same-section motion, cross-section replacement, and reduced motion in a browser.
- [x] Run changed-file StyleX lint, focused tests, typecheck, build, and affected-package tests.

### [06/09/26] Documentation navigation validation

- [x] Verify section disclosure and current-page semantics with a focused application test.
- [x] Verify the integrated left dock, current-page treatment, and icon removal in a browser.
- [x] Verify the left dock in both supported color schemes and at relevant viewport sizes.
- [x] Run changed-file lint, documentation tests, typecheck, and build.

### [06/09/26] Documentation validation

- [x] Generate and check Tree prop metadata.
- [x] Run documentation tests, lint, typecheck, and build.
- [x] Verify the basic example renders in the documentation application.

### [06/09/26] Package validation

- [x] Run the focused Tree test.
- [x] Run changed-file StyleX lint.
- [x] Run design-system package typecheck.
- [x] Run package formatting and inspect the resulting diff.
- [x] Run the design-system package build and complete test suite.
- [ ] Verify default, focus, collapsed, and disabled states in a browser.
