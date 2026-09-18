import { useEffect, useMemo } from 'react'
import { atom, type ReadableAtom, type WritableAtom } from 'nanostores'

import {
  fetchStoredPermissions,
  fetchStoredWasmSchema,
  type StoredPermissionsResponse,
  type WasmSchema,
} from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'

import type { RuntimeConnection } from '@app/connections/connections'
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
  getMetadataRequests: () => RuntimeMetadataRequests | null
  publishSchemaError: (error: unknown) => void
}

interface RuntimeMetadataRequests {
  permissions: ReturnType<typeof fetchStoredPermissions>
  schema: ReturnType<typeof fetchStoredWasmSchema>
}

interface UseInspectorRuntimeOptions {
  connection: RuntimeConnection | null
  branch: string | null
  schemaHash: string | null
  initialSchemaCatalogue?: readonly SchemaCatalogueRecord[]
  retryGeneration?: number
}

function createInspectorRuntimeStore(
  isWasmSchemaLoading: boolean,
  sensitiveValues: readonly string[],
  startMetadataRequests?: () => RuntimeMetadataRequests,
): MutableInspectorRuntimeStore {
  const $client = atom<JazzClient | null>(null)
  const $wasmSchema = atom<WasmSchema | null>(null)
  const $storedPermissions = atom<StoredPermissionsResponse | null>(null)
  const $schemaCatalogue = atom<readonly SchemaCatalogueRecord[]>([])
  const $error = atom<InspectorRuntimeError | null>(null)
  const $isPermissionsLoading = atom(isWasmSchemaLoading)
  const $isWasmSchemaLoading = atom(isWasmSchemaLoading)
  let metadataRequests: RuntimeMetadataRequests | null = null

  const getMetadataRequests = () => {
    if (startMetadataRequests === undefined) {
      return null
    }
    metadataRequests ??= startMetadataRequests()
    return metadataRequests
  }

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

  const publishSchemaError = (error: unknown) => {
    if ($error.get() === null) {
      const runtimeError = { source: 'schema', error: normalizeRuntimeError(error) } as const
      $error.set(runtimeError)
      reportRuntimeError(runtimeError, sensitiveValues)
    }
    $isWasmSchemaLoading.set(false)
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
    getMetadataRequests,
    publishClient,
    publishClientError,
    publishSchemaError,
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
        connection === null || branch === null || schemaHash === null
          ? undefined
          : () => ({
              permissions: fetchStoredPermissions(connection.serverUrl, {
                appId: connection.appId,
                adminSecret: connection.adminSecret,
              }),
              schema: fetchStoredWasmSchema(connection.serverUrl, {
                appId: connection.appId,
                adminSecret: connection.adminSecret,
                schemaHash,
              }),
            }),
      ),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Retry intentionally replaces the runtime store.
    [branch, connection, retryGeneration, schemaHash],
  )

  useEffect(() => {
    runtime.$schemaCatalogue.set(initialSchemaCatalogue ?? [])
  }, [initialSchemaCatalogue, runtime])

  useEffect(() => {
    const requests = runtime.getMetadataRequests()
    if (requests === null) return

    let active = true
    void requests.schema.then(
      ({ schema }) => {
        if (active === true) {
          runtime.$wasmSchema.set(schema)
          runtime.$isWasmSchemaLoading.set(false)
        }
      },
      (error: unknown) => {
        if (active === true) runtime.publishSchemaError(error)
      },
    )
    void requests.permissions.then(
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

    return () => {
      active = false
    }
  }, [runtime])

  return runtime
}
