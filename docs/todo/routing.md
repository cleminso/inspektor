# Routing

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/08/26]

- [x] Preserve the active Tables index, table detail, or Queries path when schema selection updates URL search state.

[28/08/26]

- [x] Add guard `cssCodeSplit: false` application CSS in one entry stylesheet so deferred JavaScript cannot introduce stylesheet-driven full-page recalculation.

[27/08/26]

- [x] Reconcile unknown, duplicate, blocked, and multi-entry browser traversals without losing the Table workspace forward branch.
- [x] Retain route pushes that occur before the Table navigation-history subscription commits.

[25/08/26]

- [x] Keep pagination commands in the route owner while row queries receive resolved search state and one out-of-range correction command.

[25/08/26]

- [x] Derive active workspace-tab identity from committed table route params and search instead of duplicating it in provider state.
- [x] Canonicalize a verified schema with no tables to the explicit New view route.

[25/08/26]

- [x] Canonicalize route and persisted-tab search through one raw-to-resolved contract while omitting semantic defaults from URLs.
- [x] Keep row-query execution independent of TanStack Router and validate runtime sort columns against the selected schema.
- [x] Use collision-safe workspace and table scope serialization across tabs, preferences, selection, and staged mutations.
- [x] Reject pagination whose derived Jazz offset exceeds safe integer precision.

[25/08/26]

- [x] Restore the most recent table view that remains valid in the selected schema when entering a connection, falling back to the first available table.

[25/08/26]

- [x] Supersede cached schema hydration with a null schema projection until the selected stored schema is verified.

[24/08/26]

- [x] Redirect the application root to the connections route.

[22/08/26]

- [x] Retry runtime initialization once when a failure follows a hidden-to-visible document transition.

[22/08/26]

- [x] Supersede optimistic direct-link entry by validating persisted schema preferences before mounting the runtime when hash discovery is available.
- [x] Fall back to the first available schema when the remembered schema no longer exists and persist the corrected runtime target.
- [x] Retain the remembered target when loader validation is unavailable, then fall back if runtime discovery rejects it.
- [x] Classify runtime initialization failures as schema or client errors while retaining the original error internally.
- [x] Retry schema metadata and the registry-backed Jazz provider through one runtime command without adding credentials to provider identity.
- [x] Replace React's raw caught-error console reporting with a generic root diagnostic while the runtime boundary logs its redacted error clone.

[11/08/26]

- [x] Render TanStack Router head content with route-specific titles.
- [x] Add page headings, focusable main landmarks, and focus-visible skip links before persistent headers.
- [x] Use TanStack Router links for user-initiated route changes while retaining imperative navigation for successful submissions.

[08/08/26]

- [x] Remount the Jazz provider when a saved profile object changes under the same persisted id, using an opaque reference token instead of credential material.

[08/08/26]

- [x] Remount the narrow registry-backed Jazz provider boundary by non-sensitive connection and branch identity so replacement runtimes cannot receive a retained previous client.
- [x] Disable Jazz DevTools auto-attachment for the Inspector-owned runtime provider.

[07/08/26]

- [x] Include branch identity in the projected runtime store so branch changes synchronously stop exposing the previous client.
- [x] Derive workspace readiness from runtime resources and track schema-hash discovery independently.

[07/08/26]

- [x] Delegate Jazz client acquisition and shutdown to the SDK's registry-backed React provider instead of calling `createJazzClient` directly from an effect.
- [x] Mount the Jazz client controller beside the structural workspace so its Suspense fallback never replaces or remounts route content.
- [x] Project the registry-owned client into the app runtime store while keeping route and session state as the client configuration owner.

[07/08/26]

- [x] Keep one explicit route-owned Jazz runtime while exposing client, schema, schema hashes, permissions, errors, and loading through independent Nano Store projections.
- [x] Publish client and stored schema independently so schema hashes and permissions cannot delay structural workspace restoration.
- [x] Keep runtime identity in TanStack Router and the session store instead of duplicating it into Nano Stores.

