# Context switcher

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[09/08/26]

- [x] Keep connection choices disabled while the shared session opens a saved connection.
- [x] Announce saved-connection opening through the switcher's polite status surface.
- [x] Preserve explicit Escape and outside-press dismissal while suppressing only the item-selection close request.

[07/08/26]

- [x] Hide connection search when zero or one saved connection makes filtering unnecessary.
- [x] Present only the Add new connection action when no saved connections exist.
- [x] Distinguish an empty filtered connection result from an empty saved-connection store.

[06/08/26]

- [x] Replace the trigger's native `title` API with constrained `tooltip` content rendered through the shared Tooltip component.

[05/08/26]

- [x] Derive Context Switcher trigger size and width from the constrained Combobox Trigger contract instead of redeclaring forwarded unions.

[03/08/26]

- [x] Preserve the shared ghost Button hover and active backgrounds on switcher triggers.

[01/08/26]

- [x] Keep the trigger background visible while its popup is open.
- [x] Use the selected text color for context switcher trigger content while open.
- [x] Preserve shared combobox trigger behavior and button visuals.

## Open product work

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- No changes to popup layout, search behavior, or item styling.

## Settled interaction decisions

[09/08/26]

- Selecting a saved connection keeps the popup available during the request, but users can explicitly dismiss it.
- A dismissed popup does not reopen when the connection request fails.

[07/08/26]

- Connection search appears only when multiple saved connections can be filtered.
- The Add new connection footer remains available for every saved-connection count.

[05/08/26]

- Context Switcher retains consumer-facing trigger type names while Combobox owns the forwarded size and width values.

[03/08/26]

- The design-system trigger owns ghost Button visuals; application switchers provide inherited text content.

[01/08/26]

- The combobox trigger owns popup-open state styling.
- Context switcher content consumes the combobox trigger text-color contract instead of duplicating open state.

## Open design decisions

[01/08/26]

- None.

## Validation checklist

[09/08/26]

- [x] Verify pending connection options expose disabled semantics and opening status text.
- [x] Verify Escape dismisses the popup while a connection request remains active.

[07/08/26]

- [x] Cover zero, one, multiple, filtered-empty, successful-open, and failed-open connection switcher states.
- [x] Verify the zero-connection popup contains only the Add new connection action in the browser.

[06/08/26]

- [x] Cover trigger tooltip composition and generated `tooltip` prop metadata.

[05/08/26]

- [x] Focused Context Switcher and Combobox tests pass.
- [x] Design-system package typecheck and build pass with derived trigger types.
- [x] Documentation and Inspector consumers pass typecheck and build.

[01/08/26]

- [x] Run focused context switcher and combobox tests.
- [x] Run design-system typecheck.
- [x] Run changed-file lint.
- [x] Build the design-system package.
