import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { PublishedBundle, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { createExploration } from '@inspektor/core/workbench/exploration'
import type { ConnectionRuntime } from '@inspektor/core/workbench/connection'
import type { SchemaCatalogueLoadError } from '@app/connections/connectionValidation'
import { ExplorationProvider } from '@exploration/provider'

import { getConnectionDisplayName, type RuntimeConnection } from '@app/connections/connections'
import { useConnections, type ConnectionsContextValue } from '@app/connections/connectionProvider'
import type { ResolvedConnectionEntry } from '@app/connections/connectionEntry'
import { useConnectionRuntime } from './useConnectionRuntime'
import {
  normalizeRuntimeError,
  reportRuntimeError,
  type InspectorRuntimeError,
} from './runtimeError'

interface RuntimeContextValue {
  retry: () => void
  state: ReturnType<ConnectionRuntime['getSnapshot']>
  schemaCatalogue: ResolvedConnectionEntry['schemaCatalogue']
  error: InspectorRuntimeError | null
}

const ActiveWorkspaceContext = createContext<ConnectionsContextValue | null>(null)
const RuntimeContext = createContext<RuntimeContextValue | null>(null)
const resourceTokens = new WeakMap<object, number>()
let nextResourceToken = 0

/** Opaque native resource identity is appropriate for intentional view resets. */
export function getRuntimeResourceToken(resource: object): number {
  const existing = resourceTokens.get(resource)
  if (existing !== undefined) return existing
  const token = ++nextResourceToken
  resourceTokens.set(resource, token)
  return token
}

interface RuntimeProviderProps extends PropsWithChildren {
  target: ResolvedConnectionEntry
  connection: RuntimeConnection
}

/**
 * The committed entry selects this runtime. Preferences only record its selection.
 * Client creation is lazy; the first schema-bound subscription starts Jazz transport work.
 */
// @lat: [[runtimeConnectionStartup#Connection startup phases]]
export function RuntimeProvider({ children, target, connection }: RuntimeProviderProps) {
  const connections = useConnections()
  const [exploration] = useState(() => createExploration<SchemaCatalogueLoadError['reason']>())
  const retry = useCallback(() => exploration.retry(), [exploration])
  const { runtime, state, execution } = useConnectionRuntime({
    connection,
    branch: target.branch,
    schemaHash: target.schemaHash,
    onResumeRetry: retry,
  })
  const scopeKey = JSON.stringify([target.executionIdentity, target.branch, target.schemaHash])
  const failure = state.status === 'failed' ? state.error : null
  const error = useMemo<InspectorRuntimeError | null>(
    () =>
      failure === null
        ? null
        : { source: failure.source, error: normalizeRuntimeError(failure.cause) },
    [failure],
  )
  useEffect(() => {
    if (error !== null) reportRuntimeError(error, [connection.adminSecret])
  }, [connection.adminSecret, error])
  const client = state.status === 'active' ? state.client : null
  const schema = state.schema.status === 'ready' ? state.schema.value : null
  const runtimeContext = useMemo(
    () => ({ retry, state, schemaCatalogue: target.schemaCatalogue, error }),
    [error, retry, state, target.schemaCatalogue],
  )

  const workspace = useMemo<ConnectionsContextValue>(
    () => ({
      ...connections,
      activeConnection: connection,
      currentConnectionId: target.connectionId,
      currentBranch: target.branch,
      currentSchemaHash: target.schemaHash,
      connectionLabel: getConnectionDisplayName(connection),
    }),
    [connection, connections, target.branch, target.connectionId, target.schemaHash],
  )

  return (
    <RuntimeContext.Provider value={runtimeContext}>
      <ActiveWorkspaceContext.Provider value={workspace}>
        <ExplorationProvider
          exploration={exploration}
          client={client}
          schema={schema}
          targetKey={scopeKey}
          connectionId={target.connectionId}
          connection={execution}
          replaceRuntime={runtime.retry}
        >
          {children}
        </ExplorationProvider>
      </ActiveWorkspaceContext.Provider>
    </RuntimeContext.Provider>
  )
}

export function useActiveWorkspace(): ConnectionsContextValue {
  const context = useContext(ActiveWorkspaceContext)
  if (context === null) throw new Error('useActiveWorkspace must be used within RuntimeProvider')
  return context
}

function useRuntimeContext(): RuntimeContextValue {
  const context = useContext(RuntimeContext)
  if (context === null) throw new Error('Runtime projections must be used within RuntimeProvider')
  return context
}

function useRuntimeSnapshot() {
  return useRuntimeContext().state
}

export function useRuntimeClient(): JazzClient | null {
  const state = useRuntimeSnapshot()
  return state.status === 'active' ? state.client : null
}

export function useRuntimeSchema(): WasmSchema | null {
  const state = useRuntimeSnapshot()
  return state.schema.status === 'ready' ? state.schema.value : null
}

export function useRuntimeSchemaHashes(): readonly string[] {
  return useRuntimeContext().schemaCatalogue.map(({ hash }) => hash)
}

export function useRuntimePermissions(): PublishedBundle | null {
  const state = useRuntimeSnapshot()
  return state.permissions.status === 'ready' ? state.permissions.value : null
}

export function useRuntimePermissionsLoading(): boolean {
  return useRuntimeSnapshot().permissions.status === 'loading'
}

export function useRuntimeError(): InspectorRuntimeError | null {
  return useRuntimeContext().error
}

export function useRuntimeRetry(): () => void {
  const context = useContext(RuntimeContext)
  if (context === null) throw new Error('useRuntimeRetry must be used within RuntimeProvider')
  return context.retry
}
