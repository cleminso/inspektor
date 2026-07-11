import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseClipboardResult {
  copied: boolean
  error: Error | null
  copy: (text: string) => Promise<void>
}

function toClipboardError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error('Failed to copy text.')
}

export function useClipboard(timeout = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return clearPendingTimeout
  }, [clearPendingTimeout])

  const copy = useCallback(
    async (text: string) => {
      clearPendingTimeout()

      try {
        await navigator.clipboard.writeText(text)
        setError(null)
        setCopied(true)

        timeoutRef.current = window.setTimeout(() => {
          setCopied(false)
          timeoutRef.current = null
        }, timeout)
      } catch (unknownError) {
        const nextError = toClipboardError(unknownError)

        setCopied(false)
        setError(nextError)

        throw nextError
      }
    },
    [clearPendingTimeout, timeout],
  )

  return { copied, error, copy }
}
