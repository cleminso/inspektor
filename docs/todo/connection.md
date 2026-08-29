# Connection setup

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/08/26]

### Environment context

- [x] Show each saved connection's environment as a compact badge in connection options and the active trigger.

[29/08/26]

### Schema retention across child navigation

- [x] Retain the selected schema search parameter when table tabs replace table-specific route search, including closing an active New view tab.

[29/08/26]

### Schema switch loading and discovery

- [x] Keep the workspace toolbar visible while schema-dependent content presents `Loading schema`.
- [x] Preserve full Jazz schema hashes as option values while displaying their 12-character prefixes.
- [x] Show schema search only above ten options and keep the existing `l` scrolling viewport.

[29/08/26]

### Schema option status

- [x] Keep schema rows focused on their hashes and expose both `Latest` and `Older` through status tooltips instead of inline option badges.

[29/08/26]

### Schema switcher interaction refinement

- [x] Treat Jazz's advertised schema order as the generated-schema recency source without reordering it from publication metadata.
- [x] Keep `Latest` visible on the latest option and expose `Older` as supplementary option tooltip text.
- [x] Remove the full-hash tooltip from the schema trigger and keep the full hash in its accessible name.
- [x] Present schema loading feedback instead of a blank workspace during a schema switch.

[29/08/26]

### Schema catalogue fallback order

- [x] Preserve Jazz's advertised hash order when publication timestamps are missing or equal so metadata enrichment cannot replace the server's newest candidate.

[29/08/26]

### Schema recency and selection

- [x] Open saved connections on the newest published schema while honoring an explicit schema hash from the URL.
- [x] Write in-session schema switches to the URL so refresh and deep links preserve the selected schema.
- [x] Keep schema options newest-first and present short hashes with publication metadata.
- [x] Distinguish the latest schema from the selected schema with an active-status badge, option-status tooltips, selected-item background, and the standard check indicator.

[28/08/26]

### Production-build preparation boundary

- [x] Compare the baseline and prepared builds in both execution orders with seven fresh browser contexts per path.
- [x] Retain preparation for accepted pre-navigation connection intent after reducing median click-to-rows readiness by 140–149 ms.
- [x] Exclude route-owned context synchronization from preparation so direct navigation remains at baseline readiness instead of adding a serial provider gate.
- [x] Preserve existing-connection form intent by starting preparation after context acceptance and before navigation.

[28/08/26]

### Accepted-intent Jazz WASM preparation

- [x] Start one deferred, memoized Jazz WASM preparation after the runtime-scope guard accepts connection intent and before navigation or persisted context changes.
- [x] Keep the application root free of static Jazz runtime imports and leave client creation, publication, retry, and shutdown inside the route-owned provider.
- [x] Delay the provider while preparation is pending and let a failed early attempt settle without a toast or unhandled rejection so normal provider error ownership remains intact.

[27/08/26]

- [x] Verify connection setup retains its form state after an empty schema catalogue and succeeds when the user retries.

[27/08/26]

- [x] Verify URL-fragment connection prefill through the parser and built application without placing the admin secret in query parameters.
- [x] Verify failed optional permission metadata does not block a usable schema runtime.

[27/08/26]

- [x] Guard and persist a connection profile plus its branch and schema context as one atomic session update.
- [x] Keep blocked connection setup from saving a profile, changing runtime context, or navigating.
- [x] Cover empty, single-schema, and explicit schema-choice connection entry through the onboarding owner.

[25/08/26]

- [x] Apply each route-resolved runtime target once so later branch and schema selections remain session-owned.
- [x] Keep the rendered, imperative, and persisted connection snapshots aligned when browser storage rejects a write.

[25/08/26]

- [x] Remove connection-scoped tabs, pins, and table preferences when deleting a saved connection while preserving unrelated browser storage.

[25/08/26]

- [x] Keep the committed onboarding layout mounted while connection-route navigation is pending.
- [x] Keep add and edit submission locked until the accepted route navigation settles.

[25/08/26]

- [x] Reset the namespaced connection envelope to version 1 because `inspektor-connections` has no legacy payloads.

[25/08/26]

- [x] Use the `inspektor-` localStorage namespace for saved connection profiles.

[24/08/26]

