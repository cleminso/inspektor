import { useCallback, useRef } from 'react'

type PerformConnectionOpen = (
  connectionId: string,
  knownSchemaHashes?: readonly string[],
) => Promise<void>

export function useConnectionOpenCoordinator(
  performOpen: PerformConnectionOpen,
): PerformConnectionOpen {
  const requestRef = useRef<Promise<void> | null>(null)

  return useCallback(
    (connectionId: string, knownSchemaHashes?: readonly string[]): Promise<void> => {
      if (requestRef.current !== null) {
        return Promise.resolve()
      }

      const request = performOpen(connectionId, knownSchemaHashes)
      requestRef.current = request

      return request.finally(() => {
        if (requestRef.current === request) {
          requestRef.current = null
        }
      })
    },
    [performOpen],
  )
}
