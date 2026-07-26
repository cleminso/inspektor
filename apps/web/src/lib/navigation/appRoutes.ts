/**
 * Central route path definitions for Inspector runtime state.
 *
 * Connection ID, branch, and schema hash are encoded in URLs because they identify the
 * Jazz context required to rebuild schema-driven explorer views from a refresh or link.
 */
export const appRoutes = {
  connections: "/conn",
  newConnection: "/conn/new",
  connection: "/conn/$connectionId",
  branch: "/conn/$connectionId/$branch",
  schema: "/conn/$connectionId/$branch/$schemaHash",
  tables: "/conn/$connectionId/$branch/$schemaHash/tables",
  QuerySubscriptions: "/conn/$connectionId/$branch/$schemaHash/query-subscriptions",
  table: "/conn/$connectionId/$branch/$schemaHash/tables/$tableName",
} as const;
