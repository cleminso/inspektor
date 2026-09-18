import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Box } from '@inspektor/ds'

import { useRuntimeError } from '@app/providers/inspectorProvider'

const ConnectionContentReadyContext = createContext<(() => void) | null>(null)

interface ConnectionContentBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
}

export function ConnectionContentBoundary({
  children,
  fallback,
}: ConnectionContentBoundaryProps): React.ReactElement {
  const [contentReady, setContentReady] = useState(false)
  const runtimeError = useRuntimeError()
  const reportReady = useCallback(() => setContentReady(true), [])
  const contentVisible = contentReady === true || runtimeError !== null

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

  useEffect(() => {
    if (ready === true) reportReady?.()
  }, [ready, reportReady])
}
