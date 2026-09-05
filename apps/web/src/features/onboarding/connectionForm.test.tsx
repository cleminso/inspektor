import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectionForm } from './connectionForm'

afterEach(cleanup)

describe('ConnectionForm', () => {
  const formValues = {
    name: '',
    serverUrl: 'https://v2.sync.jazz.tools/',
    appId: '',
    adminSecret: '',
    env: 'dev',
    branch: 'main',
  }

  it('renders field errors inline and focuses the invalid field', () => {
    const { rerender } = render(
      <ConnectionForm
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
        onFieldValueChange={vi.fn()}
      />,
    )

    rerender(
      <ConnectionForm
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
        onFieldValueChange={vi.fn()}
      />,
    )

    const serverUrl = screen.getByLabelText('Server URL')
    const error = screen.getByText('Enter a valid HTTP or HTTPS URL.')

    expect(serverUrl.getAttribute('aria-invalid')).toBe('true')
    expect(error.getAttribute('data-slot')).toBe('field-error')
    expect(serverUrl.getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
    expect(document.activeElement).toBe(serverUrl)
    expect(screen.queryByText('Invalid server URL')).toBeNull()
  })

  it.each([
    ['Server URL', 'Enter a server URL.'],
    ['Jazz app ID', 'Enter a Jazz app ID.'],
    ['Admin secret', 'Enter an admin secret.'],
  ])('shows the %s required error after the empty input loses focus', (label, message) => {
    render(
      <ConnectionForm
        error={null}
        formValues={{ ...formValues, serverUrl: '' }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(label)
    fireEvent.focus(input)
    fireEvent.blur(input)

    const error = screen.getByText(message)
    expect(input.hasAttribute('data-invalid')).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
  })

  it('renders connection-wide errors in the form status region', () => {
    render(
      <ConnectionForm
        error={{
          title: "Couldn't connect to this app",
          description: 'Check the server URL, app ID, and admin secret.',
        }}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('status').textContent).toContain("Couldn't connect to this app")
    expect(screen.getByRole('status').textContent).toContain(
      'Check the server URL, app ID, and admin secret.',
    )
  })

  it('uses aria-required and noValidate instead of native required validation', () => {
    const { container } = render(
      <ConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
      />,
    )

    expect(container.querySelector('form')?.hasAttribute('novalidate')).toBe(true)
    expect(screen.getByLabelText('Server URL').getAttribute('aria-required')).toBe('true')
    expect(screen.getByLabelText('Jazz app ID').getAttribute('aria-required')).toBe('true')
    expect(screen.getByLabelText('Admin secret').getAttribute('aria-required')).toBe('true')
    expect(screen.getByLabelText('Server URL').hasAttribute('required')).toBe(false)
    expect(screen.getByLabelText('Jazz app ID').hasAttribute('required')).toBe(false)
    expect(screen.getByLabelText('Admin secret').hasAttribute('required')).toBe(false)
  })

  it('disables the form controls while submitting', () => {
    const { rerender } = render(
      <ConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Save connection' }).hasAttribute('disabled')).toBe(
      false,
    )

    rerender(
      <ConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={true}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Save connection' }).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(screen.getByLabelText('Server URL').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Jazz app ID').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Admin secret').hasAttribute('disabled')).toBe(true)
  })

  it('uses URL and credential input semantics', () => {
    render(
      <ConnectionForm
        error={null}
        formValues={formValues}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onFieldValueChange={vi.fn()}
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
