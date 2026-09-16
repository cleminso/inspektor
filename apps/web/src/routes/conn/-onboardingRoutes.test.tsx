import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    <TOptions,>(options: TOptions) => ({
      ...options,
      useParams: () => ({ connectionId: 'connection-1' }),
    }),
}))

vi.mock('@onboarding/connectionsLayout', () => ({
  ConnectionsLayout: ({
    children,
    connectionTriggerLabel,
    pageTitle,
  }: {
    children: React.ReactNode
    connectionTriggerLabel?: string
    pageTitle: string
  }) => (
    <>
      <header>{connectionTriggerLabel ?? 'Current connection'}</header>
      <main aria-label={pageTitle}>{children}</main>
    </>
  ),
}))

vi.mock('@onboarding/addConnectionView', () => ({
  AddConnectionView: () => <div>Add form</div>,
}))
vi.mock('@onboarding/editConnectionView', () => ({
  EditConnectionView: ({ connectionId }: { connectionId: string }) => (
    <div>Edit {connectionId}</div>
  ),
}))
vi.mock('@onboarding/view', () => ({
  ConnectionsView: () => <div>Connections list</div>,
}))

const { AddConnectionRoute } = await import('./new')
const { ConnectionsIndexRoute } = await import('./index')
const { EditConnectionRoute } = await import('./edit/$connectionId')

afterEach(cleanup)

describe('connection onboarding routes', () => {
  it('renders the connections index in the generic onboarding layout', () => {
    render(<ConnectionsIndexRoute />)

    expect(screen.getByRole('banner').textContent).toBe('Open connection')
    expect(screen.getByRole('main', { name: 'Connections' })).toBeTruthy()
    expect(screen.getByText('Connections list')).toBeTruthy()
  })

  it('renders the add form in the generic onboarding layout', () => {
    render(<AddConnectionRoute />)

    expect(screen.getByRole('banner').textContent).toBe('Open connection')
    expect(screen.getByRole('main', { name: 'Add connection' })).toBeTruthy()
    expect(screen.getByText('Add form')).toBeTruthy()
  })

  it('renders the edit form with current connection context', () => {
    render(<EditConnectionRoute />)

    expect(screen.getByRole('banner').textContent).toBe('Current connection')
    expect(screen.getByRole('main', { name: 'Edit connection' })).toBeTruthy()
    expect(screen.getByText('Edit connection-1')).toBeTruthy()
  })
})
