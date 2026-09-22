const RECOVERABLE_JAZZ_TRANSPORT_ERROR = 'message credit exceeds outstanding balance'

export const TABLE_QUERY_FAILURE_MESSAGE = 'Something went wrong while loading this table.'

/** Matches terminal Jazz transport failures that require a fresh runtime and subscription store. */
export function isRecoverableJazzTransportError(error: unknown): boolean {
  return error instanceof Error && error.message === RECOVERABLE_JAZZ_TRANSPORT_ERROR
}
