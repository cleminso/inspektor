# Devtools

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[21/08/26]

- [x] Register the TanStack Hotkeys panel to inspect active shortcuts and held keys.

[21/08/26]

- [x] Mount one React TanStack Devtools adapter inside the router context.
- [x] Register the TanStack Router library panel through the plugin API.
- [x] Defer the import-time active Devtools runtime outside the application root module graph.
- [x] Keep the Devtools runtime disabled in test mode so tests do not initialize its event-bus connection.
- [x] Preserve the Vite plugin defaults for source inspection, console piping, and production removal.

## Open product work

[21/08/26]

- [ ] Add Inspektor-specific runtime panels when product state exposes a stable, serializable, and credential-free inspection boundary.

## Work outside the foundation scope

[21/08/26]

- [ ] Publishing reusable Inspektor Devtools plugins is separate package work.
- [ ] A custom runtime event bus is deferred until a panel requires communication beyond the existing React tree.

## Settled interaction decisions

[21/08/26]

- The Devtools adapter remains below the router provider so library panels receive router context.
- All runtime imports from `@tanstack/react-devtools` remain in the dedicated deferred module.
- Devtools diagnostics must not expose `adminSecret` or other connection credentials, including through URL fragments.

## Open design decisions

[21/08/26]

- [ ] Decide which Inspektor-specific runtime state would provide distinct value beyond the TanStack Router panel.
- [ ] Decide whether Inspektor runtime panels should expose mutation commands.

## Validation checklist

[21/08/26]

- [x] Run the Inspektor typecheck and production build after adding the Hotkeys panel.
- [x] Run changed-file linting after adding the Hotkeys panel.
- [x] Verify the Hotkeys panel lists registered application shortcuts in the browser.

[21/08/26]

- [x] Run the Inspektor typecheck and production build.
- [x] Confirm the production build removes Devtools code from `inspectorDevtoolsDeferred.tsx`.
- [x] Run changed-file linting.
- [x] Confirm importing the root route does not initialize the deferred Devtools dependency.
- [ ] Verify the Devtools shell and source annotations in the browser.
