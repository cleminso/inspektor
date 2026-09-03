/**
 * Central route path definitions for Inspector runtime state.
 *
 * Content routes identify one saved local connection. Branch and schema remain persisted
 * connection preferences displayed by the Inspector header.
 */
export const appRoutes = {
  connections: '/conn',
  newConnection: '/conn/new',
  editConnection: '/conn/edit/$connectionId',
  connection: '/conn/$connectionId',
  tables: '/conn/$connectionId/tables',
  liveQueries: '/conn/$connectionId/live-queries',
  table: '/conn/$connectionId/tables/$tableName',
} as const
