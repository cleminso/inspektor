/**
 * Central route path definitions for Inspector runtime state.
 *
 * Content routes identify one saved local connection. Branch and schema remain persisted
 * connection preferences displayed by the Inspector header.
 */
export const appRoutes = {
  connections: '/conn',
  newConnection: '/conn/new',
  connection: '/conn/$connectionId',
  tables: '/conn/$connectionId/tables',
  queries: '/conn/$connectionId/queries',
  table: '/conn/$connectionId/tables/$tableName',
} as const
