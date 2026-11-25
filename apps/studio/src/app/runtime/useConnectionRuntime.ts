import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { Effect } from 'effect'
import {
  createConnectionRuntime,
  type ConnectionExecution,
} from '@inspektor/core/workbench/connection'
import type { RuntimeConnection } from '@app/connections/connections'
import { clearAutomaticConnectionRecovery } from '@app/connections/connectionRecovery'
import { prepareJazzWasm } from './jazzWasmPreparation'

/** React attaches accepted execution. Browser visibility supplies signals, not retry policy. */
export function useConnectionRuntime({
  connection,
  branch,
  schemaHash,
  onResumeRetry,
}: {
  connection: RuntimeConnection
  branch: string
  schemaHash: string
  onResumeRetry: () => void
}) {
  const [visibility] = useState<{ hiddenAt: number | null }>(() => ({ hiddenAt: null }))
  const [runtime] = useState(() =>
    createConnectionRuntime({
      prepare: Effect.tryPromise({
        try: () => prepareJazzWasm(),
        catch: (cause) => cause,
      }),
      onResumeRetry,
      isHidden: () => {
        const hidden = document.visibilityState === 'hidden'
        visibility.hiddenAt = hidden === true ? Date.now() : null
        return hidden
      },
    }),
  )
  const { id, serverUrl, appId, env, adminSecret } = connection
  const execution = useMemo<ConnectionExecution>(
    () => ({ id, serverUrl, appId, env, adminSecret, branch, schemaHash }),
    [id, serverUrl, appId, env, adminSecret, branch, schemaHash],
  )
  const getSnapshot = useCallback(() => runtime.getSnapshotFor(execution), [execution, runtime])
  const state = useSyncExternalStore(runtime.subscribe, getSnapshot, getSnapshot)
  useLayoutEffect(() => runtime.connect(execution), [execution, runtime])
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        visibility.hiddenAt ??= Date.now()
        if (runtime.getSnapshot().status === 'active') clearAutomaticConnectionRecovery()
        runtime.suspend()
      } else {
        const hiddenDuration =
          visibility.hiddenAt === null ? null : Date.now() - visibility.hiddenAt
        visibility.hiddenAt = null
        runtime.resume(hiddenDuration)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [runtime, visibility])
  return { runtime, state, execution }
}
