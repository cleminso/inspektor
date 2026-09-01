# Subscription query

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[31/08/26]

- [x] Let each dock icon open, close, or switch the shared left dock from one state source.
- [x] Show the shared close shortcut on the active icon and each inactive icon's open shortcut.

[31/08/26]

- [x] Route the bottom-dock RSS control to the connection-scoped Queries route.
- [x] Reuse the shared side-panel content surface for the empty Queries workspace.
- [x] Keep the workspace dock icons and empty left panel mounted across Tables and Queries.
- [x] Keep one connection-owned side-panel layout provider mounted while switching workspaces.

## Open product work

[31/08/26]

- [ ] Define the subscription-query workspace content and interactions.

## Work outside the foundation scope

[31/08/26]

- Query lists, editors, results, loading states, and error states remain separate product work.

## Settled interaction decisions

[31/08/26]

- At most one left-dock icon is active; both are inactive while the dock is closed.
- `Mod+B` toggles the left dock, `Alt+T` opens Tables, and `Alt+Q` opens Queries.

[31/08/26]

- The RSS dock control opens the Queries route for the active connection.
- The Tables and Queries dock controls remain visible and show the active workspace with the established blue icon treatment.

## Open design decisions

[31/08/26]

- [ ] Define the Queries workspace information architecture.

## Validation checklist

[31/08/26]

- [x] Verify open, close, and switch behavior against the isolated browser fixture.
- [x] Verify active and inactive tooltip labels and shortcut hints with focused dock tests.

[31/08/26]

- [x] Verify the resize handle remains visible across Tables and Queries in the isolated browser fixture.

[31/08/26]

- [x] Verify RSS dock navigation with the focused dock test.
- [x] Verify formatting, lint, typecheck, build, and package tests for the Inspector application.