- [x] Document the connection lifecycle and its session intent, route resolution, runtime connectivity, and workspace presentation boundaries in architecture guidance and source JSDoc.

[24/08/26]

- [x] Block browser-history and router navigation that starts while mutations are pending, and keep the runtime unmounted until route and session context agree.

[24/08/26]

- [x] Remove the saved-connection pass-through hook and consume the session `openConnection` command directly from connection entry surfaces.
- [x] Move connected route entry to one route-owned schema-catalogue loader and remove the prepared-target handoff.
- [x] Preserve Jazz schema publication metadata, order schemas newest-first with deterministic unpublished fallback ordering, and retain an available remembered selection.
- [x] Project the ordered schema catalogue through runtime state so the schema switcher renders route-owned order without rediscovery.
- [x] Replace first-request-wins coordination with router navigation, explicit blocked outcomes, router-derived pending identity, and route-owned pending and error presentation.
- [x] Keep add and edit validation inline while converging their persisted profiles on the authoritative connection route loader.
- [x] Remove saved-open validation toasts, obsolete navigation-error contracts, and the connection-open coordinator.

[24/08/26]

- [x] Cap the saved-connection results viewport at five complete items, including list gaps and viewport padding.

[24/08/26]

- [x] Open an existing saved profile when submitted credentials match it instead of showing a duplicate-connection toast.

[24/08/26]

- [x] Separate active-connection management from the add action in the switcher footer.
- [x] Show a duplicate-connection toast whose `Go` action opens the existing saved connection for editing.

[24/08/26]

- [x] Give unnamed saved connections the stable `my Jazz app` label while keeping the app ID as secondary identification.
- [x] Reuse connection validation and schema selection to edit a saved profile in place through `/conn/edit/$connectionId`.
- [x] Keep connection options as semantic listbox options and place management actions in the active-connection footer.
- [x] Show connection search only when more than five saved connections make filtering useful.
- [x] Confirm removal before deleting the local profile and its saved branch and schema preferences.
- [x] Block add, edit, and removal actions while pending table state prevents leaving the runtime scope.

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

[28/08/26]

- [ ] Define and verify the deployed Jazz WASM asset contract.
  - Serve the hashed WASM asset with `Content-Type: application/wasm`, Brotli or gzip compression, and immutable caching.
  - Revalidate HTML separately so deployments can reference a new hashed asset without leaving stale entry documents behind.
  - Confirm one WASM transfer, streaming instantiation, the expected content encoding, and cache reuse in a deployed production trace.

[24/08/26]

- [x] Experiment with non-speculative Jazz WASM preparation after an accepted connection intent.
  - Start one memoized, deferred `loadWasmModule()` promise after the exit guard accepts the connection and before navigation begins, in parallel with route loading and schema-catalogue discovery.
  - Do not preload WASM from hover, focus, viewport presence, application startup, or merely rendering saved connections.
  - Do not create a Jazz client before the route-owned `JazzProvider`; client acquisition, registry reuse, and shutdown remain provider responsibilities.
  - Keep the preparation only if a production trace proves one WASM request, earlier compilation completion, reuse by `createDb`, earlier client readiness, and no retained work after blocked intent.
  - Remove the preparation if it only duplicates initialization, shifts work without improving row readiness, or increases abandoned CPU and network work.

[22/08/26]

- [ ] Measure pre-navigation schema-hash discovery separately from runtime startup and evaluate short-lived, runtime-profile-keyed metadata reuse only if discovery remains perceptible.

[22/08/26]

- [ ] Evaluate bounded warm-client retention only if Jazz client startup remains the dominant repeat-switch cost after metadata request deduplication.

[07/08/26]

- [ ] Adopt a canonical Jazz Cloud admin-secret validator only if Jazz exposes a documented format or validator.

## Work outside the foundation scope

[24/08/26]

- Automatically switching away from an available remembered schema when a newer schema is published is outside this refactor; catalogue order does not change selection identity.
- Schema-catalogue caches, automatic retries, caller-owned metadata fetch replacements, and upstream Jazz `AbortSignal` support remain outside scope until production evidence shows repeated remote work or abandoned requests are material.
- Keeping multiple Jazz clients warm is outside scope; the registry-backed route runtime remains the only client owner.
- Hover, focus, viewport, render, and application-start WASM preloading are outside scope because they can spend network and compilation work without accepted connection intent.
- Removing the first-table route transition is outside scope because doing so would move selected-schema loading into the blocking route loader without evidence of a net benefit.
- Development-only Vite module waterfalls and StrictMode metadata duplication are not production optimization targets.

