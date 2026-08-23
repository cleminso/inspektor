import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AddConnectionForm } from './addConnectionForm'

afterEach(cleanup)

describe('AddConnectionForm', () => {
  const formValues = {
    name: '',
    serverUrl: 'https://v2.sync.jazz.tools/',
    appId: '',
    adminSecret: '',
    env: 'dev',
    branch: 'main',
  }

  it('renders applicable connection errors on their field and focuses it', () => {
    const { rerender } = render(
      <AddConnectionForm
        error={null}
        formValues={{
          ...formValues,
          serverUrl: 'ftp://example.com',
          appId: 'app',
          adminSecret: 'secret',
        }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    )

    rerender(
      <AddConnectionForm
        error={{
          title: 'Invalid server URL',
          description: 'Enter a valid HTTP or HTTPS URL.',
          field: 'serverUrl',
        }}
        formValues={{
          ...formValues,
          serverUrl: 'ftp://example.com',
          appId: 'app',
          adminSecret: 'secret',
        }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    )

    const serverUrl = screen.getByLabelText('Server URL')
    const error = screen.getByText('Enter a valid HTTP or HTTPS URL.')

    expect(serverUrl.getAttribute('aria-invalid')).toBe('true')
    expect(error.getAttribute('data-slot')).toBe('field-error')
    expect(document.activeElement).toBe(serverUrl)
    expect(screen.getByText('Invalid server URL')).toBeTruthy()
  })

  it('leaves submission available for native required validation and disables only while submitting', () => {
    const { rerender } = render(
      <AddConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Server URL').hasAttribute('required')).toBe(true)
    expect(screen.getByLabelText('App ID').hasAttribute('required')).toBe(true)
    expect(screen.getByLabelText('Admin secret').hasAttribute('required')).toBe(true)
    expect(screen.getByRole('button', { name: 'Add connection' }).hasAttribute('disabled')).toBe(
      false,
    )

    rerender(
      <AddConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={true}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Add connection' }).getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('uses URL and credential input semantics', () => {
    render(
      <AddConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    )

    const serverUrl = screen.getByLabelText('Server URL')
    const adminSecret = screen.getByLabelText('Admin secret')

    expect(serverUrl.getAttribute('autocomplete')).toBe('url')
    expect(serverUrl.getAttribute('type')).toBe('url')
    expect(serverUrl.getAttribute('inputmode')).toBe('url')
    expect(adminSecret.getAttribute('autocomplete')).toBe('off')
    expect(adminSecret.getAttribute('type')).toBe('password')
  })
})
