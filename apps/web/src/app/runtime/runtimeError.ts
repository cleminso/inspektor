export interface InspectorRuntimeError {
  source: 'client' | 'schema'
  error: Error
}

export function normalizeRuntimeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error), { cause: error })
}

function redactSensitiveText(text: string, sensitiveValues: readonly string[]): string {
  return sensitiveValues.reduce(
    (redacted, sensitiveValue) =>
      sensitiveValue.length === 0 ? redacted : redacted.replaceAll(sensitiveValue, '[REDACTED]'),
    text,
  )
}

export function reportRuntimeError(
  runtimeError: InspectorRuntimeError,
  sensitiveValues: readonly string[],
): void {
  const diagnosticError = new Error(
    redactSensitiveText(runtimeError.error.message, sensitiveValues),
  )
  diagnosticError.name = redactSensitiveText(runtimeError.error.name, sensitiveValues)
  diagnosticError.stack = redactSensitiveText(runtimeError.error.stack ?? '', sensitiveValues)

  console.error('Inspector runtime failure', {
    source: runtimeError.source,
    error: diagnosticError,
  })
}

export function reportCaughtReactError(
  _error: unknown,
  errorInfo: { componentStack?: string | null },
): void {
  console.error('Caught React error', { componentStack: errorInfo.componentStack })
}
