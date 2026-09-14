import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
} from 'react'
import { useStore } from '@nanostores/react'

import type { StoredPermissionsResponse, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
// Alpha.54 exposes browser admin client creation through this unstable development entry point.
import { createInspectorAdminClient } from 'jazz-tools/_dev/inspector-client'

import { useInspectorRuntime, type InspectorRuntimeStore } from '@app/runtime/useInspectorRuntime'
import type { InspectorRuntimeError } from '@app/runtime/runtimeError'
import type { ResolvedRuntimeTarget } from '@app/routing/inspectorNavigation'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import type { StoredConnection } from '@app/connections/connections'
import {
  useInspectorSessionContext,
  type InspectorSessionContextValue,
} from '@app/providers/inspectorSessionProvider'

type InspectorContextValue = InspectorSessionContextValue

interface InspectorRuntimeContextValue {
  retry: () => void
  runtime: InspectorRuntimeStore
}

const InspectorContext = createContext<InspectorContextValue | null>(null)
const InspectorRuntimeContext = createContext<InspectorRuntimeContextValue | null>(null)
const connectionIdentityTokens = new WeakMap<object, number>()
let nextConnectionIdentityToken = 0

/** Gives each connection object a remount key so credential changes replace the privileged client. */
export function getConnectionIdentityToken(connection: object): number {
  const existingToken = connectionIdentityTokens.get(connection)
  if (existingToken !== undefined) {
    return existingToken
  }

  nextConnectionIdentityToken += 1
  connectionIdentityTokens.set(connection, nextConnectionIdentityToken)
  return nextConnectionIdentityToken
}

interface InspectorProviderProps extends PropsWithChildren {
  initialRuntimeTarget?: ResolvedRuntimeTarget
}

/**
 * Owns one privileged Jazz client while stored schema verification runs in parallel.
 *
 * Publication remains gated on verified schema state. Stale resolutions and unmounts shut down the
 * client because it owns runtime and worker resources. Branch views belong to individual operations
 * and do not participate in this client identity.
 */
function RuntimeAdminClient({
  connection,
  runtime,
}: {
  connection: StoredConnection
  runtime: InspectorRuntimeStore
}) {
  const isWasmSchemaLoading = useStore(runtime.$isWasmSchemaLoading)
  const wasmSchema = useStore(runtime.$wasmSchema)
  const runtimeError = useStore(runtime.$error)
  const [client, setClient] = useState<JazzClient | null>(null)

  useEffect(() => {
    if (runtimeError !== null) {
      setClient(null)
      return
    }

    let active = true
    let ownedClient: JazzClient | null = null
    setClient(null)
    void prepareJazzWasm()
      .then(() => {
        if (active === false) {
          return null
        }
        return createInspectorAdminClient({
          appId: connection.appId,
          serverUrl: connection.serverUrl,
          env: connection.env,
          adminSecret: connection.adminSecret,
        })
      })
      .then(
        (createdClient) => {
          if (createdClient === null) {
            return
          }
          if (active === false) {
            void createdClient.shutdown()
            return
          }
          ownedClient = createdClient
          setClient(createdClient)
        },
        (error: unknown) => {
          if (active === true) {
            runtime.publishClientError(error)
          }
        },
      )

    return () => {
      active = false
      if (ownedClient !== null) {
        void ownedClient.shutdown()
      }
    }
  }, [connection, runtime, runtimeError])

  useEffect(() => {
    if (
      client === null ||
      isWasmSchemaLoading === true ||
      wasmSchema === null ||
      runtimeError !== null
    ) {
      return
    }

    runtime.publishClient(client)
    return () => runtime.clearClient(client)
  }, [client, isWasmSchemaLoading, runtime, runtimeError, wasmSchema])

  return null
}

function useRuntimeResumeRetry(runtime: InspectorRuntimeStore, retry: () => void): void {
  useEffect(() => {
    let retryOnResume = document.visibilityState === 'hidden'
    const retryIfNeeded = () => {
      if (
        retryOnResume === true &&
        document.visibilityState === 'visible' &&
        runtime.$error.get() !== null
      ) {
        retryOnResume = false
        retry()
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        retryOnResume = true
      } else {
        retryIfNeeded()
      }
    }

    const unsubscribeFromError = runtime.$error.subscribe(retryIfNeeded)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      unsubscribeFromError()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [retry, runtime])
}

/**
 * Turns a synchronized session target into active Jazz connectivity and runtime projections.
 *
 * Route resolution must complete and `InspectorRuntimeBoundary` must synchronize session identity
 * before this provider mounts. This boundary owns stored schema verification, permissions, Jazz
 * client lifecycle, runtime errors, and retry. It does not resolve connection-entry intent or own
 * workspace selection. Workspace children mount independently of client readiness and consume
 * nullable projections for their loading and error states.
 */
export function InspectorProvider({ children, initialRuntimeTarget }: InspectorProviderProps) {
  const session = useInspectorSessionContext()
  const [retryGeneration, retryRuntime] = useReducer((generation: number) => generation + 1, 0)
  const initialSchemaCatalogue =
    initialRuntimeTarget?.connectionId === session.currentConnectionId
      ? initialRuntimeTarget.schemaCatalogue
      : undefined

  const runtime = useInspectorRuntime({
    connection: session.activeConnection,
    branch: session.currentBranch,
    schemaHash: session.currentSchemaHash,
    initialSchemaCatalogue,
    retryGeneration,
  })
  const runtimeContext = useMemo(() => ({ retry: retryRuntime, runtime }), [retryRuntime, runtime])
  useRuntimeResumeRetry(runtime, retryRuntime)
  const clientIdentity =
    session.activeConnection === null
      ? null
      : `${session.activeConnection.id}:${getConnectionIdentityToken(session.activeConnection)}`
  const switchBranch = useCallback(
    (branch: string) =>
      session.switchBranch(
        branch,
        runtime.$schemaCatalogue.get().map(({ hash }) => hash),
      ),
    [runtime, session],
  )

  const value = useMemo<InspectorContextValue>(
    () => ({
      ...session,
      switchBranch,
    }),
    [session, switchBranch],
  )

  return (
    <InspectorRuntimeContext.Provider value={runtimeContext}>
      {session.activeConnection === null ? null : (
        <RuntimeAdminClient
          key={`${clientIdentity ?? 'unknown'}:${retryGeneration}`}
          connection={session.activeConnection}
          runtime={runtime}
        />
      )}
      <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>
    </InspectorRuntimeContext.Provider>
  )
}

export function useInspectorSessionState(): InspectorContextValue {
  const context = useContext(InspectorContext)
  if (context === null) {
    throw new Error('useInspectorSessionState must be used within InspectorProvider')
  }

  return context
}

function useInspectorRuntimeContext(): InspectorRuntimeStore {
  const context = useContext(InspectorRuntimeContext)
  if (context === null) {
    throw new Error('Runtime projections must be used within InspectorProvider')
  }
  return context.runtime
}

export function useRuntimeClient(): JazzClient | null {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$client)
}

export function useRuntimeSchema(): WasmSchema | null {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$wasmSchema)
}

export function useRuntimeSchemaHashes(): readonly string[] {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$schemaCatalogue).map(({ hash }) => hash)
}

export function useRuntimePermissions(): StoredPermissionsResponse | null {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$storedPermissions)
}

export function useRuntimePermissionsLoading(): boolean {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$isPermissionsLoading)
}

export function useRuntimeError(): InspectorRuntimeError | null {
  const runtime = useInspectorRuntimeContext()
  return useStore(runtime.$error)
}

export function useRuntimeRetry(): () => void {
  const context = useContext(InspectorRuntimeContext)
  if (context === null) {
    throw new Error('useRuntimeRetry must be used within InspectorProvider')
  }

  return context.retry
}
