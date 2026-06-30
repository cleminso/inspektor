# Routing MVP Rules

## Table of Contents

- [Goal](#goal)
- [Canonical Routes](#canonical-routes)
- [Route Rules](#route-rules)
- [State Ownership Rules](#state-ownership-rules)
- [Connection Rules](#connection-rules)
- [Branch Rules](#branch-rules)
- [Schema Rules](#schema-rules)
- [Navigation Rules](#navigation-rules)
- [Deferred for Later](#deferred-for-later)

## Goal

Build a Jazz inspector alternative MVP with clear routing and scaffolding first.

UI polish is not the priority.

## Canonical Routes

- `/conn`
- `/conn/new`
- `/conn/$connectionId/$branch/$schemaHash/tables`
- `/conn/$connectionId/$branch/$schemaHash/tables/$tableName`

## Route Rules

- `/conn` is the connection entry and manager screen
- `/conn/new` is the add new connection screen
- `/conn/$connectionId` is redirect-only
- `/conn/$connectionId/$branch` is redirect-only
- `/conn/$connectionId/$branch/$schemaHash` is redirect-only
- `/conn/$connectionId/$branch/$schemaHash/tables` is the canonical workspace route
- `/conn/$connectionId/$branch/$schemaHash/tables/$tableName` is the selected table route
- Use plural `tables`, not `table`

## State Ownership Rules

- Inside workspace routes, the URL is authoritative
- Local storage is for convenience and defaults only
- Route state and persisted state must not fight each other
- Routes own workspace identity
- Storage owns saved connection data and remembered defaults

## Connection Rules

- A connection is identified by `connectionId`
- Connection identity includes saved server/app credentials and env
- Connection identity does not include branch
- Connection identity does not include schema hash
- The user can switch connection from inside the workspace
- Adding a new connection may leave the workspace and go to `/conn/new`

## Branch Rules

- Branch is route context, not connection identity
- Branch source is local remembered branches plus manual input
- Do not assume a server-backed branch listing API for the MVP
- Do not imply that branch creation is a stronger primitive than opening a branch context

## Schema Rules

- Schema hash is route context, not connection identity
- Schema selection must resolve to a canonical workspace route
- Schema switching happens through navigation, not through runtime-only state
- The current fallback schema selection policy is provisional and can be refined later

## Navigation Rules

- Navigation should resolve the final canonical workspace route before navigating
- Redirect routes exist only as fallback entry points
- Workspace switching should not require returning to `/conn`
- Deep-linking from `pnpm dev` output is in scope for the local `/conn/new` flow
- Emitted terminal link should match upstream param parity and use `/conn/new#serverUrl=...&appId=...&adminSecret=...`

## Deferred for Later

- server-backed branch discovery
- schema metadata driven schema selection
- edit connection route design
- query subscriptions routes
- table schema route if not needed for MVP
