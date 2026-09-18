import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'

import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import { TABLE_PROVENANCE_COLUMN_NAMES } from '@tables/tableProvenance'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'

import { GenericQueryBuilder } from './genericQueryBuilder'

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
      : new GenericQueryBuilder(tableName, wasmSchema)
          .select('*', ...TABLE_PROVENANCE_COLUMN_NAMES)
          .where({ id: { eq: rowId } })
          .limit(1)
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
      error:
        queryState.error instanceof Error ? queryState.error.message : String(queryState.error),
      row: null,
    }
  }
  if (queryState.status !== 'fulfilled') {
    return { status: 'pending', row: null }
  }

  const row = queryState.data[0]
  // This fallback owns only the requested identity; never return another row as active.
  return {
    status: 'fulfilled',
    row: row !== undefined && String(row.id) === rowId ? row : null,
  }
}
