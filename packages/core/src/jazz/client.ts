import { Effect, Schema, type Scope } from 'effect'
import { TypedTableQueryBuilder, type WasmSchema } from 'jazz-tools'
// Jazz exports privileged browser acquisition only through this diagnostic entry.
import { createInspectorAdminClient } from 'jazz-tools/_dev/inspector-client'
import type { JazzClient } from 'jazz-tools/client'
import {
  tableProvenanceColumnNames,
  type DynamicTableMeta,
  type DynamicTableRow,
} from '../studio/query.ts'
import type { TableWriteAccess } from '../studio/write.ts'

export type { JazzClient } from 'jazz-tools/client'

export class ClientError extends Schema.TaggedError<ClientError>()('ClientError', {
  cause: Schema.Unknown,
}) {}

export type AdminClientConfig = Parameters<typeof createInspectorAdminClient>[0]

/**
 * This acquisition is deliberately uninterruptible once Jazz starts creating the
 * client. Scope closure waits for it, then shuts down the full client exactly once.
 */
export const acquireAdminClient = (
  config: AdminClientConfig,
): Effect.Effect<JazzClient, ClientError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () => createInspectorAdminClient(config),
      catch: (cause) => new ClientError({ cause }),
    }),
    (client) => Effect.promise(() => client.shutdown()),
  )

/**
 * @lat: [[jazzAccess#Rows and writes]]
 * Bind public native read and submission methods to an existing client. Returned
 * handles are the original Jazz objects. This adapter does not acquire a client,
 * wait for a write, reconstruct sparse patches, or choose defaults or permissions.
 */
export function createTableAccess(options: {
  readonly client: JazzClient
  readonly tableName: string
  readonly schema: WasmSchema
}): TableWriteAccess<DynamicTableRow> {
  const { client, tableName, schema } = options
  const table = new TypedTableQueryBuilder<DynamicTableMeta>(tableName, schema)
  return {
    owner: client,
    readRow: async (rowId) => {
      const query = table
        .select('*', ...tableProvenanceColumnNames)
        .where({ id: { eq: rowId } })
        .limit(1)
      const rows = await client.db.all(query, { tier: 'remote' })
      const row = rows[0]
      return row !== undefined && row.id === rowId ? row : null
    },
    insert: (values) => client.db.insert(table, values),
    update: (rowId, values) => client.db.update(table, rowId, values),
    delete: (rowId) => client.db.delete(table, rowId),
  }
}
