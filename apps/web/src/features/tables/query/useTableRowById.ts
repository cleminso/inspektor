import type { DynamicTableRow, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'

import { INSPECTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import type { TableRowId } from '@tables/tableTypes'

import { GenericQueryBuilder } from './genericQueryBuilder'

interface UseTableRowByIdOptions {
  client: Pick<JazzClient, 'manager'> | null
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
}: UseTableRowByIdOptions): DynamicTableRow | null {
  const queryBuilder =
    wasmSchema === null || rowId === null
      ? undefined
      : new GenericQueryBuilder(tableName, wasmSchema).where({ id: { eq: rowId } }).limit(1)
  const queryState = useJazzQueryState<DynamicTableRow>(
    client?.manager ?? null,
    queryBuilder,
    INSPECTOR_QUERY_OPTIONS,
  )

  const row = queryState.data?.[0]
  // This fallback owns only the requested identity; never return another row as active.
  return row !== undefined && String(row.id) === rowId ? row : null
}
