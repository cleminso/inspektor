import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  createRowEditingWorkspace,
  type RowEditingWorkspace,
} from '@inspektor/core/workbench/rowEditing'

import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'
import { useRuntimeClient } from '@app/runtime/runtimeProvider'
import type { DynamicTableRow } from '@tables/tableTypes'

export const TableRowChangeWorkspaceContext =
  createContext<RowEditingWorkspace<DynamicTableRow> | null>(null)

/** React attaches the retained feature. Core owns drafts, admission, and native settlement. */
export function TableRowChangeWorkspaceProvider({
  children,
}: {
  children: ReactNode
}): React.ReactElement {
  const [workspace] = useState(() => createRowEditingWorkspace<DynamicTableRow>())
  const hasPending = useSyncExternalStore(
    workspace.subscribe,
    workspace.hasPendingChanges,
    workspace.hasPendingChanges,
  )
  const client = useRuntimeClient()
  const previousOwnerRef = useRef(client)
  useLayoutEffect(() => {
    const previous = previousOwnerRef.current
    previousOwnerRef.current = client
    if (previous !== null && previous !== client) workspace.retireOwner(previous)
  }, [client, workspace])
  useRegisterRuntimeScopeExitBlocker(hasPending)
  useEffect(() => {
    if (hasPending === false) return
    const preventExit = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', preventExit)
    return () => window.removeEventListener('beforeunload', preventExit)
  }, [hasPending])

  return (
    <TableRowChangeWorkspaceContext value={workspace}>{children}</TableRowChangeWorkspaceContext>
  )
}

/** Navigation reads feature admission synchronously; it does not manage draft or write state. */
export function useTableRowChangeWorkspace() {
  const workspace = use(TableRowChangeWorkspaceContext)
  if (workspace === null) {
    throw new Error('Row changes require TableRowChangeWorkspaceProvider')
  }
  return workspace
}
