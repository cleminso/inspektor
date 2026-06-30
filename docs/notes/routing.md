# Inspector Route Structure

## Table of Contents

- [Mental Model](#mental-model)
- [Decisions](#decisions)
  - [Route Structure](#route-structure)
  - [Key Design Decisions](#key-design-decisions)
  - [Alternative Approaches Considered](#alternative-approaches-considered)
- [Key Questions Explored](#key-questions-explored)
- [UI Pattern](#ui-pattern)
- [Inspector Link Prefill](#inspector-link-prefill)
- [Extension Mode](#extension-mode)
- [Example URLs](#example-urls)

## Mental Model

The route structure follows a clear hierarchy of narrowing context:

```
where → when → which version
(Conn) (Branch) (Schema)
```

**Header (Context)**: Where you're working

- **Connection**: Who and where (server URL, appId, credentials)
- **Branch**: Which timeline (main, feature-x)
- **Schema**: Which version of the database structure (schema hash)

**Sidebar (What)**: What you're viewing

- **Data Explorer**: Browse tables and their data
- **Query Subscriptions**: Monitor active subscriptions and queries

## Decisions

### Route Structure

```
/conn/:connectionId/:branch/:schema/
├── tables/
│   └── $tableName/
│       ├── index.tsx       → Data view
│       └── schema.tsx      → Schema definition view
└── queries.tsx             → Live queries
```

**TanStack Router file layout:**

```
src/routes/
├── conn/
│   └── $connectionId/
│       └── $branch/
│           └── $schemaHash/
│               ├── tables/
│               │   ├── index.tsx           → Tables list
│               │   └── $tableName/
│               │       ├── index.tsx       → Data view
│               │       └── schema.tsx      → Schema definition view
│               ├── queries.tsx             → Live queries/subscriptions
│               └── index.tsx               → Redirect to data-explorer
├── conn/
│   └── index.tsx                         → Connection manager
└── __root.tsx
```

### Key Design Decisions

| Decision                                   | Rationale                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| **Connection as top-level param**          | Primary unit of work; enables multiple tabs with different connections         |
| **Branch in URL path**                     | Frequently switched; users want to compare data across branches                |
| **Schema in URL path**                     | Frequently switched for debugging; enables historical schema viewing           |
| **Schema nested without label**            | Schema is the only thing at this level; `/schema/` would be redundant          |
| **Tables in sidebar**                      | Tables are "what" you view, not context; sidebar navigation keeps header clean |
| **Connection picker shows appId + server** | Clarifies which environment (e.g., "019df714 @ prod.server.com")               |

### Alternative Approaches Considered

1. **Without schema in path**: `/conn/:id/:branch/tables/:name?schema=abc123`
   - Rejected: Schema switching is frequent enough to warrant first-class URL treatment

2. **With explicit schema segment**: `/conn/:id/:branch/schema/:schema/tables/:name`
   - Rejected: The word "schema" adds no disambiguation (nothing else occupies that level)

3. **App-first hierarchy**: `/app/:appId/conn/:connId/:branch/...`
   - Rejected: Creates false hierarchy; connection IS the primary context

4. **Branch as query param**: `/conn/:id/tables/:name?branch=feature-x`
   - Rejected: Branch is fundamental to the view, not an optional filter

## Key Questions Explored

### Q: Should we include connection ID in the route?

**A:** Yes. Connection is the primary context that determines server, appId, and credentials. Without it in the URL, bookmarking and multi-tab workflows are impossible.

### Q: Can we group connections by appId in the URL?

**A:** No. While multiple connections can share an appId, they point to different servers (prod vs staging vs local). Grouping by appId would add navigation friction (app → connection → branch vs just connection → branch).

### Q: Is there only one schema per branch?

**A:** No. Schema and branch are orthogonal. A branch can have multiple schema versions over time, and you may want to view historical schemas on any branch.

### Q: Should schema be in the URL path or query param?

**A:** Path. Users switch schemas frequently for debugging and comparison. Treating it as a query param makes it feel secondary.

### Q: What's the difference between header "Schema" dropdown and table "Schema" button?

**A:** Two different concepts with confusingly similar names:

- **Header dropdown**: Schema _version_ selection (app-wide, affects all tables)
- **Table button**: Schema _definition_ view (structure of the selected table)

In the new design, the header dropdown becomes the schema breadcrumb segment.

## UI Pattern

**Header (Context Bar)** - Three-level breadcrumb:

```
[My App @ prod.server ▼] / [main ▼] / [c2e394d6 ▼]
```

Each segment is clickable:

- **Connection**: Shows all saved connections grouped by server
- **Branch**: Shows remembered branches for this connection and allows manual branch entry
- **Schema**: Shows available schema hashes for this connection context

**Sidebar (Navigation)** - What you're viewing:

```
TABLES
├── users
├── posts
├── orders
└── ...

QUERY SUBSCRIPTIONS
```

Clicking a table navigates to `/conn/:id/:branch/:schema/tables/:tableName`

## Inspector Link Prefill

Verified upstream behavior:

- `packages/jazz-tools/src/dev/managed-runtime.ts` emits runtime facts such as server URL, app id, and schema publication state
- `packages/jazz-tools/src/dev/vite.ts` emits the `Open the inspector:` log line
- `packages/jazz-tools/src/dev/inspector-link.ts` builds the inspector URL with hash params for:
  - `serverUrl`
  - `appId`
  - `adminSecret`

For this repo, the local equivalent should target:

`http://regarde.inspector.localhost:1355/conn/new#serverUrl=<encoded>&appId=<encoded>&adminSecret=<encoded>`

This preserves strict upstream emitted-link parity while routing into the local add-connection flow.

## Extension Mode

For the browser extension (no saved connections):

```
/conn/extension/default/current/tables/:name
```

Uses fixed "extension" connectionId and "default" branch identifiers.

## Example URLs

```
# Production app, main branch, current schema, users table
/conn/prod-app/main/c2e394d6/tables/users

# Same table in historical schema
/conn/prod-app/main/abc1234f/tables/users

# Same table on feature branch
/conn/prod-app/feature-auth/c2e394d6/tables/users

# Schema definition view for a table
/conn/prod-app/main/c2e394d6/tables/users/schema

# Tables list (default view)
/conn/prod-app/main/c2e394d6/tables

# Live queries
/conn/prod-app/main/c2e394d6/queries
```
