import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BinaryDetails, BinaryValue } from './binaryValue'
import { Toaster } from '../toaster/toaster'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('BinaryValue', () => {
  it('renders a compact byte count from byteLength', () => {
    render(<BinaryValue byteLength={2_048} />)

    expect(screen.getByText('2KB')).toBeTruthy()
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'renders an explicit fallback for invalid byte count %s',
    (byteLength) => {
      render(<BinaryValue byteLength={byteLength} />)

      expect(screen.getByText('Invalid byte count')).toBeTruthy()
    },
  )

  it('does not accept bytes or styling escape hatches', () => {
    // @ts-expect-error BinaryValue does not receive binary data.
    const valueProp = <BinaryValue byteLength={0} value={new Uint8Array()} />
    // @ts-expect-error BinaryValue owns its styling.
    const styleProp = <BinaryValue byteLength={0} style={{ color: 'red' }} />

    expect(valueProp).toBeTruthy()
    expect(styleProp).toBeTruthy()
  })
})

describe('BinaryDetails', () => {
  it('omits binary actions when the byte count is invalid', () => {
    render(<BinaryDetails byteLength={-1} onCopy={() => undefined} onDownload={() => undefined} />)

    expect(screen.getByRole('textbox', { name: 'Binary value' }).getAttribute('value')).toBe(
      'Invalid byte count',
    )
    expect(screen.queryByRole('button', { name: 'Copy as' })).toBeNull()
  })

  it('requests each copy format and announces success', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined)
    render(
      <>
        <BinaryDetails byteLength={3} onCopy={onCopy} onDownload={() => undefined} />
        <Toaster />
      </>,
    )

    for (const [format, label] of [
      ['hex', 'Hex'],
      ['base64', 'Base64'],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: 'Copy as' }))
      fireEvent.click(screen.getByRole('menuitem', { name: label }))

      await vi.waitFor(() => expect(onCopy).toHaveBeenLastCalledWith(format))
      await vi.waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe(`Copied as ${label}`),
      )
      await vi.waitFor(() => expect(screen.getAllByText(`Copied as ${label}`)).toHaveLength(2))
    }
  })

  it('delegates download lifecycle and announces success', async () => {
    const onDownload = vi.fn().mockResolvedValue(undefined)
    render(<BinaryDetails byteLength={3} onCopy={() => undefined} onDownload={onDownload} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy as' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Download raw' }))

    await vi.waitFor(() => expect(onDownload).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toBe('Download started'))
  })

  it('announces callback failures', async () => {
    render(
      <BinaryDetails
        byteLength={3}
        onCopy={() => Promise.reject(new Error('copy failed'))}
        onDownload={() => Promise.reject(new Error('download failed'))}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy as' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hex' }))
    await vi.waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Could not copy as Hex'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy as' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Download raw' }))
    await vi.waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Could not download'),
    )
  })

  it('does not accept bytes', () => {
    const valueProp = (
      <BinaryDetails
        byteLength={0}
        onCopy={() => undefined}
        onDownload={() => undefined}
        // @ts-expect-error BinaryDetails delegates transformation to callbacks.
        value={new Uint8Array()}
      />
    )

    expect(valueProp).toBeTruthy()
  })
})
