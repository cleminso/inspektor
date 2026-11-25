import { useEffect, useMemo } from 'react'
import { Effect, Fiber, Stream } from 'effect'
import { atom, type ReadableAtom } from 'nanostores'

import type { PublishedBundle, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { acquireAdminClient } from '@inspektor/core/jazz/client'
import { fetchLatestPermissions, fetchStoredSchema } from '@inspektor/core/jazz/schema'
import { openSession, type Session, type SessionState } from '@inspektor/core/session'

import type { RuntimeConnection } from '@app/connections/connections'
import type { SchemaCatalogueRecord } from '@app/routing/inspectorNavigation'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
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
  $storedPermissions: ReadableAtom<PublishedBundle | null>
  $wasmSchema: ReadableAtom<WasmSchema | null>
  publishClientError: (error: unknown) => void
}

interface UseInspectorRuntimeOptions {
  connection: RuntimeConnection | null
  branch: string | null
  schemaHash: string | null
  initialSchemaCatalogue?: readonly SchemaCatalogueRecord[]
  retryGeneration?: number
}

function createInspectorRuntimeStore(loading: boolean, sensitiveValues: readonly string[]) {
  const $client = atom<JazzClient | null>(null)
  const $wasmSchema = atom<WasmSchema | null>(null)
  const $storedPermissions = atom<PublishedBundle | null>(null)
  const $schemaCatalogue = atom<readonly SchemaCatalogueRecord[]>([])
  const $error = atom<InspectorRuntimeError | null>(null)
  const $isPermissionsLoading = atom(loading)
  const $isWasmSchemaLoading = atom(loading)
  let session: Session<JazzClient> | null = null

  return {
    $client,
    $error,
    $isPermissionsLoading,
    $isWasmSchemaLoading,
    $schemaCatalogue,
    $storedPermissions,
    $wasmSchema,
    attach: (current: Session<JazzClient>) => {
      session = current
      return () => {
        if (session === current) session = null
      }
    },
    publish: (state: SessionState<JazzClient>) => {
      $client.set(state.status === 'active' ? state.client : null)
      $wasmSchema.set(state.schema.status === 'ready' ? state.schema.value : null)
      $isWasmSchemaLoading.set(state.status === 'opening' && state.schema.status === 'loading')
      $isPermissionsLoading.set(state.permissions.status === 'loading')
      $storedPermissions.set(state.permissions.status === 'ready' ? state.permissions.value : null)
      if (state.status === 'failed' && $error.get() === null) {
        const error: InspectorRuntimeError = {
          source: state.error.source,
          error: normalizeRuntimeError(state.error.cause),
        }
        $error.set(error)
        reportRuntimeError(error, sensitiveValues)
      }
    },
    publishClientError: (cause: unknown) => {
      if (session !== null) void Effect.runPromise(session.failClient(cause))
    },
  }
}

/**
 * React owns the scope attachment and browser preparation. Core owns startup,
 * schema-gated publication, failure, and retirement. Nanostores are UI projections.
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Retry retires the old scope and its projections.
    [branch, connection, retryGeneration, schemaHash],
  )

  useEffect(() => {
    runtime.$schemaCatalogue.set(initialSchemaCatalogue ?? [])
  }, [initialSchemaCatalogue, runtime])

  useEffect(() => {
    if (connection === null || branch === null || schemaHash === null) return
    let active = true
    let detach = () => {}
    const config = {
      appId: connection.appId,
      serverUrl: connection.serverUrl,
      env: connection.env,
      adminSecret: connection.adminSecret,
    }
    const program = Effect.scoped(
      Effect.gen(function* () {
        const session = yield* openSession({
          acquireClient: Effect.tryPromise({
            try: () => prepareJazzWasm(),
            catch: (cause) => cause,
          }).pipe(Effect.andThen(acquireAdminClient(config))),
          loadSchema: fetchStoredSchema(connection, schemaHash),
          loadPermissions: fetchLatestPermissions(connection),
        })
        if (active === false) return
        detach = runtime.attach(session)
        yield* Stream.runForEach(session.changes, (state) =>
          Effect.sync(() => {
            if (active === true) runtime.publish(state)
          }),
        )
      }),
    )
    const fiber = Effect.runFork(program)
    return () => {
      active = false
      detach()
      void Effect.runPromise(Fiber.interrupt(fiber))
    }
  }, [branch, connection, runtime, schemaHash])

  return runtime
}
