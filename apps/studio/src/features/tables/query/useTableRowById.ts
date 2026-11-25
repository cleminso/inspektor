import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { useMemo, useSyncExternalStore } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useExploration } from '@exploration/provider'

import { TABLE_QUERY_FAILURE_MESSAGE } from '@tables/query/jazzQueryError'
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
  const exploration = useExploration()
  const origin = useRouterState({ select: (state) => state.location.href })
  const observation = useMemo(
    () => exploration.row({ client, schema: wasmSchema, tableName, rowId, origin }),
    [client, exploration, origin, rowId, tableName, wasmSchema],
  )
  const state = useSyncExternalStore(
    observation.subscribe,
    observation.getSnapshot,
    observation.getSnapshot,
  )

  if (rowId === null) {
    return { status: 'idle', row: null }
  }
  if (state.status === 'rejected') {
    return {
      status: 'rejected',
      error: TABLE_QUERY_FAILURE_MESSAGE,
      row: null,
    }
  }
  if (state.status !== 'fulfilled') {
    return { status: 'pending', row: null }
  }

  return { status: 'fulfilled', row: state.row }
}
