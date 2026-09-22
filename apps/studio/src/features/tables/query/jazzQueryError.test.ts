import { describe, expect, it } from 'vitest'

import { isRecoverableJazzTransportError } from '@tables/query/jazzQueryError'

describe('isRecoverableJazzTransportError', () => {
  it('recognizes the verified Jazz message-credit failure', () => {
    expect(
      isRecoverableJazzTransportError(new Error('message credit exceeds outstanding balance')),
    ).toBe(true)
  })

  it('does not recreate the runtime for unrelated query failures', () => {
    expect(isRecoverableJazzTransportError(new Error('Subscription rejected'))).toBe(false)
    expect(isRecoverableJazzTransportError('message credit exceeds outstanding balance')).toBe(
      false,
    )
  })
})
