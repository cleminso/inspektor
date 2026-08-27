import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CopyButton } from './copyButton'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('CopyButton', () => {
  it('copies text and reports successful feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const onCopy = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(
      <CopyButton
        label="Copy query"
        copiedLabel="Query copied"
        onCopy={onCopy}
        textToCopy="select *"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy query' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('select *'))
    expect(onCopy).toHaveBeenCalledOnce()
    expect(screen.getByText('Query copied').getAttribute('aria-live')).toBe('polite')
  })

  it('reports clipboard failures without reporting success', async () => {
    const error = new Error('Clipboard denied')
    const onCopy = vi.fn()
    const onCopyError = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(error) } })

    render(
      <CopyButton
        label="Copy query"
        errorLabel="Could not copy query"
        onCopy={onCopy}
        onCopyError={onCopyError}
        textToCopy="select *"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy query' }))

    await waitFor(() => expect(onCopyError).toHaveBeenCalledWith(error))
    expect(onCopy).not.toHaveBeenCalled()
    expect(screen.getByText('Could not copy query')).toBeTruthy()
  })
})