[07/08/26]

- Do not infer credential failure from an opaque browser `TypeError`; invalid credentials, CORS rejection, and connectivity failures can share that surface.
- Do not apply Jazz Cloud identifier constraints to self-hosted servers.

## Settled interaction decisions

[29/08/26]

- Jazz's advertised schema order defines generated-schema recency; publication metadata does not reorder it.
- The latest option carries a visible `Latest` badge. Older options use the supplementary `Older` tooltip and accessible name.
- The active-schema badge uses only `Latest` or `Older`.
- The shortened schema trigger does not show a full-hash tooltip.
- These decisions supersede the publication-order and option-status decisions below.

[29/08/26]

- Schema option status moved from inline badges to `Latest` and `Older` tooltips. The full hash and status remain available to assistive technology. This supersedes the option-badge statement below.

[29/08/26]

- Order schemas by distinct `publishedAt` values and preserve Jazz's advertised hash order for equal or missing timestamps. This supersedes deterministic hash fallback ordering and the claim below that hash-array order has no chronological meaning.

[29/08/26]

- Saved connection entry selects the newest published schema instead of restoring the last locally persisted schema.
- A valid explicit `schema` search parameter overrides the newest-schema default and remains stable across refresh.
- Schema switching updates the current URL without adding browser-history entries or resetting scroll position.
- The header identifies the active schema as `Latest` or `Older schema`; the newest option also carries a `Latest` badge.
- Schema options use a short hash and publication metadata instead of an Inspector-owned version number. The selected option retains both its background and check indicator.
- These decisions supersede the remembered-schema selection and automatic-switch exclusion recorded below.

[25/08/26]

- Onboarding layout selection follows the last committed router location, so a pending workspace navigation cannot unwrap the current form.
- Add and edit submission remain pending through route navigation, preventing duplicate mutations before the destination settles.

[24/08/26]

- Schema catalogue order is newest publication first and oldest publication last. Ordering uses Jazz `publishedAt` metadata rather than hash-array position.
- Schema ordering does not force schema selection. An explicit or remembered schema remains selected while available; fallback selection uses the first ordered schema.
- Connection entry and refresh fetch the schema catalogue so Inspector can discover migrations published outside Inspector.
- The connection route loader owns remote schema-catalogue resolution for connected route entry and returns the runtime target for saved selection, direct entry, and refresh; add and edit retain separate inline credential validation before persistence.
- TanStack Router owns pending, superseding, loader error, and committed route state. A newer accepted connection intent supersedes an older pending intent.
- The session boundary owns saved profiles and runtime-scope exit policy but does not own remote route-loader progress or duplicate it into a second opening state machine.
- Runtime-scope blocking is an explicit blocked outcome and never a resolved no-op presented as successful connection opening.
- Connection-route pending UI owns loader feedback; runtime UI owns selected-schema and Jazz initialization feedback; table UI owns row-query feedback.
- Jazz WASM preparation may begin only after connection intent is accepted. Jazz client creation and shutdown remain inside the registry-backed route runtime.
- These decisions supersede the request-level no-decoration, private in-flight identity, first-request-wins, and explicit prepared-target decisions recorded below.

[24/08/26]

- Above five saved connections, search remains fixed while the five-item results viewport scrolls.

[24/08/26]

- Matching saved credentials open the existing profile after schema resolution. This supersedes the duplicate-edit toast decision below.

[24/08/26]

- Active-connection edit and remove actions form one footer group; adding a connection remains a separate action group.
- Editing credentials to match another saved connection does not overwrite either profile; a toast links to the existing profile.

[24/08/26]

- Unnamed connections use one readable deterministic fallback instead of generated random names or repeated app IDs.
- Connection rows remain listbox options. Edit and remove apply to the active connection from separate footer actions instead of nesting controls inside an option. This supersedes the directional-arrow treatment from [22/08/26].
- Connection search appears above five saved connections. This supersedes the multiple-item threshold from [07/08/26].
- Removing a connection affects only this browser's saved profile and preferences; it does not modify the Jazz app.

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

