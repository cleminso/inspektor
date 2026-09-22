import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react'

import { Box } from '@inspektor/ds'

import { useRuntimeError } from '@app/providers/inspectorProvider'

const ConnectionContentReadyContext = createContext<(() => void) | null>(null)

interface ConnectionContentBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
  readinessKey?: string
}

export function ConnectionContentBoundary({
  children,
  fallback,
  readinessKey = 'connection-content',
}: ConnectionContentBoundaryProps): React.ReactElement {
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const runtimeError = useRuntimeError()
  const reportReady = useCallback(() => setReadyKey(readinessKey), [readinessKey])
  const contentVisible = readyKey === readinessKey || runtimeError !== null

  return (
    <ConnectionContentReadyContext.Provider value={reportReady}>
      <Box
        minHeight={0}
        minWidth={0}
        flex={1}
        visibility={contentVisible === true ? 'visible' : 'hidden'}
        aria-hidden={contentVisible === false}
      >
        {children}
      </Box>
      {contentVisible === true ? null : fallback}
    </ConnectionContentReadyContext.Provider>
  )
}

export function useConnectionContentReady(ready: boolean): void {
  const reportReady = useContext(ConnectionContentReadyContext)

  useLayoutEffect(() => {
    if (ready === true) reportReady?.()
  }, [ready, reportReady])
}
