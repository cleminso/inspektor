/**
 * Central route path definitions for Inspektor runtime state.
 *
 * Content routes identify one saved local connection. Schema hashes and branch labels remain
 * connection preferences; branch labels scope local state but do not select Jazz data.
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
