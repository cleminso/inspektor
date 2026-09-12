import { useEffect, useMemo } from 'react'
import { atom, type ReadableAtom, type WritableAtom } from 'nanostores'

import {
  fetchStoredPermissions,
  fetchStoredWasmSchema,
  type StoredPermissionsResponse,
  type WasmSchema,
} from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'

import type { StoredConnection } from '@app/connections/connections'
import type { SchemaCatalogueRecord } from '@app/routing/inspectorNavigation'
import {
  normalizeRuntimeError,
  reportRuntimeError,
  type InspectorRuntimeError,
} from '@app/runtime/runtimeError'

export interface InspectorRuntimeStore {
  $client: ReadableAtom<JazzClient | null>
  $error: ReadableAtom<InspectorRuntimeError | null>
  $isPermissionsLoading: ReadableAtom<boolean>
  $isWasmSchemaLoading: ReadableAtom<boolean>
  $schemaCatalogue: ReadableAtom<readonly SchemaCatalogueRecord[]>
  $storedPermissions: ReadableAtom<StoredPermissionsResponse | null>
  $wasmSchema: ReadableAtom<WasmSchema | null>
  clearClient: (client: JazzClient) => void
  publishClient: (client: JazzClient) => void
  publishClientError: (error: unknown) => void
}

interface MutableInspectorRuntimeStore extends InspectorRuntimeStore {
  $client: WritableAtom<JazzClient | null>
  $error: WritableAtom<InspectorRuntimeError | null>
  $isPermissionsLoading: WritableAtom<boolean>
  $isWasmSchemaLoading: WritableAtom<boolean>
  $schemaCatalogue: WritableAtom<readonly SchemaCatalogueRecord[]>
  $storedPermissions: WritableAtom<StoredPermissionsResponse | null>
  $wasmSchema: WritableAtom<WasmSchema | null>
}

interface UseInspectorRuntimeOptions {
  connection: StoredConnection | null
  branch: string | null
  schemaHash: string | null
  initialSchemaCatalogue?: readonly SchemaCatalogueRecord[]
  retryGeneration?: number
}

function createInspectorRuntimeStore(
  isWasmSchemaLoading: boolean,
  sensitiveValues: readonly string[],
): MutableInspectorRuntimeStore {
  const $client = atom<JazzClient | null>(null)
  const $wasmSchema = atom<WasmSchema | null>(null)
  const $storedPermissions = atom<StoredPermissionsResponse | null>(null)
  const $schemaCatalogue = atom<readonly SchemaCatalogueRecord[]>([])
  const $error = atom<InspectorRuntimeError | null>(null)
  const $isPermissionsLoading = atom(isWasmSchemaLoading)
  const $isWasmSchemaLoading = atom(isWasmSchemaLoading)

  const publishClient = (client: JazzClient) => {
    $client.set(client)
  }

  const clearClient = (client: JazzClient) => {
    // Cleanup from an old provider must not clear a replacement client published into this store.
    if ($client.get() === client) {
      $client.set(null)
    }
  }

  const publishClientError = (error: unknown) => {
    $client.set(null)
    if ($error.get() !== null) {
      return
    }
    const runtimeError = { source: 'client', error: normalizeRuntimeError(error) } as const
    $error.set(runtimeError)
    reportRuntimeError(runtimeError, sensitiveValues)
  }

  return {
    $client,
    $error,
    $isPermissionsLoading,
    $isWasmSchemaLoading,
    $storedPermissions,
    $schemaCatalogue,
    $wasmSchema,
    clearClient,
    publishClient,
    publishClientError,
  }
}

/**
 * Loads stored schema and permissions into independently subscribable runtime projections.
 *
 * The route supplies the initial schema catalogue, while `InspectorProvider` owns Jazz client
 * creation and publishes the verified client into this store. Replacing the runtime identity or
 * retry generation replaces the store so stale asynchronous work cannot update the active runtime.
 * The branch label partitions local runtime state only; it does not configure Jazz operations.
 */
export function useInspectorRuntime({
  connection,
  branch,
  schemaHash,
  initialSchemaCatalogue,
  retryGeneration = 0,
}: UseInspectorRuntimeOptions): InspectorRuntimeStore {
  const runtime = useMemo(
    () =>
      createInspectorRuntimeStore(
        connection !== null && branch !== null && schemaHash !== null,
        connection === null ? [] : [connection.adminSecret],
      ),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Retry intentionally replaces the runtime store.
    [branch, connection, retryGeneration, schemaHash],
  )

  useEffect(() => {
    if (connection === null || branch === null || schemaHash === null) {
      return
    }

    let active = true
    const failRuntime = (error: unknown) => {
      if (active === false) {
        return
      }
      if (runtime.$error.get() === null) {
        const runtimeError = { source: 'schema', error: normalizeRuntimeError(error) } as const
        runtime.$error.set(runtimeError)
        reportRuntimeError(runtimeError, [connection.adminSecret])
      }
      runtime.$isWasmSchemaLoading.set(false)
    }

    runtime.$isWasmSchemaLoading.set(true)
    runtime.$isPermissionsLoading.set(true)
    runtime.$schemaCatalogue.set(initialSchemaCatalogue ?? [])

    const schemaRequest = fetchStoredWasmSchema(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
      schemaHash,
    }).then(({ schema }) => {
      if (active === false) {
        return
      }
      runtime.$wasmSchema.set(schema)
      runtime.$isWasmSchemaLoading.set(false)
    })

    void fetchStoredPermissions(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    }).then(
      (permissions) => {
        if (active === true) {
          runtime.$storedPermissions.set(permissions)
          runtime.$isPermissionsLoading.set(false)
        }
      },
      () => {
        if (active === true) {
          runtime.$isPermissionsLoading.set(false)
        }
      },
    )

    void schemaRequest.catch(failRuntime)

    return () => {
      active = false
    }
  }, [branch, connection, initialSchemaCatalogue, runtime, schemaHash])

  return runtime
}