[07/08/26]

- [x] Enter a saved runtime from its persisted branch and schema preference without blocking route rendering on schema-hash discovery.
- [x] Fetch the Jazz client, stored schema, and schema hashes in parallel inside the runtime boundary.
- [x] Keep optional stored permissions outside the critical runtime readiness path.
- [x] Keep the connected workspace mounted while the runtime client becomes available instead of inserting a remounting Jazz provider wrapper.

[31/07/26]

- [x] Enter connected workspaces through the Tables route.
- [x] Remove the Tables and Subscriptions ToggleGroup from the connected header.
- [x] Reserve an inactive Activity control in the bottom dock for the Subscriptions dock.
- [x] Pair compact dock controls with semantic extra-small icons.

[30/07/26]

- [x] Keep only the saved connection id in connected content routes.
- [x] Restore branch and schema hash from the selected connection preferences.
- [x] Mount the shared Jazz runtime provider at `/conn/:connectionId` after validating the saved runtime context.
- [x] Keep session-target synchronization in an app-owned runtime boundary so the connection route remains a loader and composition adapter.
- [x] Use `/conn/:connectionId/tables/:tableName` for the default Data representation.
- [x] Use `/conn/:connectionId/queries` for the Queries entry point.
- [x] Keep branch and schema hash in runtime, workspace, tab, and table-preference scopes without exposing them in content URLs.
- [x] Keep route identity separate from workspace-item and visual tab identity.
- [x] Keep internal table-tab ids out of URL search parameters and derive the active view from the table path plus shareable view state.
- [x] Preserve schema-discovery failures as route errors instead of redirecting valid saved connections to setup.
- [x] Reuse loader-resolved schema hashes during initial runtime creation and skip connection-loader refreshes for descendant navigation.

[27/07/26]

- [x] Keep connection storage, onboarding navigation, and route identity in a dependency-light root session provider.
- [x] Mount the Jazz runtime provider below connection setup and onboarding routes.
- [x] Share one Jazz runtime across table and query-subscription descendants.
- [x] Dynamically load Jazz schema-hash helpers only when navigation needs remote metadata.
- [x] Keep the shared connection switcher on the root session context so it works in onboarding and connected layouts.
- [x] Cover the application-root import boundary with a regression test that rejects Jazz initialization.
- [x] Cover the connection switcher import boundary so it cannot depend on the connection-scoped runtime provider.

## Open product work

[31/07/26]

- [ ] Define and connect the Activity control to the Subscriptions left-dock interaction.

[30/07/26]

- [ ] Add explicit Schema workspace-item routing when the Schema item implementation starts.

## Work outside the foundation scope

[30/07/26]

- Workspace-item generalization, Subscriptions dock content, Schema items, Query items, and split panes remain separate product work.

## Settled interaction decisions

[25/08/26]

- Initial table routing reuses workspace-scoped recent-view persistence and its search state instead of adding a second last-table preference.

[25/08/26]

- Runtime schema projection remains empty until Jazz verifies the selected stored schema. This supersedes branch-independent cached-schema hydration.

[22/08/26]

- Direct connection entry validates its remembered schema when hash discovery is available and otherwise delegates verification to the recoverable runtime boundary.
- Runtime retry keeps the selected connection, branch, and schema while replacing failed metadata projections and resetting the Jazz provider boundary.
- Runtime diagnostics may log a redacted error clone; the original error remains internal and is not rendered in the workspace.

[08/08/26]

- A connection or branch replacement remains clientless until the matching registry-backed Jazz provider resolves.
- Provider identity may include persisted connection identity and branch, but never credential material.

[07/08/26]

- Branch changes create a fresh runtime projection before descendants render against the new route identity.
- Schema-hash discovery does not block client and stored-schema workspace readiness.

[07/08/26]

- The runtime provider owns client creation and shutdown; Nano Store listener lifecycles do not own Jazz resources.
- Runtime projection consumers are read-only, while navigation and refresh behavior remain explicit provider commands.

