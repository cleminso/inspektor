import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const loadAttempts = vi.hoisted(() => vi.fn())

vi.mock('./codeMirrorEditor', () => {
  loadAttempts()
  throw new Error('CodeMirror is unavailable')
})

import { CodeEditor } from './codeEditor'

afterEach(() => {
  cleanup()
})

describe('CodeEditor load failure', () => {
  it('reports a component-specific error and retries from a later mount', async () => {
    const firstRender = render(<CodeEditor accessibilityLabel="Settings JSON" value="{}" />)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'CodeEditor failed to load CodeMirror',
    )
    expect(loadAttempts).toHaveBeenCalledTimes(1)

    firstRender.unmount()
    render(<CodeEditor accessibilityLabel="Settings JSON" value="{}" />)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'CodeEditor failed to load CodeMirror',
    )
    expect(loadAttempts).toHaveBeenCalledTimes(2)
  })
})
