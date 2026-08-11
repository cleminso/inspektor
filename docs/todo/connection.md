# Connection setup

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[11/08/26]

- [x] Keep submit available for native required validation and disable it only while submission is active.
- [x] Route custom field failures through the Text Field error channel and focus the first invalid field.
- [x] Give connection fields stable form metadata and appropriate technical-value input semantics.

[09/08/26]

- [x] Coordinate saved-connection opening at the session boundary so every consumer shares one in-flight request.
- [x] Expose the opening connection identity so entry surfaces can disable competing actions and present pending feedback.
- [x] Guard add-connection schema requests synchronously instead of relying on rendered submission state.
- [x] Distinguish route-navigation failures from schema-fetch and credential-validation failures.

[07/08/26]

- [x] Clear a field-specific validation error when that field changes while preserving remote connection guidance.
- [x] Prevent overlapping saved-connection opens from competing to update session and route state.
- [x] Apply Jazz Cloud app-ID validation to canonical and terminal-dot host spellings.

[07/08/26]

- [x] Validate HTTP and HTTPS server URLs before requesting stored schemas.
- [x] Validate UUID-shaped app IDs for Jazz Cloud while preserving arbitrary self-hosted app identifiers.
- [x] Keep self-hosted admin-secret values unrestricted beyond the required non-empty contract.
- [x] Normalize authorization, missing-app, missing-schema, server, opaque fetch, and unknown failures without exposing raw browser or server details.
- [x] Present field-specific input errors beside their fields and keep remote connection failures visible in the form.

## Open product work

[07/08/26]

- [ ] Adopt a canonical Jazz Cloud admin-secret validator only if Jazz exposes a documented format or validator.

## Work outside the foundation scope

[07/08/26]

- Do not infer credential failure from an opaque browser `TypeError`; invalid credentials, CORS rejection, and connectivity failures can share that surface.
- Do not apply Jazz Cloud identifier constraints to self-hosted servers.

## Settled interaction decisions

[09/08/26]

- Saved-connection request coordination belongs to the shared session boundary rather than individual entry surfaces.
- Connection switcher choices become unavailable during an opening request, while explicit popup dismissal remains available.
- Navigation failures use opening guidance instead of connection-validation guidance.

[07/08/26]

- A saved-connection surface accepts one opening request at a time.
- Editing a field dismisses only the validation error owned by that field.

[07/08/26]

- Local input-shape failures prevent schema requests.
- HTTP authorization responses identify rejected credentials.
- Opaque fetch failures use neutral connection-validation guidance covering server URL, app ID, and admin secret.
- Add-connection errors remain inline because users need their guidance while correcting form values.

## Open design decisions

[07/08/26]

- None.

## Validation checklist

[09/08/26]

- [x] Verify overlapping connection opens are ignored across shared consumers and retries work after failure.
- [x] Verify add-connection submission starts one schema request under synchronous repeated activation.
- [x] Verify pending saved connections expose disabled controls and a polite status message.
- [x] Verify Escape can dismiss the connection switcher during an opening request.
- [x] Verify navigation failures remain distinct from schema-fetch failures.

[07/08/26]

- [x] Verify repeated saved-connection activation starts one request.
- [x] Verify corrected fields clear local errors without clearing remote errors.
- [x] Verify terminal-dot Jazz Cloud hosts retain UUID-shaped app-ID validation.

[07/08/26]

- [x] Verify malformed Jazz Cloud app IDs remain local field errors and do not request schemas.
- [x] Verify self-hosted app IDs and arbitrary non-empty secrets remain accepted.
- [x] Verify status-bearing and opaque failures render normalized copy without sensitive details.
- [x] Verify saved-connection failures keep the switcher available and produce one error toast.
