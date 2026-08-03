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
})
