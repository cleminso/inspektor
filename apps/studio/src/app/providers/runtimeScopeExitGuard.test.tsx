import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  RuntimeScopeExitGuardProvider,
  useRegisterRuntimeScopeExitBlocker,
  useRuntimeScopeExitGuard,
} from '@app/providers/runtimeScopeExitGuard'

afterEach(cleanup)

function GuardHarness({ visible = true }: { visible?: boolean }): React.ReactElement {
  const [blocked, setBlocked] = useState(false)
  const guard = useRuntimeScopeExitGuard()

  return (
    <>
      {visible === true ? <RegisteredBlocker blocked={blocked} /> : null}
      <output aria-label="Runtime scope blocked">{String(guard.isBlocked())}</output>
      <button type="button" onClick={() => setBlocked(true)}>
        Add pending change
      </button>
      <button type="button" onClick={() => setBlocked(false)}>
        Discard
      </button>
    </>
  )
}

function RegisteredBlocker({ blocked }: { blocked: boolean }): null {
  useRegisterRuntimeScopeExitBlocker(blocked)
  return null
}

describe('RuntimeScopeExitGuardProvider', () => {
  it('blocks runtime-scope exit until the registered pending state clears', async () => {
    render(
      <RuntimeScopeExitGuardProvider>
        <GuardHarness />
      </RuntimeScopeExitGuardProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add pending change' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Runtime scope blocked').textContent).toBe('true'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByLabelText('Runtime scope blocked').textContent).toBe('false')
  })

  it('removes a blocker when its owner unmounts', async () => {
    const { rerender } = render(
      <RuntimeScopeExitGuardProvider>
        <GuardHarness />
      </RuntimeScopeExitGuardProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add pending change' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Runtime scope blocked').textContent).toBe('true'),
    )

    rerender(
      <RuntimeScopeExitGuardProvider>
        <GuardHarness visible={false} />
      </RuntimeScopeExitGuardProvider>,
    )

    expect(screen.getByLabelText('Runtime scope blocked').textContent).toBe('false')
  })
})
