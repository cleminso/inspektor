import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { useStore } from '@nanostores/react'

import type { StoredPermissionsResponse, WasmSchema } from 'jazz-tools'
import { JazzProvider, useJazzClient, type JazzClient } from 'jazz-tools/react'

import { useInspectorRuntime, type InspectorRuntimeStore } from '@app/runtime/useInspectorRuntime'
import type { InspectorRuntimeError } from '@app/runtime/runtimeError'
import type { ResolvedTablesNavigationTarget } from '@app/routing/inspectorNavigation'
import { getJazzWasmPreparation } from '@app/runtime/jazzWasmPreparation'
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
const connectionProfileTokens = new WeakMap<object, number>()
let nextConnectionProfileToken = 0

function getConnectionProfileToken(connection: object): number {
  const existingToken = connectionProfileTokens.get(connection)
  if (existingToken !== undefined) {
    return existingToken
  }

  nextConnectionProfileToken += 1
  connectionProfileTokens.set(connection, nextConnectionProfileToken)
  return nextConnectionProfileToken
}

interface InspectorProviderProps extends PropsWithChildren {
  initialRuntimeTarget?: ResolvedTablesNavigationTarget
}

/** Publishes the Jazz client only after stored schema verification makes it safe for consumers. */
function RuntimeClientProjection({ runtime }: { runtime: InspectorRuntimeStore }) {
  const client = useJazzClient()
  const isWasmSchemaLoading = useStore(runtime.$isWasmSchemaLoading)

  useEffect(() => {
    if (
      isWasmSchemaLoading === true ||
      runtime.$wasmSchema.get() === null ||
      runtime.$error.get() !== null
    ) {
      return
    }

    runtime.publishClient(client)
    return () => {
      runtime.clearClient(client)
    }
  }, [client, isWasmSchemaLoading, runtime])

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

interface RuntimeClientErrorBoundaryProps {
  children: ReactNode
  onError: (error: unknown) => void
}

interface RuntimeClientErrorBoundaryState {
  failed: boolean
}

class RuntimeClientErrorBoundary extends Component<
  RuntimeClientErrorBoundaryProps,
  RuntimeClientErrorBoundaryState
> {
  state: RuntimeClientErrorBoundaryState = {
    failed: false,
  }

  static getDerivedStateFromError(): Partial<RuntimeClientErrorBoundaryState> {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed === true ? null : this.props.children
  }
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
  const wasmPreparation = getJazzWasmPreparation()
  const [settledWasmPreparation, setSettledWasmPreparation] = useState<Promise<void> | null>(null)
  const canStartJazzProvider =
    wasmPreparation === null || settledWasmPreparation === wasmPreparation
  useEffect(() => {
    if (wasmPreparation === null) {
      return
    }

    let active = true
    void wasmPreparation.then(() => {
      if (active === true) {
        setSettledWasmPreparation(wasmPreparation)
      }
    })
    return () => {
      active = false
    }
  }, [wasmPreparation])
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
  const clientConfig = useMemo(
    () =>
      session.activeConnection !== null && session.currentBranch !== null
        ? {
            appId: session.activeConnection.appId,
            serverUrl: session.activeConnection.serverUrl,
            env: session.activeConnection.env,
            userBranch: session.currentBranch,
            adminSecret: session.activeConnection.adminSecret,
            driver: { type: 'memory' as const },
          }
        : null,
    [session.activeConnection, session.currentBranch],
  )
  const clientIdentity =
    session.activeConnection !== null && session.currentBranch !== null
      ? JSON.stringify([
          session.activeConnection.id,
          getConnectionProfileToken(session.activeConnection),
          session.currentBranch,
        ])
      : null
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
      {clientConfig === null || canStartJazzProvider === false ? null : (
        <RuntimeClientErrorBoundary
          key={`${clientIdentity ?? 'unknown'}:${retryGeneration}`}
          onError={runtime.publishClientError}
        >
          <JazzProvider
            autoAttachDevTools={false}
            config={clientConfig}
            fallback={null}
          >
            <RuntimeClientProjection runtime={runtime} />
          </JazzProvider>
        </RuntimeClientErrorBoundary>
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
