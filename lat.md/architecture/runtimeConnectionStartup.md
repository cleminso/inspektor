# Runtime connection startup

Runtime startup separates local preparation, WebSocket opening, and authenticated query readiness. Each boundary has a different owner.

## Contents

This contract owns client publication, cleanup, and startup evidence.

- [Connection startup phases](#connection-startup-phases)
- [Runtime ownership](#runtime-ownership)
- [Readiness and evidence](#readiness-and-evidence)

## Connection startup phases

Connection startup crosses Studio, Jazz, the browser, and the remote server.

1. Studio resolves metadata and prepares WASM. Jazz client creation overlaps stored-schema loading. Publication waits for verified schema.
2. The first schema-bound subscription materializes Jazz's native runtime and transport. The browser opens the WebSocket through the HTTP upgrade.
3. Jazz authenticates and negotiates its transport. The active query then settles through the remote serving authority.

`createInspectorAdminClient()` is lazy. Its resolution neither opens a socket nor proves server acceptance. An HTTP upgrade does not prove authenticated readiness.

[[apps/studio/src/app/providers/inspectorProvider.tsx#InspectorProvider]] documents the lazy boundary. [[apps/studio/src/app/runtime/jazzWasmPreparation.ts#prepareJazzWasm]] shares preparation across entry paths.

Production pins an external WASM artifact and excludes the bundled fallback from deployment. When Jazz changes, verify that the hosted artifact matches the installed package bytes; a version label alone does not prove compatibility.

## Runtime ownership

The runtime provider owns the privileged client and its cleanup.

[[apps/studio/src/app/providers/inspectorProvider.tsx]] creates the client after shared WASM preparation and publishes it only when schema is available without runtime error.

Failure, replacement, or unmount shuts down owned clients. A client that resolves after its attempt retires is also shut down. Stale metadata work cannot publish into the replacement runtime.

[[apps/studio/src/app/runtime/useInspectorRuntime.tsx#useInspectorRuntime]] loads schema and permissions independently. Permission-load failure ends permission loading; it does not itself establish a fatal schema failure.

Workspace children consume nullable runtime state. Hiding content does not defer its React work. Stable ancestry under [[routing#Stable route ancestry]] prevents accidental startup repetition.

## Readiness and evidence

A first query result includes more work than socket opening or client publication.

Measure these boundaries separately when diagnosing startup. Client traces cannot divide remote credential validation, session setup, or server execution without server evidence.

Query readiness follows [[tableQueries]], not a transport timer or callback-count guess. A written startup contract does not establish measured performance or complete remote replay.

HAR files, WebSocket frames, and browser traces can contain admin credentials or inspected data. Keep raw captures private and sanitize copies before sharing.
