/**
 * Wraps generic Jazz table mutations for the schema-driven data explorer.
 *
 * The Inspektor builds a dynamic table proxy from stored schema metadata, then uses Jazz's
 * mutation runtime to insert, update, and delete rows without app-generated table code.
 */
import type { TableProxy, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'

import type { DynamicTableRow } from '@tables/tableTypes'

interface UseTableMutationExecutorOptions {
  client: JazzClient | null
  tableName: string
  wasmSchema: WasmSchema | null
}

/**
 * Provides insert, update, and delete actions for one schema-driven Inspektor table.
 *
 * The hook converts stored runtime schema metadata into a dynamic Jazz table proxy, then
 * exposes mutation commands. For example, an update `{ name: "Grace" }` reaches Jazz as a
 * one-column patch; this hook never reconstructs the rest of the row.
 *
 * Each write waits for global durability so the mutation ledger advances only after server
 * acceptance. Branch-aware mutations remain incomplete because this executor supplies no
 * operation-scoped head or base options.
 */
export function useTableMutationExecutor({
  client,
  tableName,
  wasmSchema,
}: UseTableMutationExecutorOptions) {
  const tableProxy =
    wasmSchema === null
      ? null
      : ({
          _table: tableName,
          _schema: wasmSchema,
          // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- Jazz requires a type-only row marker with no runtime value.
          _rowType: undefined as unknown as DynamicTableRow,
          // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- Jazz requires a type-only insert marker with no runtime value.
          _initType: undefined as unknown as Record<string, unknown>,
        } as TableProxy<DynamicTableRow, Record<string, unknown>>)
  const getRuntime = () => {
    if (tableProxy === null || client === null) {
      throw new Error('Table runtime is not loaded.')
    }
    return { client, tableProxy }
  }

  return {
    insertRow: async (values: Record<string, unknown>) => {
      const runtime = getRuntime()
      const insertedRow = await runtime.client.db
        .insert(runtime.tableProxy, values)
        .wait({ tier: 'global' })
      return insertedRow.id
    },
    updateRow: async (rowId: string, values: Record<string, unknown>) => {
      const runtime = getRuntime()
      await runtime.client.db.update(runtime.tableProxy, rowId, values).wait({ tier: 'global' })
    },
    deleteRow: async (rowId: string) => {
      const runtime = getRuntime()
      await runtime.client.db.delete(runtime.tableProxy, rowId).wait({ tier: 'global' })
    },
  }
}
