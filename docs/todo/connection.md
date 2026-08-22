# Connection setup

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[22/08/26]

- [x] Route context-switcher and recent-connection selections through one shared saved-connection opener with normalized toast handling.
- [x] Keep recent-connection content unchanged while the session boundary coordinates opening, without an item spinner or disabled presentation.
- [x] Keep in-flight request identity private to the connection-open coordinator instead of projecting unused pending state through session context.

[22/08/26]

- [x] Hand a validated connection target to the matching route loader so switching does not repeat schema-hash discovery before rendering the destination workspace.

[22/08/26]

- [x] Present recent connections as auto-height stacked actions whose button surface owns its padding and app-ID-only metadata.

[22/08/26]

- [x] Reveal the directional arrow only while an inactive connection item is hovered.

[22/08/26]

- [x] Present each saved connection with its app ID and a directional arrow instead of server metadata and selected-state checkmarks.
- [x] Close the connection switcher as soon as a connection is selected while preserving coordinated opening and normalized error handling.

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

[22/08/26]

- [ ] Measure pre-navigation schema-hash discovery separately from runtime startup and evaluate short-lived, runtime-profile-keyed metadata reuse only if discovery remains perceptible.

[22/08/26]

- [ ] Evaluate bounded warm-client retention only if Jazz client startup remains the dominant repeat-switch cost after metadata request deduplication.

[07/08/26]

- [ ] Adopt a canonical Jazz Cloud admin-secret validator only if Jazz exposes a documented format or validator.

## Work outside the foundation scope

[07/08/26]

- Do not infer credential failure from an opaque browser `TypeError`; invalid credentials, CORS rejection, and connectivity failures can share that surface.
- Do not apply Jazz Cloud identifier constraints to self-hosted servers.

## Settled interaction decisions

[22/08/26]

- Saved-connection entry surfaces do not present request-level pending decoration; the destination workspace owns schema, runtime, and row-loading feedback.
- Removing entry-item pending decoration does not require route prefetching. Prefetch is reserved for evidence that destination preparation, rather than Jazz runtime startup, is the remaining interaction bottleneck.

[22/08/26]

- A connection target prepared by an explicit open is single-use and only reusable by the route loader when the saved runtime profile, branch, and schema still match.

[22/08/26]

- The connection-item arrow is hover affordance for inactive connections; active connections do not show it.

[22/08/26]

- Connection selection dismisses the switcher immediately and does not present opening status inside the popup. Shared session coordination continues to reject overlapping requests. This supersedes the switcher-specific pending presentation decision from [09/08/26].

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

[22/08/26]

- [x] Verify recent-connection selection preserves its name and app ID without spinner, busy, or disabled presentation.
- [x] Verify context-switcher and recent-connection failures retain the same normalized toast guidance through the shared opener.
- [x] Verify overlapping selections still start only one shared connection-open request.

[22/08/26]

- [x] Verify a saved-connection open and its route loader share one schema-hash discovery result.
- [x] Verify changed connection credentials reject a prepared route target.
- [x] Verify the isolated Inspector Test fixture reaches schema and row rendering through the optimized route handoff.

[22/08/26]

- [x] Verify recent connections keep both labels inside a padded button surface, omit redundant server labels, and retain compact item separation.

[22/08/26]

- [x] Verify inactive items reveal the arrow on hover and active items never show it.

[22/08/26]

- [x] Verify connection items show only the app ID and a directional arrow.
- [x] Verify selection closes the popup before connection opening resolves and failures still produce normalized toast guidance.
- [x] Verify an existing opening request does not render pending feedback inside the switcher.

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
