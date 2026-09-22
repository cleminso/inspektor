import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectionContentBoundary, useConnectionContentReady } from './connectionContentBoundary'

const runtime = vi.hoisted(() => ({ error: null as Error | null }))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeError: () => runtime.error,
}))

function Content({ ready }: { ready: boolean }): React.ReactElement {
  useConnectionContentReady(ready)
  return <div>Workspace</div>
}

function boundary(ready: boolean, readinessKey?: string): React.ReactElement {
  return (
    <ConnectionContentBoundary
      fallback={<div role="status">Loading</div>}
      readinessKey={readinessKey}
    >
      <Content ready={ready} />
    </ConnectionContentBoundary>
  )
}

afterEach(() => {
  cleanup()
  runtime.error = null
})

describe('ConnectionContentBoundary', () => {
  it('keeps mounted content hidden behind one loading view until it reports ready', async () => {
    const { rerender } = render(boundary(false))

    expect(screen.getByRole('status').textContent).toBe('Loading')
    expect(screen.getByText('Workspace').parentElement?.getAttribute('aria-hidden')).toBe('true')

    rerender(boundary(true))

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.getByText('Workspace').parentElement?.getAttribute('aria-hidden')).toBe('false')
  })

  it('reveals runtime errors instead of leaving the loading view mounted', () => {
    const { rerender } = render(boundary(false))

    runtime.error = new Error('Runtime failed')
    rerender(boundary(false))

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('hides a new route identity until that exact content reports ready', () => {
    const { rerender } = render(boundary(true, 'accounts:1'))
    expect(screen.queryByRole('status')).toBeNull()

    rerender(boundary(false, 'accounts:2'))

    expect(screen.getByRole('status').textContent).toBe('Loading')
    expect(screen.getByText('Workspace').parentElement?.getAttribute('aria-hidden')).toBe('true')
  })
})
