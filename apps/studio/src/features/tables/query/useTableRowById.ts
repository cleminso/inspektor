import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { Effect } from 'effect'
import { buildTableRowByIdQuery, projectRowById } from '@inspektor/core/query'

import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { TABLE_QUERY_FAILURE_MESSAGE } from '@tables/query/jazzQueryError'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'

interface UseTableRowByIdOptions {
  client: JazzClient | null
  rowId: TableRowId | null
  tableName: string
  wasmSchema: WasmSchema | null
}

/** Loads an edited row only when the visible table query does not already own it. */
export function useTableRowById({
  client,
  rowId,
  tableName,
  wasmSchema,
}: UseTableRowByIdOptions):
  | { status: 'idle' | 'pending'; row: null }
  | { status: 'fulfilled'; row: DynamicTableRow | null }
  | { status: 'rejected'; error: string; row: null } {
  const queryBuilder =
    wasmSchema === null || rowId === null
      ? undefined
      : Effect.runSync(buildTableRowByIdQuery({ schema: wasmSchema, tableName, rowId }))
  const queryState = useJazzQueryState<DynamicTableRow>(
    client,
    queryBuilder,
    INSPEKTOR_QUERY_OPTIONS,
  )

  if (rowId === null) {
    return { status: 'idle', row: null }
  }
  if (queryState.status === 'rejected') {
    return {
      status: 'rejected',
      error: TABLE_QUERY_FAILURE_MESSAGE,
      row: null,
    }
  }
  if (queryState.status !== 'fulfilled') {
    return { status: 'pending', row: null }
  }

  const result = projectRowById(queryState, rowId)
  return { status: 'fulfilled', row: result.status === 'fulfilled' ? result.row : null }
}
