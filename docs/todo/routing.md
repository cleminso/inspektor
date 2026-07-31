# Routing

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[31/07/26]

- [x] Enter connected workspaces through the Tables route.
- [x] Remove the Tables and Subscriptions ToggleGroup from the connected header.
- [x] Reserve an inactive Activity control in the bottom dock for the Subscriptions dock.

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
