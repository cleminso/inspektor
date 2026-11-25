import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { createTableAccess, type JazzClient } from '@inspektor/core/jazz/client'
import type { WasmSchema } from 'jazz-tools'
import { useTableWriteCoordinator } from '@tables/mutationLedger/provider'

interface UseTableMutationExecutorOptions {
  client: JazzClient | null
  tableName: string
  wasmSchema: WasmSchema | null
}

/** @lat: [[jazzAccess#Rows and writes]] */
export function useTableMutationExecutor({
  client,
  tableName,
  wasmSchema,
}: UseTableMutationExecutorOptions) {
  const { coordinator, attach } = useTableWriteCoordinator()
  const access = useMemo(
    () =>
      client === null || wasmSchema === null
        ? null
        : createTableAccess({ client, tableName, schema: wasmSchema }),
    [client, tableName, wasmSchema],
  )
  useLayoutEffect(() => {
    attach(access)
  }, [access, attach])
  useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot, coordinator.getSnapshot)
  // Method identity is the runtime identity used by the editor's late-settlement guard.
  return useMemo(
    () => ({
      ...coordinator,
      get pendingWrite() {
        return coordinator.getSnapshot().pendingWrite
      },
      get reloadRequired() {
        return coordinator.getSnapshot().reloadRequired
      },
      get retired() {
        return coordinator.getSnapshot().retired
      },
      get retirementMessage() {
        return coordinator.getSnapshot().retirementMessage
      },
    }),
    [coordinator],
  )
}
