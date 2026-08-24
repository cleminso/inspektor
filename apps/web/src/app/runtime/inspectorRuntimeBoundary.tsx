import { useEffect, type PropsWithChildren } from 'react'

import { InspectorProvider } from '@app/providers/inspectorProvider'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import type { ResolvedTablesNavigationTarget } from '@app/routing/inspectorNavigation'

interface InspectorRuntimeBoundaryProps extends PropsWithChildren {
  target: ResolvedTablesNavigationTarget
}

/**
 * Synchronizes a route-resolved target with session state before mounting the Jazz runtime.
 *
 * Route loaders and session preferences update through different mechanisms. Rendering nothing
 * while they disagree prevents a new route from observing the previous connection's runtime. A
 * rejected synchronization also stays unmounted instead of marking an attempted target as applied.
 */
export function InspectorRuntimeBoundary({
  children,
  target,
}: InspectorRuntimeBoundaryProps): React.ReactElement | null {
  const { currentBranch, currentConnectionId, currentSchemaHash, setConnectionContext } =
    useInspectorSessionContext()
  const isContextReady =
    currentConnectionId === target.connectionId &&
    currentBranch === target.branch &&
    currentSchemaHash === target.schemaHash

  useEffect(() => {
    if (isContextReady === false) {
      setConnectionContext(target.connectionId, target.branch, target.schemaHash)
    }
  }, [isContextReady, setConnectionContext, target.branch, target.connectionId, target.schemaHash])

  if (isContextReady === false) {
    return null
  }

  return <InspectorProvider initialRuntimeTarget={target}>{children}</InspectorProvider>
}
