# Open a connection

A developer opens a saved connection or submits connection values to reach the Tables workspace. A usable credential and an available stored schema are prerequisites.

## Contents

This journey covers entry, runtime handoff, and recoverable connection failure.

- [Resolve entry](#resolve-entry)
- [Start the runtime](#start-the-runtime)
- [Repair a connection](#repair-a-connection)

## Resolve entry

The connection route resolves local intent before it mounts privileged runtime work.

1. Find the saved profile by the route's connection ID.
2. Resolve its credential under [[jazzAccess#Credential boundary]].
3. Discover the schema catalogue with bounded retries for transient failures.
4. Resolve a schema and local workspace context under [[inspectionContext]].
5. Return the complete runtime target.

A missing profile returns to Connections. A missing credential opens the edit form. An unavailable explicit schema is replaced with the resolved schema in the URL.

[[apps/studio/src/routes/conn/$connectionId.tsx#Route]] owns entry. A validated form can hand its discovery result to the route to avoid duplicate requests.

## Start the runtime

Committed entry selects the runtime under [[routing#Accepted workspace selection]]. The boundary records restoration preferences without making them a second runtime authority.

WASM preparation overlaps metadata discovery. Client publication waits for the selected stored schema. The first schema-bound subscription starts Jazz transport work.

Completion means the active destination reports ready, not merely that a client factory resolved. Data destinations wait for their canonical row query to settle. Schema destinations use route and workspace readiness.

See [[runtimeConnectionStartup]] for resource ownership and [[tableQueries]] for data readiness.

## Repair a connection

Classified discovery failure replaces the failed route with the connection edit form.

Authorization, missing-app, and invalid-URL failures identify a field. Network, server, and unknown failures produce one connection-level notice.

Recovery carries a sanitized return URL for the same connection. Successful validation saves the repaired connection and resumes that destination. Authorization recovery displays an empty secret field; it does not silently delete the stored rejected credential.

[[apps/studio/src/app/connections/connectionValidation.ts#getSchemaCatalogueRecoveryError]] owns classification. [[apps/studio/src/app/routing/credentialSafeUrl.ts#getCredentialSafeConnectionReturnUrl]] enforces return scope.

Unexpected runtime or descendant failures remain route-error-boundary concerns. A metadata check cannot establish WebSocket admission or query success.