[29/08/26]

- [x] Cover advertised schema order, visible latest status, older option tooltips, absent trigger tooltip, and schema-switch loading feedback.

[29/08/26]

- [x] Cover advertised-order fallback when publication metadata is equal or missing.
- [x] Verify newest-schema entry, table and query schema switching, URL replacement, selection status, and refresh persistence in the browser.
- [x] Run Inspector lint, TypeScript checks, production build, and package-wide tests.

[27/08/26]

- [x] Cover isolated-fixture connection entry, browser persistence, schema permissions, real row queries, filtering, sorting, mutation persistence, and relation navigation in Playwright.
- [x] Keep automated browser tests on direct loopback HTTP with fresh browser contexts and ephemeral Inspector Test credentials.

[25/08/26]

- [x] Cover session-owned branch and schema changes after route-target synchronization.
- [x] Cover connection persistence failure without advancing the imperative session snapshot.

[25/08/26]

- [x] Cover onboarding layout stability during pending workspace navigation.
- [x] Cover add submission remaining pending until navigation settles.

[24/08/26]

- [x] Cover schema records retaining `publishedAt`, newest-first ordering, deterministic placement of missing publication metadata, and hash-array order having no chronological meaning.
- [x] Cover explicit and remembered schema retention, unavailable-schema fallback to the newest ordered schema, and schema-switcher rendering that does not change the selected hash.
- [ ] Cover one connection-route loader policy across saved selection, switcher selection, direct entry, refresh, add, and edit.
- [ ] Cover removal of the prepared-target map without adding a duplicate schema-catalogue request to one accepted route transition.
- [ ] Cover latest accepted connection intent winning while an older loader result cannot persist context or mount a runtime.
- [ ] Cover repeated selection of the same connection joining or preserving one router transition without duplicate user-visible errors.
- [x] Cover runtime-scope blocking without navigation, popup dismissal, false success, or credentialed network work.
- [x] Cover connection-route pending presentation, terminal loader errors, remembered-schema fallback when catalogue discovery is unavailable, and runtime retry when selected-schema or Jazz initialization fails.
- [x] Cover add and edit preserving inline validation while sharing route-owned schema selection after profile persistence.
- [x] Cover that permissions remain non-blocking and that selected-schema loading and Jazz client creation remain parallel.
- [x] Cover the application-root and connection-switcher import boundaries after moving route resolution.
- [x] If WASM preparation is implemented, cover one shared promise, no preparation for blocked intent, no early Jazz client, and safe rejection handling without a toast or unhandled promise.
- [ ] Verify with the isolated Inspector Test fixture that saved selection, direct refresh, add, edit, schema switching, connection superseding, and failure recovery reach the expected route and rows.
- [ ] Capture production traces for connection activation, catalogue completion, route commit, selected-schema verification, WASM completion, Jazz WebSocket readiness, first table selection, and first rows.
- [ ] Compare production traces with and without WASM preparation and retain it only when it advances client and row readiness without duplicate WASM work.
- [x] Run focused connection, routing, runtime, schema-switcher, add, and edit tests before Inspector lint, typecheck, production build, package-wide tests, and workspace formatting.
- [x] Supersede historical saved-open toast, request-lock, pending-control, prepared-target, and navigation-error checks with the route-owned loading coverage above.

[24/08/26]

- [x] Verify six saved connections render in a five-item scrolling viewport.

[24/08/26]

- [x] Verify matching saved credentials reuse and open the existing profile without saving a duplicate.

[24/08/26]

- [x] Verify the add action is separated from active-connection management.
- [x] Verify duplicate edits show `Go` and route to the existing saved connection.

[24/08/26]

- [x] Verify unnamed connection creation stores the readable fallback label.
- [x] Verify editing prefills the saved profile, preserves its local ID, and revalidates its schema target before opening it.
- [x] Verify removal requires confirmation, clears local profile preferences, and returns an active workspace to Connections.
- [x] Verify connection choices remain semantic options and management actions do not nest interactive controls inside them.
- [x] Verify five connections omit search and six expose name and app-ID filtering.
- [x] Verify runtime-scope blockers prevent add, edit, and removal actions.
- [x] Supersede the earlier directional-arrow checks with semantic option and footer-action coverage.

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