[07/08/26]

- Persisted runtime identity provides the optimistic route target; runtime loading validates and refreshes remote schema metadata.
- Jazz query and mutation consumers receive the app-owned runtime client directly, so client readiness does not change the connected React tree shape.

[31/07/26]

- Connected entry flows open Tables without a header-level view switcher.
- Workspace controls belong in the bottom dock rather than the connected header.

[27/07/26]

- Connection setup routes render without loading the Jazz inspection runtime.
- A validated connection, branch, and schema identity is required before mounting the Jazz runtime provider.
- Branch and schema switching changes the runtime context without adding those values to the content URL.
- Visual tab identity stays internal; table URLs contain only content identity and shareable view state.

## Open design decisions

[30/07/26]

- [ ] Decide the unavailable-resource behavior when a table route does not exist in the newly selected schema.

## Validation checklist

[29/08/26]

- [x] Cover schema switching across Tables index, table detail, and Queries with a real in-memory router.
- [x] Verify focused and package-wide Inspector tests, changed-file lint, typecheck, and production build.

[25/08/26]

- [x] Cover route-owned pagination and query-requested out-of-range correction.
- [x] Verify application formatting, lint, typecheck, build, and package tests.

[25/08/26]

- [x] Cover canonical route and stored-tab search, collision-safe scopes, schema-aware sorting, and safe pagination offsets.
- [x] Verify focused and package-wide Inspector tests, lint, typecheck, and production build.

[25/08/26]

- [x] Cover recent-view restoration, stale recent-table rejection, first-table fallback, and schemas without tables.

[25/08/26]

- [x] Cover runtime replacement without cached schema hydration.
- [x] Verify focused and package-wide Inspector tests, lint, typecheck, and production build.

[24/08/26]

- [x] Cover root entry redirecting to the connections route.
- [x] Verify the focused redirect test, Inspector lint, browser redirect, typecheck, production build, and package-wide tests.

[22/08/26]

- [x] Cover a runtime failure that arrives after the document resumes.

[22/08/26]

- [x] Cover schema and client error classification, original error retention, credential redaction, safe React caught-error reporting, schema retry, same-configuration client recovery, and stale direct-link fallback.
- [x] Cover the workspace retry action without exposing the raw runtime error.
- [x] Verify focused and package-wide Inspector tests, changed-file lint, typecheck, and production build.
- [ ] Verify schema and client recovery against a connected Inspector runtime.

[08/08/26]

- [x] Cover a replacement runtime remaining clientless until its matching client resolves.
- [x] Cover credential replacement under one saved connection id without publishing the retained client.

[08/08/26]

- [x] Cover retained-client replacement across the runtime provider boundary.
- [x] Cover disabled Jazz DevTools auto-attachment.
- [x] Verify focused provider tests, Inspector lint and typecheck, the production build, and package-wide tests.
- [ ] Browser verification covers resolved connection and branch replacement without previous-client queries or a nested Inspector overlay.

[07/08/26]

- [x] Cover branch-keyed runtime replacement and branch-independent cached-schema hydration.
- [x] Cover schema-hash pending presentation without a false empty switcher state.

[07/08/26]

- [x] Cover that permission publication does not rerender schema-only consumers.
- [x] Cover that a cached schema is available before the fresh client and schema requests resolve.

[30/07/26]

- [x] Focused connection-context and route-link tests pass.
- [x] Focused table-tab route-search tests pass.
- [x] Connection-target and runtime schema-hash reuse tests pass.
- [x] Runtime-boundary synchronization tests pass.
- [x] Application typecheck passes.
- [x] Production route generation removes branch and schema path segments.
- [ ] Browser verification covers direct table reload, connection switching, branch switching, and schema switching.

[27/07/26]

- [x] Root boundary regression test passes.
- [x] Application typecheck passes.
- [x] Production output keeps Jazz outside the HTML module-preload closure.
