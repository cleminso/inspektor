# Jazz access

The browser connects directly to the configured Jazz server with privileged admin credentials. Stored schema metadata drives generic reads and mutations.

## Contents

This contract defines credential handling, metadata inputs, and operation boundaries.

- [Credential boundary](#credential-boundary)
- [Metadata access](#metadata-access)
- [Rows and writes](#rows-and-writes)

## Credential boundary

Secret-free profiles can persist in local storage. Admin secrets use memory by default.

Opted-in retention stores a credential in the tab's `sessionStorage`. Every active credential also enters the memory vault. Restored credentials must match the normalized server URL and app ID of the saved profile.

[[apps/studio/src/app/connections/connectionCredentials.ts#resolveRuntimeConnection]] returns no runtime connection when credentials are absent or mismatched. The edit form then requests secret re-entry.

Session retention follows browser tab restoration and opener-copy behavior; it is not durable account storage. Storage-access failure must not silently claim that an old session secret was removed.

URLs never carry admin secrets. [[apps/studio/src/app/routing/credentialSafeUrl.ts]] removes case-insensitive `adminSecret` parameters from search and supported hash forms. Recovery returns only to the same connection.

Browser profiles, inspected rows, and connection captures remain sensitive. Credential retention is not an application-user authentication or authorization system.

## Metadata access

Connection discovery needs the server URL, app ID, and admin secret before runtime creation.

[[apps/studio/src/app/routing/inspectorNavigation.ts#fetchConnectionSchemaCatalogue]] fetches schema hashes and published permission bundles with `X-Jazz-Admin-Secret`. It places the latest published bundle's schema first. Bundle failure does not discard a successful catalogue.

[[apps/studio/src/app/runtime/useInspectorRuntime.tsx#useInspectorRuntime]] fetches the selected stored schema by hash and loads the latest published permission bundle separately. No bundles means no permission document. These requests do not establish a schema-version-matched permission snapshot or identify the bundle pinned by another session.

Schema defines tables, column types, nullability, defaults, and references. The Schema representation exposes schema and permission documents; it does not predict whether an individual mutation will succeed.

Jazz owns permission enforcement. Displaying permission structures is not local authorization enforcement.

## Rows and writes

Studio uses generic runtime builders and table proxies rather than generated inspected-app code.

[[apps/studio/src/features/tables/query/genericQueryBuilder.ts]] adapts stored schema to Jazz queries. [[tableQueries]] owns subscription readiness and cleanup.

[[apps/studio/src/features/tables/rowEditor/mutation/useTableMutation.ts#useTableMutationExecutor]] submits insert, sparse update, and delete operations and waits for global durability. The same executor reads a row remotely after update.

The executor supplies no branch or base options. [[inspectionContext#Schema and branch]] defines that limit. Local field support and validation do not replace Jazz admission or persistence checks.

[[rowChanges]] owns value intent and [[changeRow]] owns the user-visible continuation after success or failure.
