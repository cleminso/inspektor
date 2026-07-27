# Routing

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[27/07/26]

- [x] Keep connection storage, onboarding navigation, and route identity in a dependency-light root session provider.
- [x] Mount the Jazz runtime provider at the complete connection, branch, and schema route boundary.
- [x] Share one Jazz runtime across table and query-subscription descendants.
- [x] Dynamically load Jazz schema-hash helpers only when navigation needs remote metadata.
- [x] Keep the shared connection switcher on the root session context so it works in onboarding and connected layouts.
- [x] Cover the application-root import boundary with a regression test that rejects Jazz initialization.
- [x] Cover the connection switcher import boundary so it cannot depend on the connection-scoped runtime provider.

## Open product work

[27/07/26]

- [ ] Decide whether to remove branch and schema hash segments from product URLs.

## Work outside the foundation scope

[27/07/26]

- Changing route URL semantics is outside the import-boundary implementation.

## Settled interaction decisions

[27/07/26]

- Connection setup routes render without loading the Jazz inspection runtime.
- A complete connection, branch, and schema identity is required before mounting the Jazz runtime provider.

## Open design decisions

[27/07/26]

- [ ] Choose between connection-scoped routes such as `conn/tables/*` and top-level routes such as `tables/*` if URL simplification proceeds.

## Validation checklist

[27/07/26]

- [x] Root boundary regression test passes.
- [x] Application typecheck passes.
- [x] Production output keeps Jazz outside the HTML module-preload closure.
