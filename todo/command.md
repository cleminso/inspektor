# Command

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[19/09/26]

- [x] Present the command surface with the shared elevated shadow treatment instead of a solid outer border.

[05/09/26]

- [x] Place command navigation and selection guidance together at the footer end.
- [x] Omit redundant Escape close and cancel guidance from command palettes.

[03/09/26]

- [x] Clip dialog overlays to the command surface corners.
- [x] Distribute footer keyboard guidance consistently.

[03/09/26]

- [x] Expose command labels as option names and supporting text as descriptions.

## Open product work

None.

## Work outside the foundation scope

None.

## Settled interaction decisions

[05/09/26]

- Command palettes show only navigation and selection guidance because close controls remain available.
- Command footer guidance starts from the footer edge rather than competing with the command list.
- Command search inputs do not render a visible focus ring.

[03/09/26]

- Filtering may use supporting text without including it in the accessible name.

## Open design decisions

None.

## Validation checklist

[05/09/26]

- [x] Cover footer guidance ordering for general commands and filter commands.
- [x] Validate the affected web and design-system packages.

[03/09/26]

- [ ] Verify command dialog corners and close action in light and dark themes.
- [ ] Verify command palette and filter-builder footer layouts.

[03/09/26]

- [x] Cover filtering, generated descriptions, and consumer-provided accessible names.
