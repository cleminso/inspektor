# Jazz runtime connection startup

This document separates connection startup into three phases so each delay has an owner and a matching optimization.

## Table of contents

This table of contents links to the document sections.

- [Purpose](#purpose)
- [Connection startup phases](#connection-startup-phases)
- [Phase 1: before WebSocket creation](#phase-1-before-websocket-creation)
- [Phase 2: WebSocket creation through HTTP upgrade](#phase-2-websocket-creation-through-http-upgrade)
- [Phase 3: socket open through authenticated transport](#phase-3-socket-open-through-authenticated-transport)
- [Measurement boundaries](#measurement-boundaries)
- [Optimization order](#optimization-order)
- [Production captures](#production-captures)
- [Security](#security)

## Purpose

"WebSocket handshake" can refer to app startup, the HTTP upgrade, or Jazz authentication. Those phases have different owners.

Treating the phases as one duration leads to the wrong fix. Rendering work cannot reduce server
upgrade latency. Server placement cannot fix an app that waits to issue its first subscription.

## Connection startup phases

Connection startup crosses Inspektor, React, the browser, the network, and Jazz.

```text
Phase 1: app and Jazz client preparation
runtime metadata → client publication → first schema-bound subscription → new WebSocket

Phase 2: browser and HTTP upgrade
new WebSocket → upgrade request → HTTP 101 → browser open event

Phase 3: Jazz authentication and transport readiness
auth prelude → client hello → server admission → server hello → native upstream installed
```

`createInspectorAdminClient()` returns a lazy client. It does not open a WebSocket or prove that the
server accepted the credentials. The first schema-bound query or subscription materializes the native
runtime and transport.

## Phase 1: before WebSocket creation

The first phase covers work before Jazz calls the browser's `WebSocket` constructor.

Inspektor owns:

- schema-catalogue and selected-schema acquisition
- provider placement and identity
- React render and effect scheduling
- client publication gates
- the point at which the first remote subscription mounts

Jazz owns:

- schema normalization and policy preparation
- native in-memory runtime creation
- transport setup before the WebSocket constructor

Inspektor currently prepares WASM while catalogue discovery runs. `InspectorProvider` publishes the
client only after the selected stored schema is ready. Workspace children mount with nullable runtime
state, and their first schema-bound subscription causes Jazz to create the transport.

The unhappy path is a long provider commit or a remount before the client effect and first subscription
run. Hidden workspace rendering can delay socket creation because CSS visibility does not defer React
work. Unstable route ancestry can then repeat the whole phase by replacing the runtime provider.

Possible Inspektor changes are:

1. Keep runtime-provider ancestry stable across navigation.
2. Start client preparation before mounting expensive workspace descendants.
3. Reduce effect turns between selected-schema readiness, client publication, and the first subscription.
4. Preserve the client when only operation-level state, such as branch, changes.
5. Keep WASM preparation and metadata acquisition parallel.

Do not gate workspace rendering or move client ownership without a production trace. A change that
opens the socket earlier can still delay the first useful table render.

## Phase 2: WebSocket creation through HTTP upgrade

The second phase starts when Jazz calls the browser WebSocket constructor and ends when the browser opens the socket.

The browser performs connection scheduling, DNS lookup, TCP connection, TLS negotiation, and the HTTP
upgrade. Network distance, an edge proxy, and the Jazz server's upgrade handler can add delay. Jazz
credentials are not validated before the HTTP `101`; the client sends them after the socket opens.

Inspektor cannot shorten this phase through React or metadata changes. Investigate it by separating:

- browser queueing before the request
- DNS, TCP, and TLS setup
- request transit time
- proxy and server wait before the `101`

Test an origin preconnect as an experiment, not an assumption. Browser WebSocket connection reuse
depends on browser and transport behavior. Server placement, proxy configuration, and server readiness
matter only after measurements assign delay to those boundaries.

## Phase 3: socket open through authenticated transport

The third phase covers the Jazz protocol after the browser opens the socket.

Jazz performs this sequence:

1. The client sends the admin credential prelude.
2. The client sends its wire hello.
3. The server parses the prelude and validates admission.
4. The server negotiates wire features and opens a serving session.
5. The server sends its wire hello.
6. The client installs the negotiated native upstream and starts its pumps and subscriptions.

The HTTP `101` does not prove authenticated readiness. The strongest client-side readiness boundary is
the installed native upstream. A first remote query result occurs later and also includes query
execution and data transfer.

Improvements in this phase require Jazz client, Jazz server, network, or infrastructure changes. Useful
Jazz capabilities would include:

- an eager preconnect API that accepts a schema
- a transport-readiness promise or event
- redacted lifecycle events for socket creation, open, server hello, and native admission
- server spans around prelude receipt, credential validation, session opening, and hello delivery

Cross-schema client reuse is not an Inspektor-only optimization. Jazz binds a `Db` runtime to its
schema, so arbitrary schema reuse needs an upstream design change.

## Measurement boundaries

Measure one monotonic timeline across the app and Jazz where public hooks permit it.

Record these boundaries:

1. WASM preparation start, completion, and cache status.
2. Admin-client factory call and resolution.
3. Selected-schema request start and completion.
4. Client publication.
5. First schema-bound subscription entry.
6. Native runtime creation start and completion.
7. WebSocket construction.
8. HTTP upgrade request and `101` response.
9. Browser open event.
10. Auth prelude and client hello send.
11. Server hello receipt.
12. Native upstream installation.
13. First remote subscription result.

Chrome network timing can separate browser queueing, connection setup, request transfer, and server
wait. Jazz server spans are required to divide admission, session opening, and hello delivery. Do not
infer server work from a client-only trace.

## Optimization order

Optimize connection startup in this order.

1. Capture a cold production run and a warm production run.
2. Remove duplicate app work, provider remounts, and serialized WASM or metadata requests.
3. Reduce app-owned delay before WebSocket construction when production evidence shows it.
4. Measure the HTTP upgrade by browser, network, proxy, and server boundary.
5. Measure Jazz authentication and native admission with client and server events.
6. Add or request an eager Jazz transport API only when lazy transport creation remains the limiting phase.

Re-run the same capture after each change. A faster early phase has no user-visible benefit when a later
phase remains longer and independent.

## Production captures

A cold capture measures production code with no reusable browser cache or saved connection state.

Use the deployed application for network conclusions. Open a fresh browser context, open DevTools,
disable the cache, and clear the network log. Enter connection values before recording. Start the
performance recording, submit once, wait for the first table to become interactive, then export both
the performance trace and HAR.

A warm capture measures a returning connection. Keep the same browser context and cache, enable the
cache, reload the saved connection route, and record until the first table becomes interactive. Label
the captures separately because add-connection and saved-connection entry are different paths.

`pnpm --filter inspektor preview` serves a production bundle through Wrangler. It is useful for finding
development-only React or module behavior. It does not replace a deployed capture for CDN, network,
edge, or sync-server conclusions.

## Security

Connection captures contain privileged data and remain private.

A HAR can contain request headers, saved connection identifiers, and the Jazz authentication prelude
inside WebSocket messages. A performance trace can contain URLs and application state. Do not commit
raw captures or attach them to public issues. Sanitize copies rather than modifying the only original.
